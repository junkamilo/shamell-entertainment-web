"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export type BackButtonProps = {
  href: string;
  label?: string;
  variant?: "default" | "subtle";
  className?: string;
};

export function BackButton({
  href,
  label = "Back",
  variant = "default",
  className,
}: BackButtonProps) {
  const base =
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-brand text-[10px] tracking-[0.14em] transition";
  const tone =
    variant === "subtle"
      ? "border-gold/20 text-gold/75 hover:border-gold/35 hover:text-gold"
      : "border-gold/30 text-gold hover:bg-gold/10";

  return (
    <Link href={href} className={`${base} ${tone}${className ? ` ${className}` : ""}`}>
      <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
      {label.toUpperCase()}
    </Link>
  );
}
