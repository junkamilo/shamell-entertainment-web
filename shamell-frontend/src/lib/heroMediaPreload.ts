import type { PublicHeaderPhoto } from "@/lib/fetchPublicHeaderMedia";

export type HeroLcpPreload = {
  href: string;
  options: {
    as: "image";
    fetchPriority: "high";
    imageSrcSet?: string;
    imageSizes?: string;
  };
};

function joinSrcSet(parts: Array<string | null>): string | undefined {
  const out = parts.filter(Boolean).join(", ");
  return out || undefined;
}

/**
 * LCP del hero: imagen (srcset 960/1920) o, si el primer slide es video, su
 * poster (480/720). El `imageSrcSet`/`imageSizes` replica exactamente el
 * `srcset` que pinta `HeroSection` para precargar la misma variante.
 */
export function heroLcpPreload(
  firstSlide: PublicHeaderPhoto | undefined,
): HeroLcpPreload | null {
  if (!firstSlide) return null;

  if (firstSlide.mediaType === "VIDEO") {
    const poster = firstSlide.videoPosterUrl ?? firstSlide.videoPosterUrlMobile;
    if (!poster) return null;
    const imageSrcSet = joinSrcSet([
      firstSlide.videoPosterUrlMobile
        ? `${firstSlide.videoPosterUrlMobile} 480w`
        : null,
      firstSlide.videoPosterUrl ? `${firstSlide.videoPosterUrl} 720w` : null,
    ]);
    return {
      href: poster,
      options: {
        as: "image",
        fetchPriority: "high",
        imageSrcSet,
        imageSizes: imageSrcSet ? "100vw" : undefined,
      },
    };
  }

  const href = firstSlide.imageUrl ?? firstSlide.imageUrlMobile;
  if (!href) return null;
  const imageSrcSet = joinSrcSet([
    firstSlide.imageUrlMobile ? `${firstSlide.imageUrlMobile} 960w` : null,
    firstSlide.imageUrl ? `${firstSlide.imageUrl} 1920w` : null,
  ]);
  return {
    href,
    options: {
      as: "image",
      fetchPriority: "high",
      imageSrcSet,
      imageSizes: imageSrcSet ? "100vw" : undefined,
    },
  };
}
