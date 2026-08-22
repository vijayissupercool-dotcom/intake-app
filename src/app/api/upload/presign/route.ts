import { NextRequest, NextResponse } from "next/server";
import { getPresignedUploadUrl } from "@/lib/r2/client";
import { createServiceClient } from "@/lib/supabase/server";
import { uploadMetadataSchema } from "@/lib/validators";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { validatePublicSession } from "@/lib/public-sessions";
import { QuotaEnforcementService } from "@/lib/domain/services";
import { sanitizeFileName, toKeySafeFileName } from "@/lib/filename";

export async function POST(request: NextRequest) {
  // Rate limit: 10 uploads per minute per IP
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const rateLimit = checkRateLimit(`upload:${ip}`, { windowMs: 60_000, maxRequests: 10 });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many upload requests. Please try again later." },
      { status: 429, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  const body = await request.json();
  const parsed = uploadMetadataSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  const {
    requestId,
    sessionToken,
    submissionId,
    requestItemId,
    fileName,
    fileSize,
    fileType,
    uploaderName,
    uploaderEmail,
  } = parsed.data;

  const supabase = await createServiceClient();

  let resolvedRequestId: string | undefined = requestId;

  // If a session token is provided, validate it and derive the request_id
  // This prevents IDOR: the client cannot specify an arbitrary request_id
  if (sessionToken) {
    const { session, error: sessionError } = await validatePublicSession(sessionToken);

    if (!session) {
      const status = sessionError?.includes("expired") ? 410 : 401;
      return NextResponse.json(
        { error: sessionError || "Invalid session" },
        { status, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    resolvedRequestId = session.request_id;

    // Validate that submissionId and requestItemId (if provided) belong to this request
    if (submissionId || requestItemId) {
      let ownershipChecked = true;

      if (submissionId) {
        const { data: sub } = await supabase
          .from("submissions")
          .select("request_id")
          .eq("id", submissionId)
          .single();
        if (!sub || sub.request_id !== session.request_id) {
          ownershipChecked = false;
        }
      }

      if (requestItemId) {
        const { data: item } = await supabase
          .from("request_items")
          .select("request_id")
          .eq("id", requestItemId)
          .single();
        if (!item || item.request_id !== session.request_id) {
          ownershipChecked = false;
        }
      }

      if (!ownershipChecked) {
        return NextResponse.json(
          { error: "Submission or item does not belong to this request" },
          { status: 403, headers: getRateLimitHeaders(rateLimit) }
        );
      }
    }
  } else {
    // No session token — require requestId for admin/internal flows
    if (!resolvedRequestId) {
      return NextResponse.json(
        { error: "Either requestId or sessionToken is required" },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }
  }

  // Verify the request exists and is active
  const { data: req, error: reqError } = await supabase
    .from("requests")
    .select("id, max_files, max_file_size_mb, allowed_file_types, expires_at, active, require_uploader_name, require_uploader_email")
    .eq("id", resolvedRequestId)
    .eq("active", true)
    .single();

  if (reqError || !req) {
    return NextResponse.json(
      { error: "Request not found or inactive" },
      { status: 404, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  // Check expiration
  if (req.expires_at && new Date(req.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "This request has expired" },
      { status: 410, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  // Check file size limit using domain service
  const maxFileSizeBytes = req.max_file_size_mb * 1024 * 1024;
  if (!QuotaEnforcementService.isValidFileSize(fileSize, maxFileSizeBytes)) {
    return NextResponse.json(
      { error: `File size exceeds the ${req.max_file_size_mb} MB limit` },
      { status: 413, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  // Check file type if restricted using domain service
  if (!QuotaEnforcementService.isFileTypeAllowed(fileType, req.allowed_file_types)) {
    return NextResponse.json(
      { error: "File type not allowed for this request" },
      { status: 415, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  // Check file count limit using reservation model (Phase 6)
  // This reserves a slot without incrementing upload_count
  const { data: reservation, error: reservationError } = await supabase.rpc(
    "reserve_upload_slot",
    {
      p_request_id: resolvedRequestId,
      p_file_name: fileName,
      p_file_size: fileSize,
      p_file_type: fileType,
    }
  );

  if (reservationError || !reservation || !reservation.reservation_id) {
    console.error("Reservation Error:", reservationError, "Reservation Data:", reservation);
    return NextResponse.json(
      { error: "This request has reached its file limit", debug_error: reservationError },
      { status: 410, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  // Generate non-guessable R2 key with random component
  const { randomBytes } = await import("crypto");
  const safeFileName = toKeySafeFileName(fileName);
  const randomSuffix = randomBytes(8).toString("hex");
  const r2Key = `uploads/${resolvedRequestId}/${randomSuffix}_${safeFileName}`;

  // Get presigned URL (15 min expiry instead of 1 hour)
  const presignedUrl = await getPresignedUploadUrl({
    key: r2Key,
    contentType: fileType,
    expiresIn: 900,
  });

  // Create upload record
  const { data: upload, error: uploadError } = await supabase
    .from("uploads")
    .insert({
      request_id: resolvedRequestId,
      submission_id: submissionId || null,
      request_item_id: requestItemId || null,
      file_name: sanitizeFileName(fileName),
      file_size: fileSize,
      file_type: fileType,
      r2_key: r2Key,
      status: "pending",
      storage_status: "initialized",
      delivery_status: "not_queued",
      uploader_name: uploaderName || null,
      uploader_email: uploaderEmail || null,
      reservation_id: reservation.reservation_id,
    })
    .select("id, request_id, submission_id, request_item_id, file_name, file_size, file_type, reservation_id, status, storage_status, delivery_status, created_at")
    .single();

  if (uploadError) {
    // Clean up the reservation if upload record creation failed
    await supabase.rpc("release_upload_reservation", {
      p_reservation_id: reservation.reservation_id,
    });
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  return NextResponse.json({
    uploadId: upload.id,
    reservationId: reservation.reservation_id,
    presignedUrl,
    r2Key,
    expiresAt: reservation.expires_at,
  });
}
