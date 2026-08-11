interface SortOption {
  label: string;
  value: string;
}

interface SortSelectProps {
  value: string;
  options: SortOption[];
  onChange: (value: string) => void;
}

export default function SortSelect({
  value,
  options,
  onChange,
}: SortSelectProps) {
  return (
    <select
      className="select select-bordered w-full"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >

      <option value="">
        Sort By
      </option>

      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
        >
          {option.label}
        </option>
      ))}

    </select>
  );
}