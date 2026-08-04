/** Cloudinary video deliveries typically include this path segment. */
export function inferAboutHeroIsVideo(payload: {
  heroMediaType?: string | null;
  imageUrl?: string | null;
}): boolean {
  if (payload.heroMediaType === "VIDEO") return true;
  const u = typeof payload.imageUrl === "string" ? payload.imageUrl : "";
  return u.includes("/video/upload/");
}

export function isAboutHeroVideoFile(file: File | null): boolean {
  return Boolean(file?.type.startsWith("video/"));
}

/** Admin preview / lightbox: selected file, saved URL, or API `heroMediaType`. */
export function isAboutHeroVideoDisplay(opts: {
  heroMediaType?: string | null;
  imageUrl?: string | null;
  file?: File | null;
}): boolean {
  if (isAboutHeroVideoFile(opts.file ?? null)) return true;
  return inferAboutHeroIsVideo({
    heroMediaType: opts.heroMediaType,
    imageUrl: opts.imageUrl,
  });
}
