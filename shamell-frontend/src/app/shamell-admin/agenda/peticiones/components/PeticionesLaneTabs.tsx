import type { PeticionesLane } from "../types/peticiones.types";

type Props = {
  activeLane: PeticionesLane;
  onLaneChange: (lane: PeticionesLane) => void;
  /** Unread concierge / “Tell us your vision” items (guidance lane). */
  guidanceUnread?: number;
};

export default function PeticionesLaneTabs({
  activeLane,
  onLaneChange,
  guidanceUnread = 0,
}: Props) {
  const showGuidanceDot =
    guidanceUnread > 0 && activeLane !== "guidance";
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
            ? "relative rounded-full border border-gold/40 bg-gold/12 px-3 py-2 font-brand text-[10px] tracking-[0.14em] text-gold sm:px-4 sm:py-1.5"
            : "relative rounded-full border border-gold/18 px-3 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/60 hover:border-gold/35 hover:text-gold sm:px-4 sm:py-1.5"
        }
      >
        GUIDANCE
        {showGuidanceDot ? (
          <span
            className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-[#0c0610] bg-gold shadow-[0_0_8px_rgba(212,175,55,0.65)]"
            aria-label={`${guidanceUnread} new guidance ${guidanceUnread === 1 ? "request" : "requests"}`}
          />
        ) : null}
      </button>
    </div>
  );
}
