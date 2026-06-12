"use client";

import VenueHtmlLabelShell from "./VenueHtmlLabelShell";

const RESERVED_LABEL = "Reserved";

type Props = {
  /** World Y offset above the item origin. */
  height?: number;
};

export default function ReservationSpeechBubble({ height = 1.25 }: Props) {
  return (
    <VenueHtmlLabelShell
      label={RESERVED_LABEL}
      ariaLabel={RESERVED_LABEL}
      height={height}
      variant="reserved"
    />
  );
}
