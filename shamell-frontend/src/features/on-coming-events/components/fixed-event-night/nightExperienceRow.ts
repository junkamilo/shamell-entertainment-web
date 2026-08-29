import { cn } from "@/lib/utils";

/** 4+ items → horizontal scroll on md+; 1–3 fit in equal columns. */
export const NIGHT_ROW_SCROLL_THRESHOLD = 4;

export function nightRowNeedsScroll(count: number): boolean {
  return count >= NIGHT_ROW_SCROLL_THRESHOLD;
}

function gridColsForCount(count: number): string {
  if (count <= 1) return "md:grid-cols-1";
  if (count === 2) return "md:grid-cols-2";
  return "md:grid-cols-3";
}

/**
 * Row container: mobile always 1-col stack with gap.
 * md+: equal grid for 1–3 items; flex + overflow-x when count ≥ 4.
 */
export function nightRowContainerClass(count: number): string {
  if (nightRowNeedsScroll(count)) {
    return cn(
      "flex gap-5 overflow-x-auto pb-1 md:gap-6",
      "snap-x snap-mandatory",
      "[scrollbar-width:thin]",
    );
  }
  return cn(
    "m-0 grid list-none grid-cols-1 gap-5 p-0 md:gap-6",
    gridColsForCount(count),
  );
}

/** Card width behavior inside a night row. */
export function nightRowCardClass(count: number): string {
  if (nightRowNeedsScroll(count)) {
    return cn(
      "min-w-[min(100%,17.5rem)] shrink-0 snap-start",
      "sm:min-w-[18.5rem] md:min-w-[19rem]",
    );
  }
  return "w-full min-w-0";
}
