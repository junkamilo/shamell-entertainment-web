"use client";

import type { CSSProperties } from "react";
import { Html } from "@react-three/drei";

type ShellVariant = "reserved" | "number";

const VARIANT_PILL_STYLE: Record<ShellVariant, CSSProperties> = {
  reserved: {
    backgroundColor: "#ffffff",
    border: "2px solid #000000",
    color: "#000000",
  },
  number: {
    backgroundColor: "rgba(201, 162, 39, 0.96)",
    border: "1px solid rgba(168, 132, 32, 0.9)",
    color: "#1a1218",
  },
};

const VARIANT_TAIL: Record<ShellVariant, { outer: string; inner: string }> = {
  reserved: { outer: "#000000", inner: "#ffffff" },
  number: { outer: "rgba(168, 132, 32, 0.9)", inner: "rgba(201, 162, 39, 0.96)" },
};

type Props = {
  label: string;
  ariaLabel: string;
  height?: number;
  variant?: ShellVariant;
  showTail?: boolean;
  maxWidthClass?: string;
};

export default function VenueHtmlLabelShell({
  label,
  ariaLabel,
  height = 1.25,
  variant = "reserved",
  showTail = true,
  maxWidthClass = "max-w-[9rem]",
}: Props) {
  const pillStyle = VARIANT_PILL_STYLE[variant];
  const tail = VARIANT_TAIL[variant];

  return (
    <Html
      position={[0, height, 0]}
      center
      distanceFactor={10}
      occlude={false}
      zIndexRange={variant === "number" ? [70, 0] : [80, 0]}
      wrapperClass="venue-3d-html-label"
    >
      <div
        className={`pointer-events-none relative ${maxWidthClass} select-none`}
        aria-label={ariaLabel}
      >
        <div
          className="relative rounded-[999px] px-3 py-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.35)]"
          style={pillStyle}
        >
          <p className="text-center text-[11px] font-bold leading-tight">{label}</p>
          {showTail ? (
            <>
              <span
                className="absolute -bottom-2 left-3 h-0 w-0 border-x-[7px] border-t-[10px] border-x-transparent"
                style={{ borderTopColor: tail.outer }}
                aria-hidden
              />
              <span
                className="absolute -bottom-[5px] left-[calc(0.75rem+2px)] h-0 w-0 border-x-[5px] border-t-[8px] border-x-transparent"
                style={{ borderTopColor: tail.inner }}
                aria-hidden
              />
            </>
          ) : null}
        </div>
      </div>
    </Html>
  );
}
