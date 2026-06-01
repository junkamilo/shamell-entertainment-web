"use client";

import { useCallback, useState } from "react";
import { serviceCatalogMediaTypeFromUrl } from "@/lib/serviceCatalogMedia";

export type AdminMediaPreviewOpenOptions = {
  src: string;
  title?: string;
  /** When omitted, inferred from the URL (Cloudinary video paths, extensions). */
  mediaType?: "IMAGE" | "VIDEO";
};

type PreviewState = {
  src: string;
  title?: string;
  mediaType: "IMAGE" | "VIDEO";
};

export function useAdminMediaPreview() {
  const [preview, setPreview] = useState<PreviewState | null>(null);

  const openPreview = useCallback((options: AdminMediaPreviewOpenOptions) => {
    const src = options.src.trim();
    if (!src) return;
    const inferred = serviceCatalogMediaTypeFromUrl(src);
    const mediaType =
      options.mediaType ?? (inferred === "VIDEO" ? "VIDEO" : "IMAGE");
    setPreview({
      src,
      title: options.title?.trim() || undefined,
      mediaType,
    });
  }, []);

  const closePreview = useCallback(() => setPreview(null), []);

  return {
    preview,
    isPreviewOpen: preview != null,
    openPreview,
    closePreview,
  };
}
