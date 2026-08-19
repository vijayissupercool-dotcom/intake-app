import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    const message = errorDescription || error;
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error)}&message=${encodeURIComponent(message)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=no_code&message=No authorization code provided`
    );
  }

  try {
    const supabase = await createClient();

    const { error: authError } = await supabase.auth.exchangeCodeForSession(code);

    if (authError) {
      console.error("Auth exchange error:", authError);
      return NextResponse.redirect(
        `${origin}/login?error=exchange_error&message=${encodeURIComponent(authError.message)}`
      );
    }

    // Check if user has a Google Drive connection
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: connection } = await supabase
        .from("google_connections")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!connection) {
        // Redirect to Google Drive connection page
        return NextResponse.redirect(`${origin}/settings?connect_drive=true`);
      }
    }

    return NextResponse.redirect(`${origin}${next}`);
  } catch (err) {
    console.error("Callback error:", err);
    return NextResponse.redirect(
      `${origin}/login?error=callback_error&message=An unexpected error occurred`
    );
  }
}
