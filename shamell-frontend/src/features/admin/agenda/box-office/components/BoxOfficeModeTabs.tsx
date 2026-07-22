import type { BoxOfficeMode } from "../lib/boxOfficeMode";

type BoxOfficeModeTabsProps = {
  activeMode: BoxOfficeMode;
  onModeChange: (mode: BoxOfficeMode) => void;
};

const tabActive =
  "rounded-full border border-gold/40 bg-gold/12 px-3 py-2 font-brand text-[10px] tracking-[0.14em] text-gold sm:px-4 sm:py-1.5";
const tabIdle =
  "rounded-full border border-gold/18 px-3 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/60 hover:border-gold/35 hover:text-gold sm:px-4 sm:py-1.5";

export function BoxOfficeModeTabs({
  activeMode,
  onModeChange,
}: BoxOfficeModeTabsProps) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
      <button
        type="button"
        data-testid="box-office-tab-fixed"
        onClick={() => onModeChange("fixed")}
        className={activeMode === "fixed" ? tabActive : tabIdle}
      >
        FIXED EVENT
      </button>
      <button
        type="button"
        data-testid="box-office-tab-classes"
        onClick={() => onModeChange("classes")}
        className={activeMode === "classes" ? tabActive : tabIdle}
      >
        RECURRING WEEKDAYS (CLASSES)
      </button>
    </div>
  );
}
