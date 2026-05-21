import type { EnrichedBooking } from "../types/miAgenda.types";
import MiAgendaEventDetailsRead from "./MiAgendaEventDetailsRead";
import MiAgendaEventEditForm from "./MiAgendaEventEditForm";

type Props = {
  selected: EnrichedBooking | null;
  isEditing: boolean;
  savingEdit: boolean;
  savingCancel: boolean;
  editDateIso: string;
  editStart: string;
  editEnd: string;
  editLocation: string;
  editNotes: string;
  onToggleEdit: () => void;
  onOpenCancelModal: () => void;
  onEditDateChange: (value: string) => void;
  onEditStartChange: (value: string) => void;
  onEditEndChange: (value: string) => void;
  onEditLocationChange: (value: string) => void;
  onEditNotesChange: (value: string) => void;
  onSave: () => void;
};

export default function MiAgendaEventDetailsPanel({
  selected,
  isEditing,
  savingEdit,
  savingCancel,
  editDateIso,
  editStart,
  editEnd,
  editLocation,
  editNotes,
  onToggleEdit,
  onOpenCancelModal,
  onEditDateChange,
  onEditStartChange,
  onEditEndChange,
  onEditLocationChange,
  onEditNotesChange,
  onSave,
}: Props) {
  return (
    <div className="mt-5 border-t border-gold/12 pt-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-brand text-[11px] tracking-[0.18em] text-gold">EVENT DETAILS</h2>
        {selected ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleEdit}
              disabled={savingEdit || savingCancel}
              className="rounded-md border border-gold/35 px-3 py-1.5 font-brand text-[10px] tracking-[0.14em] text-gold hover:bg-gold/10 disabled:opacity-50"
            >
              {isEditing ? "CLOSE" : "EDIT"}
            </button>
            <button
              type="button"
              onClick={onOpenCancelModal}
              disabled={savingEdit || savingCancel}
              className="rounded-md border border-red-300/45 px-3 py-1.5 font-brand text-[10px] tracking-[0.14em] text-red-200 hover:bg-red-500/10 disabled:opacity-50"
            >
              {savingCancel ? "CANCELING..." : "CANCEL"}
            </button>
          </div>
        ) : null}
      </div>

      {!selected ? (
        <p className="shamell-glass-surface rounded-xl p-4 text-sm text-foreground/55">
          Select an event on the calendar to see its details.
        </p>
      ) : (
        <div className="shamell-glass-surface rounded-xl border border-gold/12 p-4">
          {!isEditing ? (
            <MiAgendaEventDetailsRead selected={selected} />
          ) : (
            <MiAgendaEventEditForm
              editDateIso={editDateIso}
              editStart={editStart}
              editEnd={editEnd}
              editLocation={editLocation}
              editNotes={editNotes}
              savingEdit={savingEdit}
              savingCancel={savingCancel}
              onEditDateChange={onEditDateChange}
              onEditStartChange={onEditStartChange}
              onEditEndChange={onEditEndChange}
              onEditLocationChange={onEditLocationChange}
              onEditNotesChange={onEditNotesChange}
              onSave={onSave}
            />
          )}
        </div>
      )}
    </div>
  );
}
