import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { CopyButton } from "@/components/requests/copy-button";

export default async function RequestsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: requests } = await supabase
    .from("requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">File Requests</h1>
          <p className="text-muted-foreground">
            Manage your file collection requests
          </p>
        </div>
        <Link href="/requests/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New request
          </Button>
        </Link>
      </div>

      {!requests || requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No requests yet</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Create your first file request to start collecting files
              directly into Google Drive.
            </p>
            <Link href="/requests/new" className="mt-4">
              <Button>Create request</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => {
            const uploadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/r/${req.token}`;
            const isExpired =
              req.expires_at && new Date(req.expires_at) < new Date();

            return (
              <Card key={req.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{req.title}</CardTitle>
                      <CardDescription>
                        {req.description || "No description"}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {!req.active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                      {isExpired && (
                        <Badge variant="destructive">Expired</Badge>
                      )}
                      {req.active && !isExpired && (
                        <Badge variant="default">Active</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        {req.upload_count} / {req.max_files} files
                      </span>
                      <span>Max {req.max_file_size_mb} MB</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="hidden rounded bg-muted px-2 py-1 text-xs md:block">
                        {uploadUrl}
                      </code>
                      <CopyButton value={uploadUrl} />
                      <Link href={`/requests/${req.id}`}>
                        <Button variant="outline" size="sm">
                          Manage
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FileText(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}
