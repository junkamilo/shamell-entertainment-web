import { SearchInput } from "@/components/admin/inputs";
import { cn } from "@/lib/utils";
import type { FilterTab } from "../types/serviceTypes.types";

type Props = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterTab: FilterTab;
  onFilterTabChange: (tab: FilterTab) => void;
};

export default function ServiceTypesToolbar({
  searchQuery,
  onSearchChange,
  filterTab,
  onFilterTabChange,
}: Props) {
  const filterPill = (id: FilterTab, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => onFilterTabChange(id)}
      className={cn(
        "rounded-full border px-4 py-2 font-brand text-[10px] tracking-[0.14em] transition-colors",
        filterTab === id
          ? "border-gold/55 bg-gold/10 text-gold"
          : "border-gold/15 text-foreground/50 hover:border-gold/35 hover:text-foreground/75",
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
      <SearchInput
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Search service type..."
        className="mx-0 min-h-[3rem] max-w-none flex-1"
      />
      <div className="flex flex-wrap gap-2 lg:shrink-0">
        {filterPill("all", "All")}
        {filterPill("active", "Active")}
        {filterPill("inactive", "Inactive")}
      </div>
    </div>
  );
}
