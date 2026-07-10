interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
}: SearchInputProps) {
  return (
    <input
      className="input input-bordered w-full"
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
