import { createServiceClient } from "@/lib/supabase/server";

interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  metadata,
}: CreateNotificationParams) {
  const supabase = await createServiceClient();

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    message,
    metadata: metadata || null,
  });

  if (error) {
    console.error("Failed to create notification:", error);
  }
}