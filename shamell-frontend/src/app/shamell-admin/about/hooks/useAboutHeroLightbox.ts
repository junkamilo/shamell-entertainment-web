"use client";

import { useCallback, useEffect, useState } from "react";
import type { LightboxDisplay } from "../types/aboutAdmin.types";

export function useAboutHeroLightbox() {
  const [isPreviewLightboxOpen, setIsPreviewLightboxOpen] = useState(false);
  const [lightboxDisplay, setLightboxDisplay] = useState<LightboxDisplay | null>(null);
  const [lightboxPortalReady, setLightboxPortalReady] = useState(false);

  useEffect(() => {
    setLightboxPortalReady(true);
  }, []);

  useEffect(() => {
    if (!isPreviewLightboxOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isPreviewLightboxOpen]);

  const closeHeroLightbox = useCallback((instant?: boolean) => {
    if (instant === true) {
      setIsPreviewLightboxOpen(false);
      setLightboxDisplay(null);
      return;
    }
    setIsPreviewLightboxOpen(false);
  }, []);

  const openHeroLightbox = useCallback((src: string, isVideo: boolean) => {
    setLightboxDisplay({ src, isVideo });
    setIsPreviewLightboxOpen(true);
  }, []);

  const onLightboxExitComplete = useCallback(() => {
    setLightboxDisplay(null);
  }, []);

  return {
    isPreviewLightboxOpen,
    lightboxDisplay,
    lightboxPortalReady,
    openHeroLightbox,
    closeHeroLightbox,
    onLightboxExitComplete,
  };
}
