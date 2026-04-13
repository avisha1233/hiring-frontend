import { Search } from "lucide-react";

export function SearchBar({
  value,
  onChange,
  placeholder,
  className = "",
  inputClassName = "",
}) {
  return (
    <div
      className={`flex h-11 items-center gap-2 rounded-xl border border-(--dash-border) bg-(--dash-surface) px-3 text-(--dash-muted) ${className}`}
    >
      <Search size={16} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`w-full bg-transparent text-sm text-(--dash-text) outline-none placeholder:text-(--dash-muted) ${inputClassName}`}
      />
    </div>
  );
}

