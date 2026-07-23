"use client";

import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  calendar: ReactNode;
  timePanel: ReactNode;
};

export function ScheduleMobileSwipePanels({ calendar, timePanel }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [slideWidth, setSlideWidth] = useState(0);

  useLayoutEffect(() => {
    const node = viewportRef.current;
    if (!node) return;

    const measure = () => setSlideWidth(node.clientWidth);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const panelWidth = slideWidth > 0 ? slideWidth : undefined;

  return (
    <div className="min-w-0 w-full">
      <div
        ref={viewportRef}
        className={cn(
          "shamell-scrollbar w-full max-w-full touch-pan-x overflow-x-auto overscroll-x-contain",
          "snap-x snap-mandatory [-webkit-overflow-scrolling:touch]",
          "min-h-[min(72dvh,28rem)]",
        )}
        aria-label="Schedule calendar and time details"
      >
        <div className="flex">
          <section
            className="flex shrink-0 snap-start snap-always flex-col justify-center px-1"
            style={panelWidth ? { width: panelWidth } : { width: "100%" }}
          >
            {calendar}
          </section>
          <section
            className="flex shrink-0 snap-start snap-always flex-col justify-center px-1"
            style={panelWidth ? { width: panelWidth } : { width: "100%" }}
          >
            {timePanel}
          </section>
        </div>
      </div>
      <p className="mt-3 text-center font-body text-xs tracking-wide text-foreground/50">
        Swipe for time &amp; details
      </p>
    </div>
  );
}
