import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  // Rate limit: 30 requests per minute per IP
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const rateLimit = checkRateLimit(`public:${ip}`, { windowMs: 60_000, maxRequests: 30 });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  const { token } = await params;
  const supabase = await createServiceClient();

  // Look up by token hash, not raw token
  const { createHash } = await import("crypto");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const { data: req, error } = await supabase
    .from("requests")
    .select("id, title, description, max_files, max_file_size_mb, allowed_file_types, expires_at, upload_count, active")
    .eq("token_hash", tokenHash)
    .eq("active", true)
    .single();

  if (error || !req) {
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

  return NextResponse.json({ request: req }, { headers: getRateLimitHeaders(rateLimit) });
}
