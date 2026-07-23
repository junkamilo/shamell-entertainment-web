import type { PeticionesLane } from "../types/peticiones.types";

type Props = {
  activeLane: PeticionesLane;
  onLaneChange: (lane: PeticionesLane) => void;
  /** Unread concierge / “Tell us your vision” items (guidance lane). */
  guidanceUnread?: number;
  /** Unread private class bookings. */
  privateClassesUnread?: number;
};

const activeClass =
  "relative rounded-full border border-gold/40 bg-gold/12 px-3 py-2 font-brand text-[10px] tracking-[0.14em] text-gold sm:px-4 sm:py-1.5";
const inactiveClass =
  "relative rounded-full border border-gold/18 px-3 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/60 hover:border-gold/35 hover:text-gold sm:px-4 sm:py-1.5";

export default function PeticionesLaneTabs({
  activeLane,
  onLaneChange,
  guidanceUnread = 0,
  privateClassesUnread = 0,
}: Props) {
  const showGuidanceDot =
    guidanceUnread > 0 && activeLane !== "guidance";
  const showPrivateDot =
    privateClassesUnread > 0 && activeLane !== "private_classes";

  return (
    <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
      <button
        type="button"
        onClick={() => onLaneChange("bookings")}
        className={activeLane === "bookings" ? activeClass : inactiveClass}
      >
        BOOKINGS & REQUESTS
      </button>
      <button
        type="button"
        onClick={() => onLaneChange("guidance")}
        className={activeLane === "guidance" ? activeClass : inactiveClass}
      >
        GUIDANCE
        {showGuidanceDot ? (
          <span
            className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-[#0c0610] bg-gold shadow-[0_0_8px_rgba(212,175,55,0.65)]"
            aria-label={`${guidanceUnread} new guidance ${guidanceUnread === 1 ? "request" : "requests"}`}
          />
        ) : null}
      </button>
      <button
        type="button"
        onClick={() => onLaneChange("private_classes")}
        className={
          activeLane === "private_classes" ? activeClass : inactiveClass
        }
      >
        PRIVATE CLASSES
        {showPrivateDot ? (
          <span
            className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-[#0c0610] bg-gold shadow-[0_0_8px_rgba(212,175,55,0.65)]"
            aria-label={`${privateClassesUnread} new private ${privateClassesUnread === 1 ? "class" : "classes"}`}
          />
        ) : null}
      </button>
    </div>
  );
}
