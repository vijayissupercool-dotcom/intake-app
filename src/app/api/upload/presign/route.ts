import { NextRequest, NextResponse } from "next/server";
import { getPresignedUploadUrl } from "@/lib/r2/client";
import { createServiceClient } from "@/lib/supabase/server";
import { uploadMetadataSchema } from "@/lib/validators";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

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

  const { requestId, fileName, fileSize, fileType, uploaderName, uploaderEmail } =
    parsed.data;

  const supabase = await createServiceClient();

  // Verify the request exists and is active
  const { data: req, error: reqError } = await supabase
    .from("requests")
    .select("*")
    .eq("id", requestId)
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

  // Check file count limit (atomic increment to prevent race conditions)
  const { data: countResult } = await supabase
    .rpc("check_and_increment_upload_count", {
      p_request_id: requestId,
      p_max_files: req.max_files,
    });

  if (!countResult) {
    return NextResponse.json(
      { error: "This request has reached its file limit" },
      { status: 410, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  // Check file size limit
  const maxFileSizeBytes = req.max_file_size_mb * 1024 * 1024;
  if (fileSize > maxFileSizeBytes) {
    return NextResponse.json(
      { error: `File size exceeds the ${req.max_file_size_mb} MB limit` },
      { status: 413, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  // Check file type if restricted
  if (req.allowed_file_types && req.allowed_file_types.length > 0) {
    const allowed = req.allowed_file_types.some(
      (type: string) => fileType === type || fileType.startsWith(type.replace("/*", ""))
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "File type not allowed for this request" },
        { status: 415, headers: getRateLimitHeaders(rateLimit) }
      );
    }
  }

  // Generate non-guessable R2 key with random component
  const { randomBytes } = await import("crypto");
  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const randomSuffix = randomBytes(8).toString("hex");
  const r2Key = `uploads/${requestId}/${randomSuffix}_${safeFileName}`;

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
      request_id: requestId,
      file_name: fileName,
      file_size: fileSize,
      file_type: fileType,
      r2_key: r2Key,
      status: "pending",
      uploader_name: uploaderName || null,
      uploader_email: uploaderEmail || null,
    })
    .select()
    .single();

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  return NextResponse.json({
    uploadId: upload.id,
    presignedUrl,
    r2Key,
  });
}
