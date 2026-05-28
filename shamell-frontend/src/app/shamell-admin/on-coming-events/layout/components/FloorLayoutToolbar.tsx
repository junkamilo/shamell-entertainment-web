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
    </header>
  );
}
