"use client";

import { Html } from "@react-three/drei";

const RESERVED_LABEL = "Reserved";

type Props = {
  /** World Y offset above the item origin. */
  height?: number;
};

export default function ReservationSpeechBubble({ height = 1.25 }: Props) {
  return (
    <Html
      position={[0, height, 0]}
      center
      transform
      distanceFactor={6}
      occlude={false}
      zIndexRange={[80, 0]}
    >
      <div
        className="pointer-events-none relative max-w-[9rem] select-none"
        aria-label={RESERVED_LABEL}
      >
        <div className="relative rounded-[999px] border-2 border-black bg-white px-3 py-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
          <p className="text-center text-[11px] font-bold leading-tight text-black">{RESERVED_LABEL}</p>
          <span
            className="absolute -bottom-2 left-3 h-0 w-0 border-x-[7px] border-t-[10px] border-x-transparent border-t-black"
            aria-hidden
          />
          <span
            className="absolute -bottom-[5px] left-[calc(0.75rem+2px)] h-0 w-0 border-x-[5px] border-t-[8px] border-x-transparent border-t-white"
            aria-hidden
          />
        </div>
      </div>
    </Html>
  );
}
