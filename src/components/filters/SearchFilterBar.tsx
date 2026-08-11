import SearchInput from "./SearchInput";
import SelectFilter from "./SelectFilter";
import SortSelect from "./SortSelect";

interface SortOption {
  label: string;
  value: string;
}

interface SearchFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;

  filter: string;
  onFilterChange: (value: string) => void;

  filterOptions: string[];

  sort: string;
  onSortChange: (value: string) => void;

  sortOptions: SortOption[];
}

export default function SearchFilterBar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  filterOptions,
  sort,
  onSortChange,
  sortOptions,
}: SearchFilterBarProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <SearchInput value={search} onChange={onSearchChange} />

      <SelectFilter
        value={filter}
        options={filterOptions}
        onChange={onFilterChange}
      />

      <SortSelect value={sort} options={sortOptions} onChange={onSortChange} />
    </div>
  );
}
