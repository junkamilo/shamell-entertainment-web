import ShamellTime12hColumns from "@/components/ShamellTime12hColumns";
import { ShamellDateField } from "@/components/admin/ShamellDateField";
import { hhmmToParts, partsToHHMM } from "@/lib/contactLogisticsUtils";

type Props = {
  editDateIso: string;
  editStart: string;
  editEnd: string;
  editLocation: string;
  editNotes: string;
  savingEdit: boolean;
  savingCancel: boolean;
  onEditDateChange: (value: string) => void;
  onEditStartChange: (value: string) => void;
  onEditEndChange: (value: string) => void;
  onEditLocationChange: (value: string) => void;
  onEditNotesChange: (value: string) => void;
  onSave: () => void;
};

export default function MiAgendaEventEditForm({
  editDateIso,
  editStart,
  editEnd,
  editLocation,
  editNotes,
  savingEdit,
  savingCancel,
  onEditDateChange,
  onEditStartChange,
  onEditEndChange,
  onEditLocationChange,
  onEditNotesChange,
  onSave,
}: Props) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <ShamellDateField
        label="DATE"
        value={editDateIso}
        onChange={onEditDateChange}
        placeholder="Choose date"
      />
      <label className="block">
        <span className="font-brand text-[10px] tracking-widest text-gold/70">LOCATION</span>
        <input
          type="text"
          value={editLocation}
          onChange={(e) => onEditLocationChange(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gold/20 bg-black/25 px-3 py-2 text-sm text-foreground outline-none focus:border-gold/40"
        />
      </label>
      <div className="block md:col-span-2">
        <span className="font-brand text-[10px] tracking-widest text-gold/70">START TIME</span>
        <ShamellTime12hColumns
          className="mt-1 max-w-sm"
          value={hhmmToParts(/^\d{2}:\d{2}$/.test(editStart.trim()) ? editStart.trim() : "12:00")}
          onChange={(p) => onEditStartChange(partsToHHMM(p.h12, p.min, p.ap))}
          labels={{ hour: "HOUR", minute: "MIN", period: "AM/PM" }}
        />
      </div>
      <div className="block md:col-span-2">
        <span className="font-brand text-[10px] tracking-widest text-gold/70">END TIME</span>
        <ShamellTime12hColumns
          className="mt-1 max-w-sm"
          value={hhmmToParts(
            /^\d{2}:\d{2}$/.test(editEnd.trim())
              ? editEnd.trim()
              : /^\d{2}:\d{2}$/.test(editStart.trim())
                ? editStart.trim()
                : "12:00",
          )}
          onChange={(p) => onEditEndChange(partsToHHMM(p.h12, p.min, p.ap))}
          labels={{ hour: "HOUR", minute: "MIN", period: "AM/PM" }}
        />
      </div>
      <label className="block md:col-span-2">
        <span className="font-brand text-[10px] tracking-widest text-gold/70">NOTES</span>
        <textarea
          value={editNotes}
          onChange={(e) => onEditNotesChange(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-gold/20 bg-black/25 px-3 py-2 text-sm text-foreground outline-none focus:border-gold/40"
        />
      </label>
      <div className="md:col-span-2">
        <button
          type="button"
          onClick={onSave}
          disabled={savingEdit || savingCancel}
          className="rounded-md border border-gold/35 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-gold hover:bg-gold/10 disabled:opacity-50"
        >
          {savingEdit ? "SAVING..." : "SAVE CHANGES"}
        </button>
      </div>
    </div>
  );
}
