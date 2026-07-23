"use client";

import type { BookClassKind } from "../lib/bookClassKind";

type Props = {
  activeKind: BookClassKind;
  onKindChange: (kind: BookClassKind) => void;
};

export function BookClassKindTabs({ activeKind, onKindChange }: Props) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
      <button
        type="button"
        data-testid="book-class-kind-private"
        onClick={() => onKindChange("private")}
        className={
          activeKind === "private"
            ? "rounded-full border border-gold/40 bg-gold/12 px-3 py-2 font-brand text-[10px] tracking-[0.14em] text-gold sm:px-4 sm:py-1.5"
            : "rounded-full border border-gold/18 px-3 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/60 hover:border-gold/35 hover:text-gold sm:px-4 sm:py-1.5"
        }
      >
        PRIVATE
      </button>
      <button
        type="button"
        data-testid="book-class-kind-group"
        onClick={() => onKindChange("group")}
        className={
          activeKind === "group"
            ? "rounded-full border border-gold/40 bg-gold/12 px-3 py-2 font-brand text-[10px] tracking-[0.14em] text-gold sm:px-4 sm:py-1.5"
            : "rounded-full border border-gold/18 px-3 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/60 hover:border-gold/35 hover:text-gold sm:px-4 sm:py-1.5"
        }
      >
        GROUP
      </button>
    </div>
  );
}
