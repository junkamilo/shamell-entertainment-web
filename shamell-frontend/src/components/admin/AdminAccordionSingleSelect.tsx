"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminAccordionSingleOption = { id: string; label: string };

type Props = {
  options: AdminAccordionSingleOption[];
  /** Selected option id; empty string = none when `showNoneOption` */
  value: string;
  onChange: (id: string) => void;
  /** Summary and first-row label when value is empty (only if showNoneOption) */
  emptyDisplay?: string;
  /** Include first row to clear selection (optional fields). Set false for required enums like status. */
  showNoneOption?: boolean;
  ariaLabel?: string;
  /** Reflect HTML required for accessibility */
  required?: boolean;
  className?: string;
  disabled?: boolean;
};

export default function AdminAccordionSingleSelect({
  options,
  value,
  onChange,
  emptyDisplay = "Select an option",
  showNoneOption = true,
  ariaLabel,
  required = false,
  className,
  disabled = false,
}: Props) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.id === value);
  const summaryText = selected?.label ?? emptyDisplay;

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const el = containerRef.current;
      if (el && !el.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const pick = (id: string) => {
    onChange(id);
    close();
  };

  const rows: AdminAccordionSingleOption[] = showNoneOption
    ? [{ id: "", label: emptyDisplay }, ...options]
    : options;

  const activeDescendantId =
    showNoneOption && value === ""
      ? `${listId}-opt-empty`
      : `${listId}-opt-${value}`;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <motion.button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-label={ariaLabel}
        data-required={required || undefined}
        onClick={() => !disabled && setOpen((v) => !v)}
        whileTap={disabled ? undefined : { scale: 0.99 }}
        transition={{ type: "spring", stiffness: 520, damping: 38 }}
        className={cn(
          "shamell-glass-trigger flex w-full min-h-[52px] items-center justify-between gap-3 rounded-xl px-4 py-3 text-left",
          "font-body text-base tracking-wide text-foreground",
          disabled && "cursor-not-allowed opacity-45",
          open && "ring-2 ring-gold/25",
        )}
      >
        <span
          className={cn(
            "min-w-0 truncate",
            showNoneOption && !selected && "text-foreground",
          )}
        >
          {summaryText}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-gold/85 transition-transform duration-200",
            open && "rotate-180",
          )}
          strokeWidth={1.75}
          aria-hidden
        />
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            key={`${listId}-menu`}
            id={listId}
            role="listbox"
            aria-activedescendant={activeDescendantId}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { type: "spring", damping: 26, stiffness: 320, mass: 0.75 },
            }}
            exit={{
              opacity: 0,
              y: -6,
              scale: 0.99,
              transition: { duration: 0.16, ease: [0.4, 0, 1, 1] },
            }}
            className={cn(
              "shamell-glass-menu absolute left-0 right-0 top-[calc(100%+6px)] z-120 max-h-72 origin-top overflow-y-auto rounded-xl",
              "shamell-scrollbar shadow-lg shadow-black/20",
            )}
          >
            {rows.map((row) => {
              const isSel = row.id === value;
              const rowKey = row.id === "" ? "empty" : row.id;
              const optId = row.id === "" ? `${listId}-opt-empty` : `${listId}-opt-${row.id}`;
              return (
                <button
                  key={rowKey}
                  type="button"
                  role="option"
                  aria-selected={isSel}
                  id={optId}
                  onClick={() => pick(row.id)}
                  className={cn(
                    "flex w-full items-center gap-3 border-b border-gold/8 px-4 py-3 text-left transition-colors last:border-b-0",
                    "hover:bg-gold/7",
                    isSel && "bg-gold/9",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border transition-colors",
                      isSel
                        ? "border-gold/70 bg-gold/15 shadow-[inset_0_0_0_1px_rgba(197,165,90,0.25)]"
                        : "border-gold/30 bg-gold/8",
                    )}
                    aria-hidden
                  >
                    {isSel ? <Check className="h-3.5 w-3.5 text-gold" strokeWidth={2.25} /> : null}
                  </span>
                  <span
                    className={cn(
                      "min-w-0 flex-1 font-body text-base leading-snug tracking-wide",
                      row.id === "" ? "text-foreground" : "text-foreground",
                    )}
                  >
                    {row.label}
                  </span>
                </button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
