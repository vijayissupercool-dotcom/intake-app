"use client";

import { createBrowserClient } from "@supabase/ssr";

// NEXT_PUBLIC_* vars are inlined into the client bundle by Next.js.
// Read them directly here — do NOT import the strict server `env` object,
// which eagerly requires server-only vars unavailable in the browser.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createClient() {
  return createBrowserClient(supabaseUrl!, supabaseAnonKey!);
}