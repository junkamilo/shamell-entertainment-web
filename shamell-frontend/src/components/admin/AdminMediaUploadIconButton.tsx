"use client";

import { forwardRef, useId } from "react";
import { CloudUpload, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminMediaUploadIconVariant = "plus" | "cloud-upload";

export type AdminMediaUploadIconButtonProps = {
  /** Passed to the hidden file input (default: images + videos). */
  accept?: string;
  multiple?: boolean;
  /** `cloud-upload` for multi-upload zones; `plus` for single-file pick rows. */
  iconVariant?: AdminMediaUploadIconVariant;
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  "aria-label"?: string;
};

/**
 * Reusable admin control: hidden native file input + compact icon trigger.
 * Use with `ref` so parent code can call `ref.current?.click()` (e.g. hero actions).
 * For single-file pick with filename row, use {@link AdminMediaPickControl}.
 */
export const AdminMediaUploadIconButton = forwardRef<
  HTMLInputElement,
  AdminMediaUploadIconButtonProps
>(function AdminMediaUploadIconButton(
  {
    accept = "image/*,video/*",
    multiple = false,
    iconVariant = "plus",
    onFilesChange,
    disabled = false,
    className,
    triggerClassName,
    "aria-label": ariaLabel = "Select image or video file",
  },
  ref,
) {
  const inputId = useId();
  const Icon = iconVariant === "cloud-upload" ? CloudUpload : Plus;
  const iconStroke = iconVariant === "cloud-upload" ? 1.25 : 1.75;

  return (
    <div className={cn(disabled && "pointer-events-none opacity-50", className)}>
      <input
        ref={ref}
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          const list = Array.from(event.target.files ?? []);
          if (list.length) onFilesChange(list);
          event.target.value = "";
        }}
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
        <Icon className="h-5 w-5" strokeWidth={iconStroke} aria-hidden />
      </label>
    </div>
  );
});
