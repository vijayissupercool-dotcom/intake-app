import { deleteObject } from "@/lib/r2/client";
import {
  getDriveClient,
  refreshAccessToken,
} from "@/lib/drive/client";
import { createServiceClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";
import { sendNewUploadEmail } from "@/lib/email/templates";
import { env } from "@/lib/config/env";

interface TransferJob {
  uploadId: string;
  r2Key: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  requestId: string;
  userId: string;
}

// Retry delays in milliseconds: 1min, 5min, 15min, 1hr
const RETRY_DELAYS = [60_000, 300_000, 900_000, 3_600_000];

export async function processTransfer(job: TransferJob) {
  const supabase = await createServiceClient();

  // Idempotency check: if already completed, skip
  const { data: existingUpload } = await supabase
    .from("uploads")
    .select("status, drive_file_id")
    .eq("id", job.uploadId)
    .single();

  if (existingUpload?.status === "completed" && existingUpload.drive_file_id) {
    return { success: true, driveFileId: existingUpload.drive_file_id, skipped: true };
  }

  try {
    // 1. Mark upload as transferring
    await supabase
      .from("uploads")
      .update({
        status: "transferring",
        started_at: new Date().toISOString(),
      })
      .eq("id", job.uploadId);

    // 2. Get the user's Google tokens
    const { data: connection, error: connError } = await supabase
      .from("google_connections")
      .select("*")
      .eq("user_id", job.userId)
      .single();

    if (connError || !connection) {
      throw new Error("Google Drive not connected");
    }

    // 3. Refresh access token if needed
    let accessToken = connection.access_token;
    const refreshToken = connection.refresh_token;

    if (
      connection.token_expiry &&
      new Date(connection.token_expiry) < new Date(Date.now() + 5 * 60 * 1000)
    ) {
      const refreshed = await refreshAccessToken(refreshToken);
      accessToken = refreshed.access_token!;

      await supabase
        .from("google_connections")
        .update({
          access_token: refreshed.access_token,
          token_expiry: refreshed.expiry_date
            ? new Date(refreshed.expiry_date).toISOString()
            : null,
        })
        .eq("user_id", job.userId);
    }

    // 4. Get request to find target folder
    const { data: request } = await supabase
      .from("requests")
      .select("drive_folder_id")
      .eq("id", job.requestId)
      .single();

    if (!request?.drive_folder_id) {
      throw new Error("Request folder not found");
    }

    // 5. Stream from R2 to Google Drive (no full buffer in memory)
    const drive = getDriveClient({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    // Get R2 object as stream
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const { r2Client } = await import("@/lib/r2/client");

    const r2Response = await r2Client.send(
      new GetObjectCommand({
        Bucket: env.r2.bucketName,
        Key: job.r2Key,
      })
    );

    if (!r2Response.Body) {
      throw new Error("R2 object has no body");
    }

    // Convert AWS SDK stream to Node.js Readable
    const { Readable } = await import("stream");
    const webStream = r2Response.Body.transformToWebStream();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodeStream = Readable.fromWeb(webStream as any);

    // 6. Upload to Google Drive using streaming
    const fileMetadata: Record<string, unknown> = {
      name: job.fileName,
    };
    if (request.drive_folder_id) {
      fileMetadata.parents = [request.drive_folder_id];
    }

    const media = {
      mimeType: job.fileType,
      body: nodeStream,
    };

    const driveFile = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id, name, mimeType, size, createdTime",
    });

    if (!driveFile.data.id) {
      throw new Error("Drive upload succeeded but no file ID returned");
    }

    // 7. Mark upload as completed
    await supabase
      .from("uploads")
      .update({
        status: "completed",
        drive_file_id: driveFile.data.id,
        drive_file_url: `https://drive.google.com/file/d/${driveFile.data.id}/view`,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.uploadId);

    // 8. Mark transfer job as completed
    await supabase
      .from("transfer_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("upload_id", job.uploadId);

    // 9. Clean up R2 object
    await deleteObject(job.r2Key);

    // 10. Create in-app notification (non-blocking)
    createNotification({
      userId: job.userId,
      type: "upload_completed",
      title: "New file received",
      message: `"${job.fileName}" was added to your request.`,
      metadata: {
        uploadId: job.uploadId,
        requestId: job.requestId,
        driveFileId: driveFile.data.id,
      },
    }).catch((e) => console.error("Notification failed:", e));

    // 11. Send email notification if enabled (non-blocking, never fails transfer)
    try {
      const { data: requestMeta } = await supabase
        .from("requests")
        .select("notify_email, title")
        .eq("id", job.requestId)
        .single();

      if (requestMeta?.notify_email) {
        const { data: userProfile } = await supabase
          .from("users")
          .select("email")
          .eq("id", job.userId)
          .single();

        if (userProfile?.email) {
          await sendNewUploadEmail({
            toEmail: userProfile.email,
            requestTitle: requestMeta.title,
            fileName: job.fileName,
            fileSizeMb: (job.fileSize / 1024 / 1024).toFixed(2) + " MB",
            requestUrl: `${env.app.url}/requests/${job.requestId}`,
          });
        }
      }
    } catch (emailError) {
      console.error("Email notification failed (non-critical):", emailError);
    }

    return { success: true, driveFileId: driveFile.data.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Get current attempt count
    const { data: upload } = await supabase
      .from("uploads")
      .select("transfer_attempts")
      .eq("id", job.uploadId)
      .single();

    const attempts = (upload?.transfer_attempts || 0) + 1;

    // Update upload with error info
    await supabase
      .from("uploads")
      .update({
        status: attempts >= 5 ? "dead_letter" : "failed",
        transfer_attempts: attempts,
        last_transfer_error: errorMessage,
      })
      .eq("id", job.uploadId);

    // Update transfer job with retry scheduling
    const nextDelay = RETRY_DELAYS[Math.min(attempts - 1, RETRY_DELAYS.length - 1)];
    const isRetryable = isRetryableError(error);

    if (isRetryable && attempts < 5) {
      await supabase
        .from("transfer_jobs")
        .update({
          status: "queued",
          attempts,
          last_error: errorMessage,
          available_at: new Date(Date.now() + nextDelay).toISOString(),
        })
        .eq("upload_id", job.uploadId);
    } else {
      await supabase
        .from("transfer_jobs")
        .update({
          status: "dead_letter",
          attempts,
          last_error: errorMessage,
        })
        .eq("upload_id", job.uploadId);
    }

    throw error;
  }
}

function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();

  // Retryable: network issues, rate limits, temporary server errors
  if (message.includes("timeout")) return true;
  if (message.includes("econnreset")) return true;
  if (message.includes("429")) return true;
  if (message.includes("500")) return true;
  if (message.includes("502")) return true;
  if (message.includes("503")) return true;
  if (message.includes("504")) return true;
  if (message.includes("rate limit")) return true;
  if (message.includes("quota")) return true;

  // Non-retryable: permission issues, not found, invalid request
  if (message.includes("403")) return false;
  if (message.includes("404")) return false;
  if (message.includes("401")) return false;
  if (message.includes("permission")) return false;
  if (message.includes("not found")) return false;
  if (message.includes("revoked")) return false;

  return true; // Default to retryable for unknown errors
}
