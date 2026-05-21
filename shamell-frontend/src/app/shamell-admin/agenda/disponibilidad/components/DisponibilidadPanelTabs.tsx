import type { ActivePanel } from "../types/disponibilidad.types";

type Props = {
  activePanel: ActivePanel;
  onPanelChange: (panel: ActivePanel) => void;
};

export default function DisponibilidadPanelTabs({ activePanel, onPanelChange }: Props) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
      <button
        type="button"
        onClick={() => onPanelChange("weekly")}
        className={
          activePanel === "weekly"
            ? "rounded-full border border-gold/40 bg-gold/12 px-3 py-2 font-brand text-[10px] tracking-[0.14em] text-gold sm:px-4 sm:py-1.5"
            : "rounded-full border border-gold/18 px-3 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/60 hover:border-gold/35 hover:text-gold sm:px-4 sm:py-1.5"
        }
      >
        WEEKLY HOURS
      </button>
      <button
        type="button"
        onClick={() => onPanelChange("closures")}
        className={
          activePanel === "closures"
            ? "rounded-full border border-gold/40 bg-gold/12 px-3 py-2 font-brand text-[10px] tracking-[0.14em] text-gold sm:px-4 sm:py-1.5"
            : "rounded-full border border-gold/18 px-3 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/60 hover:border-gold/35 hover:text-gold sm:px-4 sm:py-1.5"
        }
      >
        CLOSURES
      </button>
    </div>
  );
}
