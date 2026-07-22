import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TableRowActionsProps = {
  children: ReactNode;
  className?: string;
};

/** Right-aligned icon action group for admin table rows. */
export function TableRowActions({ children, className }: TableRowActionsProps) {
  return <div className={cn("flex justify-end gap-1", className)}>{children}</div>;
}

export const tableIconBtnClass =
  "rounded-lg border border-gold/18 p-2 text-foreground/55 transition hover:border-gold/35 hover:bg-gold/10 hover:text-gold";

export const tableIconBtnDangerClass =
  "rounded-lg border p-2 transition border-red-400/25 text-foreground/55 hover:border-red-400/45 hover:bg-red-500/10 hover:text-red-300";

export const tableIconBtnDisabledClass =
  "cursor-not-allowed rounded-lg border border-gold/10 p-2 text-foreground/30";

/** @deprecated Prefer tableIconBtnClass */
export const adminTableIconBtnClass = tableIconBtnClass;
/** @deprecated Prefer tableIconBtnDangerClass */
export const adminTableIconBtnDangerClass = tableIconBtnDangerClass;
/** @deprecated Prefer tableIconBtnDisabledClass */
export const adminTableIconBtnDisabledClass = tableIconBtnDisabledClass;
