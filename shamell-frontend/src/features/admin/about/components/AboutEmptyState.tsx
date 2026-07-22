"use client";

import { FileText } from "lucide-react";

type AboutEmptyStateProps = {
  onCreate: () => void;
};

export function AboutEmptyState({ onCreate }: AboutEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 px-6 py-16 text-center md:py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10">
        <FileText className="h-8 w-8 text-gold/75" strokeWidth={1.2} />
      </div>
      <div className="max-w-md">
        <p className="font-brand text-lg tracking-[0.08em] text-gold">No About block yet</p>
        <p className="mt-2 font-body text-sm leading-relaxed text-foreground/55">
          Use “Create About Shamell” to publish the block on the home page.
        </p>
      </div>
      <button
        type="button"
        onClick={onCreate}
        className="rounded-xl border border-gold/40 bg-gold/15 px-8 py-3 font-brand text-sm tracking-[0.08em] text-gold transition hover:bg-gold/25"
      >
        Create About Shamell
      </button>
    </div>
  );
}
