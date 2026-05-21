export const GALLERY_PATH = "/gallery";

export function buildGalleryFilterHref(slug: string): string {
  if (!slug || slug === "all") return GALLERY_PATH;
  const q = new URLSearchParams({ filter: slug });
  return `${GALLERY_PATH}?${q.toString()}`;
}
