"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export type ShamellBackButtonProps = {
  /** When set, navigates to this route. Otherwise uses browser history. */
  href?: string;
  /** Fallback when history is empty (only used without `href`). */
  fallbackHref?: string;
  label?: string;
  className?: string;
  /** Visually hide label on small screens (icon only). */
  hideLabelOnMobile?: boolean;
  /** Fires when navigation starts (Link click or history back). */
  onNavigateStart?: () => void;
};

const baseClassName = cn(
  "inline-flex items-center gap-2 rounded-lg border border-gold/45 bg-black/60 px-3 py-2",
  "font-brand text-[10px] font-semibold uppercase tracking-[0.16em] text-gold",
  "shadow-lg backdrop-blur-sm transition-colors",
  "hover:border-gold/65 hover:bg-black/75 hover:text-gold-light",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-light",
);

function BackContent({
  label,
  hideLabelOnMobile,
}: Pick<ShamellBackButtonProps, "label" | "hideLabelOnMobile">) {
  return (
    <>
      <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
      <span className={hideLabelOnMobile ? "hidden sm:inline" : undefined}>{label}</span>
    </>
  );
}

export function ShamellBackButton({
  href,
  fallbackHref = "/",
  label = "Back",
  className,
  hideLabelOnMobile = false,
  onNavigateStart,
}: ShamellBackButtonProps) {
  const router = useRouter();
  const mergedClassName = cn(baseClassName, className);

  if (href) {
    return (
      <Link
        href={href}
        className={mergedClassName}
        aria-label={label}
        onClick={() => onNavigateStart?.()}
      >
        <BackContent label={label} hideLabelOnMobile={hideLabelOnMobile} />
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={mergedClassName}
      aria-label={label}
      onClick={() => {
        onNavigateStart?.();
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push(fallbackHref);
        }
      }}
    >
      <BackContent label={label} hideLabelOnMobile={hideLabelOnMobile} />
    </button>
  );
}
