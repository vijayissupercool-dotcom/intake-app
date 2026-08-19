"use client";

import { useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Upload, Check, AlertCircle, FileText } from "lucide-react";

interface UploadState {
  id: string;
  fileName: string;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

export default function PublicUploadPage() {
  const params = useParams();
  const token = params.token as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [request, setRequest] = useState<{
    id: string;
    title: string;
    description?: string;
    max_files: number;
    max_file_size_mb: number;
    allowed_file_types?: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploaderName, setUploaderName] = useState("");
  const [uploaderEmail, setUploaderEmail] = useState("");
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // Fetch request info on mount
  const fetchRequest = useCallback(async () => {
    try {
      const response = await fetch(`/api/public/request/${token}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Request not found");
      }
      const data = await response.json();
      setRequest(data.request);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load request");
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initialize on first render
  useState(() => {
    fetchRequest();
  });

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (uploaderName.trim()) {
      setNameSubmitted(true);
    }
  };

  const uploadFile = async (file: File) => {
    if (!request) return;

    const uploadId = `temp-${Date.now()}-${Math.random()}`;
    const newUpload: UploadState = {
      id: uploadId,
      fileName: file.name,
      progress: 0,
      status: "pending",
    };

    setUploads((prev) => [...prev, newUpload]);

    try {
      // Get presigned URL
      const presignResponse = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || "application/octet-stream",
          uploaderName: uploaderName || undefined,
          uploaderEmail: uploaderEmail || undefined,
        }),
      });

      if (!presignResponse.ok) {
        const data = await presignResponse.json();
        throw new Error(data.error || "Failed to prepare upload");
      }

      const { uploadId: realUploadId, presignedUrl } = await presignResponse.json();

      // Update with real ID
      setUploads((prev) =>
        prev.map((u) =>
          u.id === uploadId ? { ...u, id: realUploadId, status: "uploading" } : u
        )
      );

      // Upload to R2 via presigned URL
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploads((prev) =>
            prev.map((u) =>
              u.id === realUploadId ? { ...u, progress } : u
            )
          );
        }
      });

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error("Upload failed"));
          }
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.open("PUT", presignedUrl);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
        xhr.send(file);
      });

      // Mark as done
      setUploads((prev) =>
        prev.map((u) =>
          u.id === realUploadId
            ? { ...u, progress: 100, status: "done" }
            : u
        )
      );

      // Trigger transfer (server-side, no secret exposed to browser)
      fetch("/api/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId: realUploadId }),
      });
    } catch (err) {
      setUploads((prev) =>
        prev.map((u) =>
          u.id === uploadId
            ? { ...u, status: "error", error: err instanceof Error ? err.message : "Upload failed" }
            : u
        )
      );
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(uploadFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files) {
      Array.from(files).forEach(uploadFile);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12">
<img
                src="/intake_logo_only.png"
                alt="Intake"
                className="mb-3 h-12 w-auto"
              />
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h2 className="mt-4 text-lg font-semibold">Request not found</h2>
            <p className="mt-2 text-center text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!nameSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mb-3 flex justify-center">
              <img
                src="/intake_logo_only.png"
                alt="Intake"
                className="h-8 w-auto"
              />
            </div>
            <CardTitle>{request?.title}</CardTitle>
            <CardDescription>
              {request?.description || "Please enter your details to continue"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your name *</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={uploaderName}
                  onChange={(e) => setUploaderName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Your email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={uploaderEmail}
                  onChange={(e) => setUploaderEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                Continue
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mb-3 flex justify-center">
            <img
              src="/intake_logo_only.png"
              alt="Intake"
              className="h-8 w-auto"
            />
          </div>
          <CardTitle>{request?.title}</CardTitle>
          <CardDescription>
            Upload your files below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <Upload className="h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              Drag and drop files here, or{" "}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-primary underline"
              >
                browse
              </button>
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Max {request?.max_file_size_mb || 50} MB per file
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {uploads.length > 0 && (
            <div className="space-y-3">
              {uploads.map((upload) => (
                <div key={upload.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {upload.status === "done" ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : upload.status === "error" ? (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium">
                        {upload.fileName}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {upload.status === "done"
                        ? "Done"
                        : upload.status === "error"
                          ? "Failed"
                          : `${upload.progress}%`}
                    </span>
                  </div>
                  {upload.status === "uploading" && (
                    <Progress value={upload.progress} className="mt-2" />
                  )}
                  {upload.error && (
                    <p className="mt-1 text-xs text-destructive">
                      {upload.error}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
