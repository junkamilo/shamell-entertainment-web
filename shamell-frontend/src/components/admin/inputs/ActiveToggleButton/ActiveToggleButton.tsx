"use client";

import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

const HOVER_WARNING_DELAY_MS = 450;

export type ActiveToggleButtonProps = {
  isActive: boolean;
  isToggling?: boolean;
  /** When true and `isActive`, turning off is blocked (click/hover shows warning). */
  deactivateBlocked?: boolean;
  onToggle: () => void;
  onBlockedDeactivate: () => void;
  ariaLabel: string;
  className?: string;
};

/**
 * Admin on/off switch. When deactivation is blocked, the control stays visible;
 * click or hover (short delay) invokes `onBlockedDeactivate` instead of toggling.
 */
export function ActiveToggleButton({
  isActive,
  isToggling = false,
  deactivateBlocked = false,
  onToggle,
  onBlockedDeactivate,
  ariaLabel,
  className,
}: ActiveToggleButtonProps) {
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHoverTimer = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  const showBlockedWarning = useCallback(() => {
    if (deactivateBlocked && isActive) onBlockedDeactivate();
  }, [deactivateBlocked, isActive, onBlockedDeactivate]);

  const handleClick = useCallback(() => {
    if (isToggling) return;
    if (deactivateBlocked && isActive) {
      showBlockedWarning();
      return;
    }
    onToggle();
  }, [deactivateBlocked, isActive, isToggling, onToggle, showBlockedWarning]);

  const handleMouseEnter = useCallback(() => {
    if (!deactivateBlocked || !isActive || isToggling) return;
    clearHoverTimer();
    hoverTimerRef.current = setTimeout(() => {
      hoverTimerRef.current = null;
      onBlockedDeactivate();
    }, HOVER_WARNING_DELAY_MS);
  }, [
    clearHoverTimer,
    deactivateBlocked,
    isActive,
    isToggling,
    onBlockedDeactivate,
  ]);

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={clearHoverTimer}
      disabled={isToggling}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full border transition",
        isActive
          ? "border-emerald-400/45 bg-emerald-500/22"
          : "border-gold/40 bg-gold/10 ring-1 ring-gold/20",
        isToggling && "cursor-wait opacity-60",
        className,
      )}
      aria-label={ariaLabel}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
          isActive ? "left-6" : "left-1",
        )}
      />
    </button>
  );
}
