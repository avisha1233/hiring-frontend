export function SettingsInput({
  label,
  value,
  onChange,
  placeholder,
  helperText,
  error,
  type = "text",
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-lg font-semibold text-(--dash-text)">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`h-12 rounded-xl border bg-(--dash-surface) px-4 text-lg text-(--dash-text) outline-none transition placeholder:text-(--dash-muted) ${
          error ? "border-[#fca5a5]" : "border-(--dash-border)"
        }`}
      />
      {helperText ? (
        <span className="text-sm text-(--dash-muted)">{helperText}</span>
      ) : null}
      {error ? (
        <span className="text-sm text-(--dash-danger)">{error}</span>
      ) : null}
    </label>
  );
}
