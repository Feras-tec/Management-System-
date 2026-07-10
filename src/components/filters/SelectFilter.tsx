interface SelectFilterProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  label?: string;
}

export default function SelectFilter({
  value,
  options,
  onChange,
  label = "Filter",
}: SelectFilterProps) {
  return (
    <select
      className="select select-bordered w-full"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="all">{label}</option>

      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
