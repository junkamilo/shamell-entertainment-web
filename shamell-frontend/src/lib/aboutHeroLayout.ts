import { cn } from "@/lib/utils";

/** Native About hero video ratio (1080×1920). */
export const ABOUT_HERO_VIDEO_ASPECT = 9 / 16;

/** Max height caps per breakpoint (height-first on mobile; width-first + max-h on desktop). */
export const ABOUT_HERO_VIDEO_MAX_HEIGHT = {
  base: "min(65dvh, 600px)",
  sm: "min(68dvh, 640px)",
  lg: "min(75dvh, 700px)",
  xl: "min(78dvh, 720px)",
  xl2: "min(80dvh, 740px)",
} as const;

const ABOUT_HERO_CARD_BASE =
  "group/portrait relative overflow-hidden rounded-2xl border border-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_16px_48px_rgba(0,0,0,0.45)] transition-[border-color,box-shadow] duration-500 hover:border-white/16 hover:shadow-[0_22px_56px_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(255,255,255,0.06)]";

type AboutHeroVideoCardOpts = {
  className?: string;
  /** Smaller height cap for admin thumbnail preview. */
  variant?: "public" | "preview";
};

/** Responsive 9:16 card — height-capped on mobile; column width + max-h on desktop. */
export function aboutHeroVideoCardClassName(opts?: AboutHeroVideoCardOpts) {
  const { className, variant = "public" } = opts ?? {};
  return cn(
    ABOUT_HERO_CARD_BASE,
    "mx-auto aspect-9/16 w-auto max-w-full",
    variant === "public"
      ? [
          "h-[min(65dvh,600px)]",
          "sm:h-[min(68dvh,640px)]",
          "lg:mx-0 lg:h-auto lg:w-full lg:max-h-[min(75dvh,700px)]",
          "xl:max-h-[min(78dvh,720px)]",
          "2xl:max-h-[min(80dvh,740px)]",
        ]
      : "h-[min(52dvh,480px)]",
    className,
  );
}

/** Static image hero card (unchanged 3:4 slot). */
export function aboutHeroImageCardClassName(className?: string) {
  return cn(ABOUT_HERO_CARD_BASE, "aspect-3/4 w-full", className);
}

/** Inner flex frame that centers media without cropping. */
export function aboutHeroMediaFrameClassName(className?: string) {
  return cn("flex h-full w-full items-center justify-center bg-black", className);
}

/** Video/poster fit — never crop the frame. */
export function aboutHeroMediaClassName(className?: string) {
  return cn("max-h-full max-w-full object-contain object-center", className);
}
