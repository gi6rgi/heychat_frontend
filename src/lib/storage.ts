/**
 * Public URLs for scene art in the Supabase Storage `scenes` bucket.
 *
 * The bucket is public-read; objects are immutable (unique path per scenario),
 * so plain CDN URLs are safe to cache hard. The backend stores bucket-relative
 * paths ("user/<id>/poster.png", "catalog/<slug>/poster.png") and the client
 * builds the URL here.
 *
 * The source art is full-res PNG (posters ~1200x1800, ~4 MB). Pass a
 * `transform` to route through Supabase's image render endpoint, which resizes
 * + recompresses on the fly and negotiates WebP/AVIF from the Accept header,
 * then CDN-caches the result for a year. A wall poster drops from ~4 MB to
 * ~130 KB this way. Omit `transform` only when the raw original is wanted.
 */

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? "";

export type ImageTransform = {
  width?: number;
  height?: number;
  /** 20-100; lower is smaller. Supabase default is 80. */
  quality?: number;
  resize?: "cover" | "contain" | "fill";
};

export function sceneImageUrl(
  path: string | null | undefined,
  transform?: ImageTransform,
): string | null {
  if (!path || !SUPABASE_URL) return null;
  if (!transform) {
    return `${SUPABASE_URL}/storage/v1/object/public/scenes/${path}`;
  }
  const params = new URLSearchParams();
  if (transform.width) params.set("width", String(transform.width));
  if (transform.height) params.set("height", String(transform.height));
  params.set("quality", String(transform.quality ?? 75));
  if (transform.resize) params.set("resize", transform.resize);
  return `${SUPABASE_URL}/storage/v1/render/image/public/scenes/${path}?${params.toString()}`;
}

/** Catalog art lives under catalog/<slug>/<kind>.png in the bucket. */
export function catalogImage(
  slug: string,
  kind: "poster" | "establishing" | "conversation",
  transform?: ImageTransform,
): string {
  return sceneImageUrl(`catalog/${slug}/${kind}.png`, transform)!;
}
