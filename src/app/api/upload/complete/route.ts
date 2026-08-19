import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

/**
 * Called by the public upload page AFTER the file is successfully uploaded
 * to R2. This marks the upload as "uploaded" and queues a transfer job.
 * The actual Drive transfer happens asynchronously via the worker.
 *
 * This endpoint must return quickly — never do synchronous Drive transfer here.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const rateLimit = checkRateLimit(`complete:${ip}`, { windowMs: 60_000, maxRequests: 30 });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  const { uploadId } = await request.json();

  if (!uploadId) {
    return NextResponse.json(
      { error: "uploadId is required" },
      { status: 400, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  const supabase = await createServiceClient();

  const { data: upload, error: uploadError } = await supabase
    .from("uploads")
    .select("id, r2_key, file_name, file_type, file_size, request_id, status")
    .eq("id", uploadId)
    .single();

  if (uploadError || !upload) {
    return NextResponse.json(
      { error: "Upload not found" },
      { status: 404, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  if (upload.status !== "pending" && upload.status !== "uploading") {
    return NextResponse.json(
      { error: `Upload status is ${upload.status}, cannot complete` },
      { status: 400, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  // Verify R2 object exists before marking as uploaded
  try {
    const { HeadObjectCommand } = await import("@aws-sdk/client-s3");
    const { r2Client } = await import("@/lib/r2/client");
    const { env } = await import("@/lib/config/env");

    await r2Client.send(
      new HeadObjectCommand({
        Bucket: env.r2.bucketName,
        Key: upload.r2_key,
      })
    );
  } catch {
    return NextResponse.json(
      { error: "Upload not found in storage. Please try uploading again." },
      { status: 404, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  // Mark as uploaded — worker will pick it up
  await supabase
    .from("uploads")
    .update({
      status: "uploaded",
      uploaded_at: new Date().toISOString(),
    })
    .eq("id", uploadId);

  // Create a transfer job for the worker to process
  await supabase.from("transfer_jobs").insert({
    upload_id: uploadId,
    status: "queued",
    attempts: 0,
    idempotency_key: uploadId,
  });

  return NextResponse.json(
    { success: true, message: "Upload queued for delivery to Google Drive" },
    { headers: getRateLimitHeaders(rateLimit) }
  );
}
