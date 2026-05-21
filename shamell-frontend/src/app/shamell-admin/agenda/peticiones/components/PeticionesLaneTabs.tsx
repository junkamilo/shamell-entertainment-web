import type { PeticionesLane } from "../types/peticiones.types";

type Props = {
  activeLane: PeticionesLane;
  onLaneChange: (lane: PeticionesLane) => void;
};

export default function PeticionesLaneTabs({ activeLane, onLaneChange }: Props) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
      <button
        type="button"
        onClick={() => onLaneChange("bookings")}
        className={
          activeLane === "bookings"
            ? "rounded-full border border-gold/40 bg-gold/12 px-3 py-2 font-brand text-[10px] tracking-[0.14em] text-gold sm:px-4 sm:py-1.5"
            : "rounded-full border border-gold/18 px-3 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/60 hover:border-gold/35 hover:text-gold sm:px-4 sm:py-1.5"
        }
      >
        BOOKINGS & REQUESTS
      </button>
      <button
        type="button"
        onClick={() => onLaneChange("guidance")}
        className={
          activeLane === "guidance"
            ? "rounded-full border border-gold/40 bg-gold/12 px-3 py-2 font-brand text-[10px] tracking-[0.14em] text-gold sm:px-4 sm:py-1.5"
            : "rounded-full border border-gold/18 px-3 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/60 hover:border-gold/35 hover:text-gold sm:px-4 sm:py-1.5"
        }
      >
        GUIDANCE
      </button>
    </div>
  );
}
