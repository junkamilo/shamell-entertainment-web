import { SearchInput } from "@/components/admin/inputs";
type Props = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sectionFilter: "ALL" | "GENERAL" | "UPCOMING_EVENTS";
  onSectionFilterChange: (value: "ALL" | "GENERAL" | "UPCOMING_EVENTS") => void;
  hideSectionFilter?: boolean;
  upcomingOnly?: boolean;
};

export default function EventsSearchBar({
  searchQuery,
  onSearchChange,
  sectionFilter,
  onSectionFilterChange,
  hideSectionFilter = false,
  upcomingOnly = false,
}: Props) {
  return (
    <div
      className={
        hideSectionFilter ? "mb-6" : "mb-6 grid gap-3 md:grid-cols-[2fr_1fr]"
      }
    >
      <SearchInput
        value={searchQuery}
        onChange={onSearchChange}
        placeholder={upcomingOnly ? "Search upcoming events..." : "Search events..."}
        className="shamell-glass-surface mx-0 min-h-12 max-w-none w-full rounded-xl"
      />
      {hideSectionFilter ? null : (
        <select
          value={sectionFilter}
          onChange={(event) =>
            onSectionFilterChange(
              event.target.value as "ALL" | "GENERAL" | "UPCOMING_EVENTS",
            )
          }
          className="shamell-glass-surface min-h-12 w-full rounded-xl border border-gold/30 px-4 text-sm text-foreground outline-none focus:border-gold"
        >
          <option value="ALL">All sections</option>
          <option value="UPCOMING_EVENTS">Upcoming Events</option>
          <option value="GENERAL">General (Types of Events)</option>
        </select>
      )}
    </div>
  );
}
