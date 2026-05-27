"use client";

import AdminModal from "@/components/admin/AdminModal";
import type { useHeaderTextSection } from "../hooks/useHeaderTextSection";
import HeaderTextPreview from "./HeaderTextPreview";
import HeaderTextStyleField from "./HeaderTextStyleField";

type TextSectionState = ReturnType<typeof useHeaderTextSection>;

type Props = {
  state: TextSectionState;
};

export default function HeaderTextEditModal({ state }: Props) {
  const { form, isModalOpen, closeEditModal, handleSubmit } = state;

  return (
    <AdminModal title="Edit header text" isOpen={isModalOpen} onClose={closeEditModal}>
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
        <HeaderTextStyleField
          label="TITLE"
          text={form.headline}
          onTextChange={form.setHeadline}
          font={form.headlineFont}
          onFontChange={form.setHeadlineFont}
          color={form.headlineColor}
          onColorChange={form.setHeadlineColor}
        />

        <HeaderTextStyleField
          label="TAGLINE"
          text={form.tagline}
          onTextChange={form.setTagline}
          font={form.taglineFont}
          onFontChange={form.setTaglineFont}
          color={form.taglineColor}
          onColorChange={form.setTaglineColor}
          multiline
          rows={2}
        />

        <HeaderTextStyleField
          label="QUOTE"
          text={form.quote}
          onTextChange={form.setQuote}
          font={form.quoteFont}
          onFontChange={form.setQuoteFont}
          color={form.quoteColor}
          onColorChange={form.setQuoteColor}
          multiline
          rows={3}
        />

        <div className="shamell-glass-surface rounded-xl border border-gold/15 p-4">
          <p className="mb-3 font-brand text-[10px] tracking-[0.18em] text-gold/70">
            LIVE PREVIEW
          </p>
          <HeaderTextPreview content={form.draftContent} compact />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={closeEditModal}
            className="rounded-xl border border-gold/30 px-5 py-3 text-sm tracking-[0.08em] text-foreground/80 transition hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={form.isSubmitting}
            className="rounded-xl border border-gold/35 bg-gold/15 px-5 py-3 font-brand text-sm tracking-[0.08em] text-gold transition hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {form.isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
