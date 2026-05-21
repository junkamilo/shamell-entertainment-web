import { ChevronDown } from "lucide-react";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import { cn } from "@/lib/utils";
import type { GalleryCategory } from "../types/gallery.types";

type Props = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterDropdownOpen: boolean;
  onFilterDropdownOpenChange: (open: boolean) => void;
  filterDropdownRef: React.RefObject<HTMLDivElement | null>;
  listCategoryFilter: string | null;
  onListCategoryFilterChange: (id: string | null) => void;
  filterSummaryLabel: string;
  filterCount: number;
  filterMedioLabel: string;
  totalForFilterAll: number;
  sortedActiveCategories: GalleryCategory[];
  countByCategory: Record<string, number>;
};

export default function GalleryToolbar({
  searchQuery,
  onSearchChange,
  filterDropdownOpen,
  onFilterDropdownOpenChange,
  filterDropdownRef,
  listCategoryFilter,
  onListCategoryFilterChange,
  filterSummaryLabel,
  filterCount,
  filterMedioLabel,
  totalForFilterAll,
  sortedActiveCategories,
  countByCategory,
}: Props) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
      <AdminSearchInput
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Search by category name..."
        className="shamell-glass-surface mx-0 min-h-12 max-w-none flex-1 rounded-xl"
      />
      <div ref={filterDropdownRef} className="relative w-full shrink-0 lg:w-72">
        <button
          type="button"
          onClick={() => onFilterDropdownOpenChange(!filterDropdownOpen)}
          aria-expanded={filterDropdownOpen}
          aria-haspopup="listbox"
          className={cn(
            "flex h-12 w-full items-center justify-between gap-3 rounded-xl border px-4 font-brand text-[10px] tracking-[0.14em] transition",
            filterDropdownOpen
              ? "border-gold/50 bg-gold/10 text-gold shadow-[inset_0_1px_0_rgba(197,165,90,0.12)]"
              : "border-gold/18 text-foreground/80 hover:border-gold/35 hover:text-gold",
          )}
        >
          <span className="min-w-0 truncate text-left">
            <span className="block text-[9px] tracking-[0.18em] text-gold/60">FILTER BY ALBUM</span>
            <span className="mt-0.5 block truncate text-gold">
              {filterSummaryLabel}
              <span className="ml-1.5 font-body text-[11px] font-normal text-foreground/45">
                · {filterCount} {filterMedioLabel}
              </span>
            </span>
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-gold/80 transition-transform",
              filterDropdownOpen && "rotate-180",
            )}
            strokeWidth={1.75}
          />
        </button>
        {filterDropdownOpen ? (
          <div
            role="listbox"
            className="absolute right-0 top-full z-40 mt-2 w-full min-w-[16rem] overflow-hidden rounded-xl border border-gold/25 bg-[#0a0c10] py-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.65)] ring-1 ring-gold/10"
          >
            <button
              type="button"
              role="option"
              aria-selected={listCategoryFilter === null}
              onClick={() => {
                onListCategoryFilterChange(null);
                onFilterDropdownOpenChange(false);
              }}
              className={cn(
                "flex w-full items-center justify-between gap-2 px-4 py-3 text-left font-brand text-[10px] tracking-[0.12em] transition",
                listCategoryFilter === null
                  ? "bg-gold/12 text-gold"
                  : "text-foreground/75 hover:bg-gold/8 hover:text-gold",
              )}
            >
              <span>All categories</span>
              <span className="shamell-glass-surface rounded-full border border-gold/20 px-2 py-0.5 font-body text-[10px] text-foreground/55">
                {totalForFilterAll}
              </span>
            </button>
            <div className="mx-3 border-t border-gold/12" />
            {sortedActiveCategories.map((c) => {
              const n = countByCategory[c.id] ?? 0;
              const selected = listCategoryFilter === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onListCategoryFilterChange(c.id);
                    onFilterDropdownOpenChange(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left transition",
                    selected
                      ? "bg-gold/12 text-gold"
                      : "text-foreground/75 hover:bg-gold/8 hover:text-gold",
                  )}
                >
                  <span className="min-w-0 truncate font-brand text-[10px] tracking-[0.12em]">
                    {c.name}
                  </span>
                  <span className="shamell-glass-surface shrink-0 rounded-full border border-gold/18 px-2 py-0.5 font-body text-[10px] text-foreground/50">
                    {n}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
