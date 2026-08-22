import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("requests")
    .select("id, title, max_files, upload_count, active, token, token_hash")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: reservations, error: resError } = await supabase
    .from("file_reservations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);
  
  return NextResponse.json({ requests: data, reservations, error, resError });
}
