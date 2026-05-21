import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  filteredCount: number;
  pageOffset: number;
  paginatedCount: number;
  safePage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function ServicesPagination({
  filteredCount,
  pageOffset,
  paginatedCount,
  safePage,
  totalPages,
  onPageChange,
}: Props) {
  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-gold/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="font-body text-xs text-foreground/50">
        Mostrando {pageOffset + 1}-{pageOffset + paginatedCount} de {filteredCount}
      </p>
      <div className="flex max-w-full items-center gap-1 overflow-x-auto [-webkit-overflow-scrolling:touch] pb-0.5">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          className="rounded-lg border border-gold/20 p-2 text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onPageChange(n)}
            className={cn(
              "min-w-[2.25rem] rounded-lg border px-2.5 py-1.5 font-brand text-xs tracking-wide transition",
              n === safePage
                ? "border-gold/55 bg-gold/12 text-gold"
                : "border-transparent text-foreground/50 hover:border-gold/25 hover:text-gold",
            )}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          className="rounded-lg border border-gold/20 p-2 text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
