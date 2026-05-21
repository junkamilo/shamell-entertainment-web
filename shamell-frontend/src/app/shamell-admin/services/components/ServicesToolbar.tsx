import { ChevronDown, SlidersHorizontal } from "lucide-react";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import type { ServiceTypeItem } from "@/app/shamell-admin/service-types/types/serviceTypes.types";
import { cn } from "@/lib/utils";
import type { FilterTab } from "../types/services.types";

type Props = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterTab: FilterTab;
  onFilterTabChange: (tab: FilterTab) => void;
  tabCounts: { all: number; active: number; inactive: number };
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  typeFilterId: string | null;
  onTypeFilterChange: (id: string | null) => void;
  serviceTypes: ServiceTypeItem[];
};

export default function ServicesToolbar({
  searchQuery,
  onSearchChange,
  filterTab,
  onFilterTabChange,
  tabCounts,
  filtersOpen,
  onFiltersOpenChange,
  typeFilterId,
  onTypeFilterChange,
  serviceTypes,
}: Props) {
  return (
    <div className="mb-6 min-w-0 shamell-glass-surface overflow-hidden rounded-xl">
      <div className="flex min-w-0 flex-col gap-4 p-4 md:p-5 lg:flex-row lg:items-stretch lg:gap-4">
        <AdminSearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search services..."
          className="mx-0 min-h-12 w-full min-w-0 max-w-none flex-1 rounded-xl border border-gold/22 bg-black/20"
        />
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center lg:shrink-0">
          <div className="min-w-0 overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max rounded-xl border border-gold/18 bg-black/20 p-1 sm:min-w-0 sm:w-full">
            {(
              [
                ["all", "All", tabCounts.all],
                ["active", "Active", tabCounts.active],
                ["inactive", "Inactive", tabCounts.inactive],
              ] as const
            ).map(([id, label, count]) => (
              <button
                key={id}
                type="button"
                onClick={() => onFilterTabChange(id)}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-lg px-3 py-2.5 font-brand text-[10px] tracking-[0.12em] transition sm:flex-1 sm:px-4",
                  filterTab === id
                    ? "bg-gold/12 text-gold shadow-inner"
                    : "text-foreground/50 hover:text-foreground/80",
                )}
              >
                {label} <span className="text-gold/50">•</span> {count}
              </button>
            ))}
            </div>
          </div>
          <button
            type="button"
            aria-expanded={filtersOpen}
            aria-controls="services-type-filters"
            id="services-filters-toggle"
            onClick={() => onFiltersOpenChange(!filtersOpen)}
            className={cn(
              "inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl border px-4 font-brand text-[10px] tracking-[0.14em] transition sm:w-auto",
              filtersOpen
                ? "border-gold/50 bg-gold/10 text-gold"
                : "border-gold/18 text-foreground/60 hover:border-gold/35 hover:text-gold",
            )}
          >
            <SlidersHorizontal className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            Filters
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-gold/80 transition-transform duration-200",
                filtersOpen && "rotate-180",
              )}
              aria-hidden
            />
          </button>
        </div>
      </div>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
          filtersOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            id="services-type-filters"
            role="region"
            aria-labelledby="services-filters-toggle"
            className="border-t border-gold/12 px-4 pb-4 md:px-5 md:pb-5"
          >
            <div className="pt-4">
              <p className="font-brand text-[10px] tracking-[0.2em] text-gold/80">SERVICE TYPE</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onTypeFilterChange(null)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 font-body text-xs transition",
                    typeFilterId === null
                      ? "border-gold/50 bg-gold/10 text-gold"
                      : "border-gold/15 text-foreground/55 hover:border-gold/30",
                  )}
                >
                  All types
                </button>
                {serviceTypes.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onTypeFilterChange(typeFilterId === t.id ? null : t.id)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 font-body text-xs transition",
                      typeFilterId === t.id
                        ? "border-gold/50 bg-gold/10 text-gold"
                        : "border-gold/15 text-foreground/55 hover:border-gold/30",
                    )}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
