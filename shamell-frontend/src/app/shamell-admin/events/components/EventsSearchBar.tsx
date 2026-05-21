import AdminSearchInput from "@/components/admin/AdminSearchInput";

type Props = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
};

export default function EventsSearchBar({ searchQuery, onSearchChange }: Props) {
  return (
    <div className="mb-6">
      <AdminSearchInput
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Search events..."
        className="shamell-glass-surface mx-0 min-h-12 max-w-none w-full rounded-xl"
      />
    </div>
  );
}
