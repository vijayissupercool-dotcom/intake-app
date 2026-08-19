import { NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/drive/client";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=oauth_error&message=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=no_code&message=No authorization code provided`
    );
  }

  try {
    // Use cookies() directly so refreshed session cookies are returned
    const cookieStore = await cookies();
    const { createServerClient } = await import("@supabase/ssr");

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    // Get current user from session (refreshes cookie if needed)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        `${origin}/login?error=no_user&message=Please sign in first`
      );
    }

    // Exchange the auth code for Google tokens
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error("Failed to obtain tokens");
    }

    // Get user info from the Google token
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );

    if (!userInfoResponse.ok) {
      throw new Error("Failed to fetch user info");
    }

    const userInfo = await userInfoResponse.json();

    // Upsert Google connection
    const { error: upsertError } = await supabase
      .from("google_connections")
      .upsert(
        {
          user_id: user.id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expiry: tokens.expiry_date
            ? new Date(tokens.expiry_date).toISOString()
            : null,
          google_email: userInfo.email,
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("Failed to save Google connection:", upsertError);
      throw new Error("Failed to save connection");
    }

    // Redirect back to settings (NOT the homepage)
    return NextResponse.redirect(`${origin}/settings`);
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(
      `${origin}/login?error=callback_error&message=Failed to connect Google Drive`
    );
  }
}
