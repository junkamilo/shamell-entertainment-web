import { cn } from "@/lib/utils";

export type TableTruncatedTextProps = {
  primary: string;
  secondary?: string;
  className?: string;
  primaryClassName?: string;
  secondaryClassName?: string;
};

/**
 * Two-line table cell: primary + optional secondary, both single-line truncated.
 */
export function TableTruncatedText({
  primary,
  secondary,
  className,
  primaryClassName,
  secondaryClassName,
}: TableTruncatedTextProps) {
  const primaryTrimmed = primary.trim();
  const secondaryTrimmed = secondary?.trim() ?? "";

  return (
    <div className={cn("min-w-0 max-w-full", className)}>
      <p
        className={cn("truncate font-brand text-sm tracking-[0.04em] text-gold", primaryClassName)}
        title={primaryTrimmed || undefined}
      >
        {primaryTrimmed || "—"}
      </p>
      {secondaryTrimmed ? (
        <p
          className={cn(
            "mt-0.5 truncate font-body text-[11px] text-foreground/50",
            secondaryClassName,
          )}
          title={secondaryTrimmed}
        >
          {secondaryTrimmed}
        </p>
      ) : null}
    </div>
  );
}
