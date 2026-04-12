export function StatusBadge({ status }) {
  const normalized = String(status || "active").toLowerCase();

  const styles = {
    active: "border-[#86efac] bg-[#f0fdf4] text-[var(--dash-success)]",
    pending:
      "border-[#fdba74] bg-[var(--dash-accent-soft)] text-[var(--dash-warning)]",
    inactive: "border-[#fecaca] bg-[#fef2f2] text-[var(--dash-danger)]",
  };

  const label =
    normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();

  return (
    <span
      className={`inline-flex rounded-xl border px-3 py-1 text-sm font-semibold ${styles[normalized] || styles.active}`}
    >
      {label}
    </span>
  );
}
