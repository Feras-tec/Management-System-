interface SortSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <select
      className="select select-bordered w-full"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="none">Sort By</option>

      <option value="asc">Name A-Z</option>

      <option value="desc">Name Z-A</option>
    </select>
  );
}
