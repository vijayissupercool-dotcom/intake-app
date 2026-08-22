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
import { Upload, Check, AlertCircle, FileText, ChevronRight } from "lucide-react";

interface UploadState {
  id: string;
  fileName: string;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
  requestItemId?: string;
  reservationId?: string;
}

interface RequestItem {
  id: string;
  name: string;
  description?: string;
  required: boolean;
  allowed_file_types?: string[];
  max_files?: number;
  max_file_size_bytes?: number;
}

interface RequestData {
  id: string;
  title: string;
  description?: string;
  max_files: number;
  max_file_size_mb: number;
  allowed_file_types?: string[];
  require_uploader_name?: boolean;
  require_uploader_email?: boolean;
}

export default function PublicUploadPage() {
  const params = useParams();
  const token = params.token as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [request, setRequest] = useState<RequestData | null>(null);
  const [items, setItems] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploaderName, setUploaderName] = useState("");
  const [uploaderEmail, setUploaderEmail] = useState("");
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const fetchRequest = useCallback(async () => {
    try {
      // Step 1: Fetch request info + items (token hash lookup, server-side)
      const response = await fetch(`/api/public/request/${token}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Request not found");
      }
      const data = await response.json();
      setRequest(data.request);
      setItems(data.items || []);

      // Step 2: Create a short-lived public session (Phase 5 security)
      const sessionResponse = await fetch("/api/public/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        setSessionToken(sessionData.sessionToken);
      } else {
        // Session creation failed — continue without session (backward compat)
        // The presign endpoint will fall back to token hash validation
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load request");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useState(() => {
    fetchRequest();
  });

  const createSubmission = async () => {
    try {
      const response = await fetch("/api/public/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken: sessionToken || undefined,
          requestToken: sessionToken ? undefined : token,
          uploaderName: uploaderName || undefined,
          uploaderEmail: uploaderEmail || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create submission");
      }

      const { submission } = await response.json();
      setSubmissionId(submission.id);
      return submission.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create submission");
      return null;
    }
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameValid = !request?.require_uploader_name || uploaderName.trim().length > 0;
    const emailValid = !request?.require_uploader_email || uploaderEmail.trim().length > 0;

    if (!nameValid || !emailValid) {
      setError("Please fill in all required fields");
      return;
    }

    const sid = await createSubmission();
    if (sid) {
      setNameSubmitted(true);
    }
  };

  const uploadFile = async (file: File) => {
    if (!request || !submissionId) return;

    const uploadId = `temp-${Date.now()}-${Math.random()}`;
    const newUpload: UploadState = {
      id: uploadId,
      fileName: file.name,
      progress: 0,
      status: "pending",
      requestItemId: selectedItemId || undefined,
    };

    setUploads((prev) => [...prev, newUpload]);

    try {
      const presignBody: Record<string, unknown> = {
        requestId: request.id,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || "application/octet-stream",
        uploaderName: uploaderName || undefined,
        uploaderEmail: uploaderEmail || undefined,
      };

      if (submissionId) presignBody.submissionId = submissionId;
      if (selectedItemId) presignBody.requestItemId = selectedItemId;

      const presignResponse = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(presignBody),
      });

      if (!presignResponse.ok) {
        const data = await presignResponse.json();
        throw new Error(data.debug_error ? `${data.error} (Debug: ${JSON.stringify(data.debug_error)})` : data.error || "Failed to prepare upload");
      }

      const { uploadId: realUploadId, presignedUrl, reservationId } = await presignResponse.json();

      setUploads((prev) =>
        prev.map((u) =>
          u.id === uploadId
            ? { ...u, id: realUploadId, reservationId, status: "uploading", requestItemId: selectedItemId || undefined }
            : u
        )
      );

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

      setUploads((prev) =>
        prev.map((u) =>
          u.id === realUploadId
            ? { ...u, progress: 100, status: "done" }
            : u
        )
      );

       fetch("/api/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId: realUploadId, reservationId }),
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

  const getFileName = (upload: UploadState) => {
    const item = items.find((i) => i.id === upload.requestItemId);
    return `${upload.fileName}${item ? ` — ${item.name}` : ""}`;
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
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md shadow-sm">
          <CardContent className="flex flex-col items-center py-10">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
              <AlertCircle className="h-7 w-7 text-destructive" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Request not found</h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">{error}</p>
            <div className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Powered by</span>
              <img
                src="/intake_logowithname.png"
                alt="Intake"
                className="h-3.5 w-auto object-contain opacity-80"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!nameSubmitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-8">
        <div className="mb-6">
          <img
            src="/intake_logowithname.png"
            alt="Intake"
            className="h-7 w-auto object-contain"
          />
        </div>
        <Card className="w-full max-w-md shadow-md">
          <CardHeader className="text-center">
            <div className="mb-3 flex justify-center">
              <img
                src="/intake_logo_only.png"
                alt="Intake"
                className="h-11 w-11 rounded-xl shadow-xs object-cover"
              />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight">{request?.title}</CardTitle>
            <CardDescription>
              {request?.description || "Please enter your details to continue"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {request?.require_uploader_name ? "Your name *" : "Your name (optional)"}
                </Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={uploaderName}
                  onChange={(e) => setUploaderName(e.target.value)}
                  required={request?.require_uploader_name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  {request?.require_uploader_email ? "Your email *" : "Your email (optional)"}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={uploaderEmail}
                  onChange={(e) => setUploaderEmail(e.target.value)}
                  required={request?.require_uploader_email}
                />
              </div>
              <Button type="submit" className="w-full">
                Continue to Upload
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="mt-6 text-xs text-muted-foreground">
          Files are securely transferred directly into Google Drive
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-8">
      <div className="mb-6">
        <img
          src="/intake_logowithname.png"
          alt="Intake"
          className="h-7 w-auto object-contain"
        />
      </div>
      <Card className="w-full max-w-lg shadow-md">
        <CardHeader className="text-center">
          <div className="mb-3 flex justify-center">
            <img
              src="/intake_logo_only.png"
              alt="Intake"
              className="h-11 w-11 rounded-xl shadow-xs object-cover"
            />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">{request?.title}</CardTitle>
          <CardDescription>
            Upload your files below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {items.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Upload items</p>
              <div className="flex flex-col gap-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-lg border p-3 cursor-pointer transition-all ${
                      selectedItemId === item.id
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/50"
                    }`}
                    onClick={() => setSelectedItemId(item.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground/50" />
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          )}
                          {item.required && (
                            <span className="text-xs text-destructive">Required</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                    {item.allowed_file_types && item.allowed_file_types.length > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Allowed: {item.allowed_file_types.join(", ")}
                      </p>
                    )}
                    {item.max_files && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Up to {item.max_files} file(s)
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedItemId
                  ? `Uploading for: ${items.find((i) => i.id === selectedItemId)?.name}`
                  : "No item selected — files will be untitled"}
              </p>
            </div>
          )}

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
                type="button"
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
              accept={
                items.length > 0 && selectedItemId
                  ? items.find((i) => i.id === selectedItemId)?.allowed_file_types?.join(", ")
                  : request?.allowed_file_types?.join(", ")
              }
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
                        {getFileName(upload)}
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
      <p className="mt-6 text-xs text-muted-foreground">
        Files are securely transferred directly into Google Drive
      </p>
    </div>
  );
}
