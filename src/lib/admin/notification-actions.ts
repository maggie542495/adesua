"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { markAllRead, markNotificationRead } from "@/lib/admin/notification-store";

/**
 * The notifications screen is read-only except for one thing: whether an entry
 * has been seen. Nothing here creates, edits or deletes a notification — those
 * are written by the studio when something actually happens, which is what
 * makes the list trustworthy as a record.
 */

export async function markOneRead(formData: FormData): Promise<void> {
  const session = await requireAdmin("editor");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await markNotificationRead({ id: session.user.id }, id);
  revalidatePath("/admin/notifications");
  revalidatePath("/admin");
}

export async function markEverythingRead(): Promise<void> {
  const session = await requireAdmin("editor");
  await markAllRead(session.user.id);
  revalidatePath("/admin/notifications");
  revalidatePath("/admin");
}
