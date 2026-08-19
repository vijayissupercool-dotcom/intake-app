import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRequestSchema } from "@/lib/validators";
import { randomBytes, createHash } from "crypto";

function generateToken(): string {
  return randomBytes(12).toString("base64url");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: requests, error } = await supabase
    .from("requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ requests });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createRequestSchema.safeParse(body);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const issues: string[] = [];
    for (const [field, messages] of Object.entries(fieldErrors)) {
      if (messages && messages.length > 0) {
        issues.push(`${field}: ${messages.join("; ")}`);
      }
    }
    return NextResponse.json(
      {
        error: issues.length > 0 ? issues.join(". ") : "Validation failed",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { title, description, folderId, expiresAt, maxFiles, maxFileSizeMb, allowedFileTypes, notifyEmail } =
    parsed.data;

  // Verify user has a Google connection
  const { data: connection } = await supabase
    .from("google_connections")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!connection) {
    return NextResponse.json(
      { error: "Please connect your Google Drive first" },
      { status: 400 }
    );
  }

  const token = generateToken();
  const tokenHash = hashToken(token);

  const { data: newRequest, error } = await supabase
    .from("requests")
    .insert({
      user_id: user.id,
      title,
      description: description || null,
      token,
      token_hash: tokenHash,
      drive_folder_id: folderId,
      expires_at: expiresAt || null,
      max_files: maxFiles || 10,
      max_file_size_mb: maxFileSizeMb || 50,
      allowed_file_types: allowedFileTypes || null,
      notify_email: notifyEmail ?? true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ request: newRequest }, { status: 201 });
}
