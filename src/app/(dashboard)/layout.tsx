import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  // Check Google Drive connection
  const { data: connection } = await supabase
    .from("google_connections")
    .select("id, google_email")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="flex min-h-screen">
      <Sidebar
        user={profile || { id: user.id, email: user.email || "", full_name: user.user_metadata?.full_name }}
        isConnected={!!connection}
        googleEmail={connection?.google_email}
      />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl p-6">{children}</div>
      </main>
    </div>
  );
}
