"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { PAGINATION_PER_PAGE_OPTIONS, type PaginationMeta } from "@/lib/pagination";

type AdminPaginationProps = {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  className?: string;
};

function rangeStart(meta: PaginationMeta): number {
  if (meta.totalItems === 0) return 0;
  return (meta.page - 1) * meta.perPage + 1;
}

function rangeEnd(meta: PaginationMeta): number {
  if (meta.totalItems === 0) return 0;
  return Math.min(meta.page * meta.perPage, meta.totalItems);
}

export default function AdminPagination({ meta, onPageChange, onPerPageChange, className }: AdminPaginationProps) {
  const pages = Array.from({ length: meta.totalPages }, (_, i) => i + 1);

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 ${className ?? ""}`}>
      <p className="text-xs text-foreground/55">
        Mostrando {rangeStart(meta)}-{rangeEnd(meta)} de {meta.totalItems}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1 rounded-full border border-gold/20 bg-black/20 px-1 py-1">
          <span className="px-2 text-[9px] font-brand tracking-[0.14em] text-foreground/60">POR PÁGINA</span>
          {PAGINATION_PER_PAGE_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onPerPageChange(n)}
              className={`rounded-full px-2.5 py-1 font-brand text-[10px] tracking-[0.14em] transition ${
                meta.perPage === n
                  ? "border border-gold/45 bg-gold/12 text-gold"
                  : "border border-transparent text-foreground/60 hover:border-gold/30 hover:text-gold"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={!meta.hasPrev}
          onClick={() => onPageChange(Math.max(1, meta.page - 1))}
          aria-label="Página anterior"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gold/25 text-gold disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.7} />
        </button>

        <div className="flex items-center gap-1">
          {pages.slice(Math.max(meta.page - 3, 0), Math.max(meta.page - 3, 0) + 5).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`rounded-md border px-2 py-1 font-brand text-[10px] tracking-[0.14em] ${
                p === meta.page
                  ? "border-gold/45 bg-gold/12 text-gold"
                  : "border-gold/25 text-foreground/70 hover:text-gold"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={!meta.hasNext}
          onClick={() => onPageChange(Math.min(meta.totalPages, meta.page + 1))}
          aria-label="Página siguiente"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gold/25 text-gold disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={1.7} />
        </button>
      </div>
    </div>
  );
}
