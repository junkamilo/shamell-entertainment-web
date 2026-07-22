import { SearchInput } from "@/components/admin/inputs";
type Props = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
};

export default function GalleryToolbar({ searchQuery, onSearchChange }: Props) {
  return (
    <div className="mb-6">
      <SearchInput
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Search by category name..."
        className="shamell-glass-surface mx-0 min-h-12 max-w-none w-full rounded-xl"
      />
    </div>
  );
}
