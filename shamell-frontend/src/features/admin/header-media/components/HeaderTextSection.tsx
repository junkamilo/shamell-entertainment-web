"use client";

import { Sparkles } from "lucide-react";
import type { useHeaderTextSection } from "../hooks/useHeaderTextSection";
import HeaderTextEditModal from "./HeaderTextEditModal";
import HeaderTextPreview from "./HeaderTextPreview";

type TextSectionState = ReturnType<typeof useHeaderTextSection>;

type Props = {
  state: TextSectionState;
};

export default function HeaderTextSection({ state }: Props) {
  const { previewContent, isLoading, openEditModal } = state;

  return (
    <>
      <section className="shamell-glass-surface overflow-hidden rounded-2xl border border-gold/14">
        <div className="border-b border-gold/12 bg-linear-to-r from-gold/10 via-transparent to-transparent px-5 py-4 md:px-8 md:py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gold/80" strokeWidth={1.4} />
              <h2 className="font-brand text-sm tracking-[0.16em] text-gold">Hero text preview</h2>
            </div>
            <div className="flex items-center gap-3">
              {isLoading ? <p className="text-xs text-foreground/55">Loading…</p> : null}
              <button
                type="button"
                onClick={openEditModal}
                className="rounded-xl border border-gold/35 bg-gold/10 px-4 py-2 font-brand text-xs tracking-[0.12em] text-gold transition hover:bg-gold/20"
              >
                Edit text
              </button>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-8">
          <HeaderTextPreview content={previewContent} />
        </div>
      </section>

      <HeaderTextEditModal state={state} />
    </>
  );
}
