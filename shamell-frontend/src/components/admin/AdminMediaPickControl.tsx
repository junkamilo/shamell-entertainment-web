"use client";

import { forwardRef, useId } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminMediaPickControlProps = {
  /** Passed to the hidden file input (default: images + videos). */
  accept?: string;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
  /** Shown next to the + control when no file is selected (e.g. “No file chosen”). */
  emptySelectionLabel?: string;
  /** When set, shown as the chosen file name (truncated). */
  selectedFileName?: string | null;
  className?: string;
  triggerClassName?: string;
  "aria-label"?: string;
};

/**
 * Reusable admin control: hidden native file input + visible “+” trigger.
 * Use with `ref` to reset the input (`ref.current.value = ""`) after upload or delete.
 */
export const AdminMediaPickControl = forwardRef<HTMLInputElement, AdminMediaPickControlProps>(
  function AdminMediaPickControl(
    {
      accept = "image/*,video/*",
      onFileChange,
      disabled = false,
      emptySelectionLabel = "No file chosen",
      selectedFileName = null,
      className,
      triggerClassName,
      "aria-label": ariaLabel = "Select image or video file",
    },
    ref,
  ) {
    const inputId = useId();
    const trimmedName = selectedFileName?.trim();
    const statusText = trimmedName ? trimmedName : emptySelectionLabel;

    return (
      <div
        className={cn(
          "mt-2 flex min-h-12 w-full items-center gap-3 rounded-xl border border-gold/30 bg-black/15 px-3 py-2 ring-1 ring-gold/8",
          disabled && "pointer-events-none opacity-50",
          className,
        )}
      >
        <input
          ref={ref}
          id={inputId}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
          disabled={disabled}
        />
        <label
          htmlFor={inputId}
          className={cn(
            "flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gold/40 bg-gold/15 text-gold transition",
            "hover:border-gold/55 hover:bg-gold/25 focus-within:outline-none focus-within:ring-2 focus-within:ring-gold/30",
            triggerClassName,
          )}
          aria-label={ariaLabel}
        >
          <Plus className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </label>
        <p
          className={cn(
            "min-w-0 flex-1 truncate font-body text-sm",
            trimmedName ? "text-foreground/85" : "text-foreground/45",
          )}
          title={trimmedName || undefined}
        >
          {statusText}
        </p>
      </div>
    );
  },
);
