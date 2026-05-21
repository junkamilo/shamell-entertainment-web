import { type FormEvent } from "react";
import AdminModal from "@/components/admin/AdminModal";
import type { OccasionCatalogItem } from "../types/eventTypes.types";

type EditingRow = {
  occasionAssignments?: { occasionTypeId: string; occasionName?: string }[];
};

type Props = {
  isOpen: boolean;
  editingId: string | null;
  editingRow: EditingRow | undefined;
  name: string;
  onNameChange: (value: string) => void;
  occasionCatalog: OccasionCatalogItem[];
  activeOccasionsCatalog: OccasionCatalogItem[];
  linkedOccasionIds: string[];
  linkedOrphanIds: string[];
  canSubmit: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onToggleLinkedOccasion: (id: string) => void;
};

export default function EventTypesFormModal({
  isOpen,
  editingId,
  editingRow,
  name,
  onNameChange,
  occasionCatalog,
  activeOccasionsCatalog,
  linkedOccasionIds,
  linkedOrphanIds,
  canSubmit,
  isSubmitting,
  onClose,
  onSubmit,
  onToggleLinkedOccasion,
}: Props) {
  return (
    <AdminModal
      title={editingId ? "Edit event type" : "New event type"}
      isOpen={isOpen}
      onClose={onClose}
    >
      <form id="event-type-form" noValidate onSubmit={onSubmit} className="space-y-6">
        <label className="block">
          <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">TYPE NAME</span>
          <input
            type="text"
            value={name}
            required
            onChange={(event) => onNameChange(event.target.value)}
            className="mt-2 h-12 w-full rounded-xl border border-gold/30 px-4 text-base text-foreground outline-none focus:border-gold"
            placeholder="e.g. Private weddings"
          />
        </label>

        <div className="rounded-xl border border-gold/16 p-4">
          <p className="font-brand text-[11px] tracking-[0.2em] text-gold/95">OCCASION TYPES</p>
          <p className="mt-1 font-body text-xs leading-relaxed text-foreground/55">
            Only active occasions are shown. Check those that apply to this event type.
          </p>
          {occasionCatalog.length === 0 ? (
            <p className="mt-3 font-body text-xs text-foreground/45">Loading occasions…</p>
          ) : activeOccasionsCatalog.length === 0 ? (
            <p className="mt-3 font-body text-xs text-foreground/45">
              No active occasions. Create or reactivate occasion types in their module.
            </p>
          ) : (
            <ul className="mt-4 space-y-2 border-t border-gold/10 pt-4">
              {activeOccasionsCatalog.map((c) => (
                <li key={c.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gold/12 px-3 py-2.5 font-body text-sm text-foreground/90 transition hover:border-gold/25 hover:bg-gold/5">
                    <input
                      type="checkbox"
                      checked={linkedOccasionIds.includes(c.id)}
                      onChange={() => onToggleLinkedOccasion(c.id)}
                      className="h-4 w-4 shrink-0 rounded border-gold/40 text-gold focus:ring-gold"
                    />
                    <span>{c.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}

          {linkedOrphanIds.length > 0 ? (
            <div className="mt-4 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-3">
              <p className="font-brand text-[10px] tracking-[0.14em] text-amber-200/90">INACTIVE LINKS</p>
              <p className="mt-1 font-body text-[11px] text-foreground/55">
                These occasions are no longer active in the catalog. Uncheck to remove them or reactivate them in
                Occasions.
              </p>
              <ul className="mt-2 space-y-2">
                {linkedOrphanIds.map((id) => {
                  const label =
                    editingRow?.occasionAssignments?.find((a) => a.occasionTypeId === id)?.occasionName ?? id;
                  return (
                    <li key={id}>
                      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-amber-500/20 px-3 py-2 font-body text-sm text-foreground/80">
                        <input
                          type="checkbox"
                          checked={linkedOccasionIds.includes(id)}
                          onChange={() => onToggleLinkedOccasion(id)}
                          className="h-4 w-4 shrink-0 rounded border-amber-400/50 text-amber-400 focus:ring-amber-400"
                        />
                        <span>{label}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>

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
            disabled={!canSubmit}
            className="rounded-xl border border-gold/35 bg-gold/15 px-5 py-3 font-brand text-sm tracking-[0.08em] text-gold transition hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : editingId ? "Save changes" : "Create event type"}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
