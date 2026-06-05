/**
 * Public URLs for scene art in the Supabase Storage `scenes` bucket.
 *
 * The bucket is public-read; objects are immutable (unique path per scenario),
 * so plain CDN URLs are safe to cache hard. The backend stores bucket-relative
 * paths ("user/<id>/poster.png", "catalog/<slug>/poster.png") and the client
 * builds the URL here.
 */

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? "";

export function sceneImageUrl(path: string | null | undefined): string | null {
  if (!path || !SUPABASE_URL) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/scenes/${path}`;
}

/** Catalog art lives under catalog/<slug>/<kind>.png in the bucket. */
export function catalogImage(
  slug: string,
  kind: "poster" | "establishing" | "conversation",
): string {
  return sceneImageUrl(`catalog/${slug}/${kind}.png`)!;
}
