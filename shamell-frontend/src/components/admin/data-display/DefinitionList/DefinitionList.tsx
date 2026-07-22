import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DefinitionField = {
  label: string;
  value: ReactNode;
  /** Span full grid width on sm+ (notes, long messages). */
  fullWidth?: boolean;
  emptyFallback?: string;
};

export type DefinitionListProps = {
  fields: DefinitionField[];
  columns?: 1 | 2;
  className?: string;
  /** Optional section header (e.g. FORM DETAILS). Enables glass card chrome. */
  sectionTitle?: string;
};

function isEmptyValue(value: ReactNode): boolean {
  return value === null || value === undefined || value === "";
}

/**
 * Generic labeled field grid for admin read-only detail views.
 * Domain mappers (inquiry JSON, booking rows) produce `fields`; this only renders.
 */
export function DefinitionList({
  fields,
  columns = 2,
  className,
  sectionTitle,
}: DefinitionListProps) {
  if (fields.length === 0) return null;

  const list = (
    <dl
      className={cn(
        "grid gap-4 sm:gap-5",
        columns === 2 ? "sm:grid-cols-2" : "grid-cols-1",
        !sectionTitle && className,
      )}
    >
      {fields.map((field, idx) => {
        const empty = isEmptyValue(field.value);
        return (
          <div
            key={`${field.label}-${idx}`}
            className={cn("min-w-0", field.fullWidth && "sm:col-span-2")}
          >
            <dt className="font-brand text-[11px] tracking-widest text-gold/60 sm:text-xs">
              {field.label}
            </dt>
            <dd
              className={cn(
                "mt-1.5 wrap-break-word font-body text-base leading-relaxed sm:text-lg sm:leading-relaxed",
                empty ? "italic text-foreground/40" : "text-foreground/88",
              )}
            >
              {empty ? (field.emptyFallback ?? "—") : field.value}
            </dd>
          </div>
        );
      })}
    </dl>
  );

  if (!sectionTitle) {
    return list;
  }

  return (
    <div className={cn("shamell-glass-surface rounded-xl p-4 sm:p-5", className)}>
      <p className="mb-4 font-brand text-xs tracking-[0.18em] text-gold/75 sm:text-sm">
        {sectionTitle}
      </p>
      {list}
    </div>
  );
}
