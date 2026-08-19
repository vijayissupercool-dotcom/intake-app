import { NextRequest, NextResponse } from "next/server";
import { processTransfer } from "@/lib/transfer/worker";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expectedAuth = `Bearer ${process.env.TRANSFER_WORKER_SECRET}`;

  if (!authHeader || authHeader !== expectedAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();

  // Atomic job claiming using a transaction with FOR UPDATE SKIP LOCKED
  const { data: jobs, error: claimError } = await supabase
    .rpc("claim_transfer_jobs", { p_batch_size: 10 });

  if (claimError) {
    console.error("Failed to claim jobs:", claimError);
    return NextResponse.json(
      { error: "Failed to claim jobs" },
      { status: 500 }
    );
  }

  if (!jobs || jobs.length === 0) {
    return NextResponse.json({ message: "No jobs to process", processed: 0 });
  }

  const results = { succeeded: 0, failed: 0, processed: jobs.length };

  for (const job of jobs) {
    try {
      // Fetch the full upload data
      const { data: upload } = await supabase
        .from("uploads")
        .select("id, r2_key, file_name, file_type, file_size, request_id, status")
        .eq("id", job.upload_id)
        .single();

      if (!upload) {
        results.failed++;
        continue;
      }

      // Get the request owner
      const { data: req } = await supabase
        .from("requests")
        .select("user_id")
        .eq("id", upload.request_id)
        .single();

      if (!req) {
        results.failed++;
        continue;
      }

      await processTransfer({
        uploadId: upload.id,
        r2Key: upload.r2_key,
        fileName: upload.file_name,
        fileType: upload.file_type,
        fileSize: upload.file_size,
        requestId: upload.request_id,
        userId: req.user_id,
      });
      results.succeeded++;
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      results.failed++;
    }
  }

  return NextResponse.json(results);
}
