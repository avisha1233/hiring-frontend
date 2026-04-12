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
      className={`flex h-11 items-center gap-2 rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] px-3 text-[var(--dash-muted)] ${className}`}
    >
      <Search size={16} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`w-full bg-transparent text-sm text-[var(--dash-text)] outline-none placeholder:text-[var(--dash-muted)] ${inputClassName}`}
      />
    </div>
  );
}
