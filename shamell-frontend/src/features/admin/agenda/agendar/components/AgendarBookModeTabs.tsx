import type { AgendarBookModeTabsProps } from "../types/agendarComponents.types";

export function AgendarBookModeTabs({ activeMode, onModeChange, showClassTab }: AgendarBookModeTabsProps) {
  if (!showClassTab) return null;

  return (
    <div className="mb-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
      <button
        type="button"
        data-testid="agendar-tab-event"
        onClick={() => onModeChange("event")}
        className={
          activeMode === "event"
            ? "rounded-full border border-gold/40 bg-gold/12 px-3 py-2 font-brand text-[10px] tracking-[0.14em] text-gold sm:px-4 sm:py-1.5"
            : "rounded-full border border-gold/18 px-3 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/60 hover:border-gold/35 hover:text-gold sm:px-4 sm:py-1.5"
        }
      >
        BOOK
      </button>
      <button
        type="button"
        data-testid="agendar-tab-class"
        onClick={() => onModeChange("class")}
        className={
          activeMode === "class"
            ? "rounded-full border border-gold/40 bg-gold/12 px-3 py-2 font-brand text-[10px] tracking-[0.14em] text-gold sm:px-4 sm:py-1.5"
            : "rounded-full border border-gold/18 px-3 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/60 hover:border-gold/35 hover:text-gold sm:px-4 sm:py-1.5"
        }
      >
        BOOK CLASS
      </button>
    </div>
  );
}
