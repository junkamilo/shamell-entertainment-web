"use client";

import VenueHtmlLabelShell from "../VenueHtmlLabelShell";

export type VenueItemNumberBubbleProps = {
  shortLabel: string;
  fullLabel: string;
  height?: number;
  variant?: "table" | "chair";
};

export default function VenueItemNumberBubble({
  shortLabel,
  fullLabel,
  height = 0.95,
}: VenueItemNumberBubbleProps) {
  return (
    <VenueHtmlLabelShell
      label={shortLabel}
      ariaLabel={fullLabel}
      height={height}
      variant="number"
      maxWidthClass="max-w-[7.5rem]"
    />
  );
}
