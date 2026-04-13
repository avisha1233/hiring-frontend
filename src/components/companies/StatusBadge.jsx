export function StatusBadge({ status }) {
  const normalized = String(status || "active").toLowerCase();

  const styles = {
    active: "border-[#86efac] bg-[#f0fdf4] text-(--dash-success)",
    pending:
      "border-[#fdba74] bg-(--dash-accent-soft) text-(--dash-warning)",
    inactive: "border-[#fecaca] bg-[#fef2f2] text-(--dash-danger)",
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

