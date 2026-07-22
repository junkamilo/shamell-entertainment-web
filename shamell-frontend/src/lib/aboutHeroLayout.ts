import { cn } from "@/lib/utils";

/** Native About hero video ratio (1080×1920). */
export const ABOUT_HERO_VIDEO_ASPECT = 9 / 16;

/**
 * Max height caps per breakpoint.
 * Card width = min(100%, maxHeight × 9/16) so the frame stays exactly 9:16
 * inside the column — no black pillarboxing from a too-wide box.
 */
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

/**
 * Responsive 9:16 card.
 * Size by width capped to both the column and (maxHeight × 9/16), then
 * height follows aspect-ratio. Never use `w-full` + independent `max-h`
 * (that widens the box past 9:16 and creates black side bars with
 * object-contain).
 */
export function aboutHeroVideoCardClassName(opts?: AboutHeroVideoCardOpts) {
  const { className, variant = "public" } = opts ?? {};
  return cn(
    ABOUT_HERO_CARD_BASE,
    "mx-auto aspect-9/16 h-auto max-w-full",
    variant === "public"
      ? [
          "w-[min(100%,calc(min(65dvh,600px)*9/16))]",
          "max-h-[min(65dvh,600px)]",
          "sm:w-[min(100%,calc(min(68dvh,640px)*9/16))]",
          "sm:max-h-[min(68dvh,640px)]",
          "lg:mx-0 lg:w-[min(100%,calc(min(75dvh,700px)*9/16))]",
          "lg:max-h-[min(75dvh,700px)]",
          "xl:w-[min(100%,calc(min(78dvh,720px)*9/16))]",
          "xl:max-h-[min(78dvh,720px)]",
          "2xl:w-[min(100%,calc(min(80dvh,740px)*9/16))]",
          "2xl:max-h-[min(80dvh,740px)]",
        ]
      : [
          "w-[min(100%,calc(min(52dvh,480px)*9/16))]",
          "max-h-[min(52dvh,480px)]",
        ],
    className,
  );
}

/** Static image hero card (unchanged 3:4 slot). */
export function aboutHeroImageCardClassName(className?: string) {
  return cn(ABOUT_HERO_CARD_BASE, "aspect-3/4 w-full", className);
}

/**
 * Inner frame — transparent so no black pillarboxing shows around a
 * correctly sized 9:16 card. Admin previews may pass an explicit bg-*.
 */
export function aboutHeroMediaFrameClassName(className?: string) {
  return cn("relative flex h-full w-full items-center justify-center", className);
}

/**
 * Video/poster fit — fill the 9:16 card without cropping.
 * (Same aspect as the card ⇒ contain fills edge-to-edge.)
 */
export function aboutHeroMediaClassName(className?: string) {
  return cn("h-full w-full object-contain object-center", className);
}
