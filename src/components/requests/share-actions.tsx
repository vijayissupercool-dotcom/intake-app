"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, Copy, Pause, Play, Trash2 } from "lucide-react";

interface ShareActionsProps {
  uploadUrl: string;
  requestId: string;
  active: boolean;
}

export function ShareActions({ uploadUrl, requestId, active }: ShareActionsProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(uploadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  const toggleActive = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Delete this request? This cannot be undone."
    );
    if (!confirmed) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/requests");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon-sm" onClick={handleCopy}>
        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
      </Button>
      <Button variant="outline" size="sm" onClick={toggleActive} disabled={loading}>
        {active ? <Pause className="mr-1 h-4 w-4" /> : <Play className="mr-1 h-4 w-4" />}
        {active ? "Deactivate" : "Activate"}
      </Button>
      <Button variant="outline" size="icon-sm" onClick={handleDelete} disabled={loading}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}