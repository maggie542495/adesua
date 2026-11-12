"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/session";
import { slugify } from "@/lib/admin/slug";

/**
 * Uploads a gallery photograph into the public `media` bucket and hands back
 * the storage path to save on the row.
 *
 * Same contract as the article cover upload: the stored value is the path, not
 * a URL, so the public pages can resolve it against whichever Supabase project
 * a deployment points at. A rejected file never reaches storage.
 */

/** Storage bucket the studio uploads into. Public, image-only, 10 MB cap. */
const MEDIA_BUCKET = "media";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export interface GalleryUploadState {
  ok: boolean;
  /** Stored value — what goes into `image_path`. */
  path?: string;
  message?: string;
}

export async function uploadGalleryImage(formData: FormData): Promise<GalleryUploadState> {
  await requireAdmin("editor");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose a photograph first." };
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return { ok: false, message: "Use a JPG, PNG, WebP, AVIF or GIF." };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, message: "Photographs need to be under 10 MB." };
  }

  const extension = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const stem = slugify(file.name.replace(/\.[^.]+$/, "")) || "photo";
  const objectPath = `gallery/${stem}-${Date.now().toString(36)}.${extension}`;

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(objectPath, file, { contentType: file.type, upsert: false });

    if (error) return { ok: false, message: error.message };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "The upload failed.",
    };
  }

  // Bucket name included, because that is what the public URL is built from.
  return { ok: true, path: `${MEDIA_BUCKET}/${objectPath}` };
}
