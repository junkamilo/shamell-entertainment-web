"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AGENDAR_FORM_ID, submitButtonClass, submitButtonClassMobile } from "../../shared/lib/agendaFormStyles";
import type { AgendarSubmitBarProps } from "../types/agendarComponents.types";

export function AgendarSubmitBar({ isEditMode, submitting, variant }: AgendarSubmitBarProps) {
  const label = isEditMode ? "SAVE BOOKING" : "CREATE BOOKING";

  if (variant === "mobile-fixed") {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-130 flex justify-center border-t border-gold/20 bg-[#0b0f14]/95 px-4 py-3 backdrop-blur-md supports-backdrop-filter:bg-[#0b0f14]/88 md:hidden">
        <button
          type="submit"
          form={AGENDAR_FORM_ID}
          data-testid="agendar-submit"
          disabled={submitting}
          className={cn(submitButtonClassMobile, "pointer-events-auto w-full max-w-lg")}
        >
          {submitting ? <Loader2 className="inline h-4 w-4 animate-spin" /> : null}
          {label}
        </button>
      </div>
    );
  }

  return (
    <button
      type="submit"
      data-testid="agendar-submit"
      disabled={submitting}
      className={cn(submitButtonClass, "md:max-w-none")}
    >
      {submitting ? <Loader2 className="inline h-4 w-4 animate-spin" /> : null}
      {label}
    </button>
  );
}
