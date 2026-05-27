"use client";

import FloorLayoutPublishToggle from "./FloorLayoutPublishToggle";

type Props = {
  chairTotal: number;
  dirty: boolean;
};

export default function FloorLayoutToolbar({ chairTotal, dirty }: Props) {
  return (
    <header className="shrink-0 border-b border-shamell-line-soft px-3 py-2 sm:px-4 sm:py-3">
      <div className="flex flex-wrap items-center justify-between gap-2 lg:items-start lg:gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold text-shamell-text-primary sm:text-lg">
            Venue layout
          </h1>
          <p className="text-xs text-shamell-gold sm:text-sm">
            Chairs:{" "}
            <span className="font-semibold text-shamell-text-primary">{chairTotal}</span>
            {dirty ? (
              <span className="ml-2 text-shamell-fireOrange">Unsaved</span>
            ) : null}
          </p>
        </div>
        <FloorLayoutPublishToggle />
      </div>
      <p className="mt-1.5 hidden text-[10px] text-shamell-text-primary/80 sm:block lg:mt-2">
        Tables and chairs come from Table seating inventory. Drag from the palette to place;
        delete to return to stock. Use the toolbar on the floor plan to rotate, delete, or save.
      </p>
    </header>
  );
}
