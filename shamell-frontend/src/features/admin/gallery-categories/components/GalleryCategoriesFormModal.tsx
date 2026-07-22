import { Modal } from "@/components/admin/overlays";
import { type FormEvent } from "react";
import { slugifyDisplay } from "../lib/galleryCategoriesDisplay";
import type { GalleryCategory } from "../types/galleryCategories.types";

type Props = {
  isOpen: boolean;
  editingCategoryId: string | null;
  categoryName: string;
  onCategoryNameChange: (value: string) => void;
  categories: GalleryCategory[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function GalleryCategoriesFormModal({
  isOpen,
  editingCategoryId,
  categoryName,
  onCategoryNameChange,
  categories,
  isSubmitting,
  onClose,
  onSubmit,
}: Props) {
  return (
    <Modal
      title={editingCategoryId ? "Edit category" : "New category"}
      isOpen={isOpen}
      onClose={onClose}
    >
      <form id="gallery-category-form" onSubmit={onSubmit} className="space-y-5">
        <label className="block">
          <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">NAME</span>
          <input
            value={categoryName}
            onChange={(event) => onCategoryNameChange(event.target.value)}
            className="mt-2 h-11 w-full rounded-xl border border-gold/30 px-4 text-sm text-foreground outline-none focus:border-gold"
            placeholder="e.g. Live performance"
          />
          {!editingCategoryId ? (
            <p className="mt-2 font-body text-[11px] text-foreground/50">
              Slug preview:{" "}
              <code className="shamell-glass-surface rounded border border-gold/15 px-1.5 py-0.5 font-mono text-gold/80">
                {slugifyDisplay(categoryName) || "…"}
              </code>{" "}
              (confirmed on save; the backend enforces uniqueness).
            </p>
          ) : (
            <p className="mt-2 font-body text-[11px] text-foreground/50">
              Published slug:{" "}
              <code className="shamell-glass-surface rounded border border-gold/15 px-1.5 py-0.5 font-mono text-gold/80">
                /{categories.find((c) => c.id === editingCategoryId)?.slug ?? "…"}
              </code>
              . If you change the name, the slug updates with the same rules (unique in the system).
            </p>
          )}
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gold/30 px-5 py-3 text-sm tracking-[0.08em] text-foreground/80 transition hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !categoryName.trim()}
            className="rounded-xl border border-gold/35 bg-gold/15 px-5 py-3 font-brand text-sm tracking-[0.08em] text-gold transition hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : editingCategoryId ? "Save changes" : "Create category"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
