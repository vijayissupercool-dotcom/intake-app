import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDriveClient, refreshAccessToken } from "@/lib/drive/client";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get Google connection
  const { data: connection } = await supabase
    .from("google_connections")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!connection) {
    return NextResponse.json(
      { error: "Google Drive not connected" },
      { status: 400 }
    );
  }

  let accessToken = connection.access_token;
  const refreshToken = connection.refresh_token;

  // Refresh if token is missing/expired
  const needsRefresh =
    !connection.token_expiry ||
    new Date(connection.token_expiry) < new Date(Date.now() + 5 * 60 * 1000);

  if (needsRefresh) {
    try {
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
        .eq("user_id", user.id);
    } catch (err) {
      console.error("Token refresh failed:", err);
      return NextResponse.json(
        { error: "Google Drive session expired. Please reconnect." },
        { status: 401 }
      );
    }
  }

  try {
    const drive = getDriveClient({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: "files(id, name, parents)",
      pageSize: 100,
      orderBy: "name",
    });

    const folders = (response.data.files || []).map((f) => ({
      id: f.id,
      name: f.name,
    }));

    return NextResponse.json({ folders });
  } catch (error) {
    console.error("Failed to list Drive folders:", error);
    return NextResponse.json(
      { error: "Failed to access Google Drive" },
      { status: 500 }
    );
  }
}
