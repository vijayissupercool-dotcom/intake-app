import { createClient } from "@/lib/supabase/server";
import { getAuthUrl } from "@/lib/drive/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LinkIcon, User } from "lucide-react";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: connection } = await supabase
    .from("google_connections")
    .select("id, google_email, created_at")
    .eq("user_id", user.id)
    .single();

  const googleAuthUrl = getAuthUrl(`user_id=${user.id}`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and connections</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Name</p>
              <p className="text-sm text-muted-foreground">
                {profile?.full_name || "Not set"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Google Drive
            </CardTitle>
            <CardDescription>
              Connect your Google Drive to receive uploaded files
            </CardDescription>
          </CardHeader>
          <CardContent>
            {connection ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <LinkIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Connected</p>
                  <p className="text-xs text-muted-foreground">
                    {connection.google_email} • Connected{" "}
                    {new Date(connection.created_at).toLocaleDateString()}
                  </p>
                </div>
                {googleAuthUrl && (
                  <a href={googleAuthUrl} className="ml-auto">
                    <Button variant="outline" size="sm">
                      Reconnect / Update permissions
                    </Button>
                  </a>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Connect your Google Drive so uploaded files are sent directly
                  to your folders.
                </p>
                {googleAuthUrl && (
                  <a href={googleAuthUrl}>
                    <Button>Connect Google Drive</Button>
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
