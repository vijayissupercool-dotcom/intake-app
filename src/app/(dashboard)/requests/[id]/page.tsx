import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
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
import { ArrowLeft, ExternalLink } from "lucide-react";
import { ShareActions } from "@/components/requests/share-actions";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: request } = await supabase
    .from("requests")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!request) notFound();

  const { data: uploads } = await supabase
    .from("uploads")
    .select("*")
    .eq("request_id", id)
    .order("created_at", { ascending: false });

  const uploadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/r/${request.token}`;
  const isExpired =
    request.expires_at && new Date(request.expires_at) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/requests">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{request.title}</h1>
            {!request.active && <Badge variant="secondary">Inactive</Badge>}
            {isExpired && <Badge variant="destructive">Expired</Badge>}
            {request.active && !isExpired && <Badge>Active</Badge>}
          </div>
          <p className="text-muted-foreground">
            {request.description || "No description"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Share link</CardTitle>
            <CardDescription>Send this to people you want files from</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <code className="flex-1 truncate rounded bg-muted px-3 py-2 text-sm">
                        {uploadUrl}
                      </code>
                      <a href={uploadUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="icon-sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                      <ShareActions
                        uploadUrl={uploadUrl}
                        requestId={request.id}
                        active={request.active}
                      />
                    </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Files received</span>
                <span className="font-medium">
                  {request.upload_count} / {request.max_files}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max file size</span>
                <span className="font-medium">{request.max_file_size_mb} MB</span>
              </div>
              {request.allowed_file_types && request.allowed_file_types.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">File types</span>
                  <span className="font-medium">
                    {request.allowed_file_types.join(", ")}
                  </span>
                </div>
              )}
              {request.expires_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expires</span>
                  <span className="font-medium">
                    {new Date(request.expires_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Uploads</CardTitle>
            <CardDescription>Files collected through this request</CardDescription>
          </CardHeader>
          <CardContent>
            {!uploads || uploads.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No files uploaded yet
              </div>
            ) : (
              <div className="space-y-3">
                {uploads.map((upload) => (
                  <div
                    key={upload.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{upload.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(upload.file_size / 1024 / 1024).toFixed(2)} MB
                        {upload.uploader_name && ` • by ${upload.uploader_name}`}
                      </p>
                    </div>
                    <Badge
                      variant={
                        upload.status === "completed"
                          ? "default"
                          : upload.status === "failed"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {upload.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
