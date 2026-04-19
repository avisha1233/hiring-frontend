export function SettingsCard({ title, subtitle, children, className = "" }) {
  return (
    <section
      className={`rounded-2xl border border-(--dash-border) bg-(--dash-surface) p-6 shadow-(--dash-shadow) ${className}`}
    >
      <h2 className="m-0 text-3xl font-semibold text-(--dash-text)">{title}</h2>
      <p className="m-0 mt-1 text-sm text-(--dash-muted)">{subtitle}</p>
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}
