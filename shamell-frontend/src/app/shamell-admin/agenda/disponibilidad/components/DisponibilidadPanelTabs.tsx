import {
  disponibilidadTabButtonActiveClass,
  disponibilidadTabButtonInactiveClass,
} from "../lib/disponibilidadStyles";
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
            ? disponibilidadTabButtonActiveClass
            : disponibilidadTabButtonInactiveClass
        }
      >
        WEEKLY HOURS
      </button>
      <button
        type="button"
        onClick={() => onPanelChange("closures")}
        className={
          activePanel === "closures"
            ? disponibilidadTabButtonActiveClass
            : disponibilidadTabButtonInactiveClass
        }
      >
        CLOSURES
      </button>
    </div>
  );
}
