"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { AdminMediaUploadIconButton } from "./AdminMediaUploadIconButton";

export type AdminMediaPickControlProps = {
  /** Passed to the hidden file input (default: images + videos). */
  accept?: string;
  /** When true, allows multi-select and uses cloud-upload icon. */
  multiple?: boolean;
  onFileChange?: (file: File | null) => void;
  onFilesChange?: (files: File[]) => void;
  disabled?: boolean;
  /** Shown next to the trigger when nothing is selected. */
  emptySelectionLabel?: string;
  /** Single-file mode: chosen file name (truncated). */
  selectedFileName?: string | null;
  /** Multi-file mode: number of selected files for status text. */
  selectedFileCount?: number;
  className?: string;
  triggerClassName?: string;
  "aria-label"?: string;
};

/**
 * Reusable admin control: hidden native file input + compact icon trigger + status line.
 * Use with `ref` to reset the input (`ref.current.value = ""`) after upload or delete.
 */
export const AdminMediaPickControl = forwardRef<HTMLInputElement, AdminMediaPickControlProps>(
  function AdminMediaPickControl(
    {
      accept = "image/*,video/*",
      multiple = false,
      onFileChange,
      onFilesChange,
      disabled = false,
      emptySelectionLabel = "No file chosen",
      selectedFileName = null,
      selectedFileCount = 0,
      className,
      triggerClassName,
      "aria-label": ariaLabel = "Select image or video file",
    },
    ref,
  ) {
    const trimmedName = selectedFileName?.trim();
    const statusText = multiple
      ? selectedFileCount > 0
        ? `${selectedFileCount} file(s) selected`
        : emptySelectionLabel
      : trimmedName
        ? trimmedName
        : emptySelectionLabel;
    const hasSelection = multiple ? selectedFileCount > 0 : Boolean(trimmedName);

    return (
      <div
        className={cn(
          "mt-2 flex min-h-12 w-full items-center gap-3 rounded-xl border border-gold/30 bg-black/15 px-3 py-2 ring-1 ring-gold/8",
          disabled && "pointer-events-none opacity-50",
          className,
        )}
      >
        <AdminMediaUploadIconButton
          ref={ref}
          accept={accept}
          multiple={multiple}
          iconVariant={multiple ? "cloud-upload" : "plus"}
          disabled={disabled}
          triggerClassName={triggerClassName}
          aria-label={ariaLabel}
          onFilesChange={(files) => {
            if (multiple) {
              onFilesChange?.(files);
            } else {
              onFileChange?.(files[0] ?? null);
            }
          }}
        />
        <p
          className={cn(
            "min-w-0 flex-1 truncate font-body text-sm",
            hasSelection ? "text-foreground/85" : "text-foreground/45",
          )}
          title={!multiple && trimmedName ? trimmedName : undefined}
        >
          {statusText}
        </p>
      </div>
    );
  },
);
