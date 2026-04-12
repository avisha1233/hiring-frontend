import { createElement } from "react";

export function StatCard({
  icon: Icon,
  title,
  value,
  change,
  subtitle,
  onClick,
}) {
  const changeColor =
    change >= 0 ? "text-[var(--dash-success)]" : "text-[var(--dash-danger)]";
  const badgeBg = change >= 0 ? "bg-[#ecfdf3]" : "bg-[#fef2f2]";
  const badgeText = `${change >= 0 ? "+" : ""}${change}%`;
  const clickable = typeof onClick === "function";

  return (
    <article
      className={`group rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-6 shadow-[var(--dash-shadow)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--dash-accent)] hover:bg-[#fff7ed] ${clickable ? "cursor-pointer" : ""}`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!clickable) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? `View ${title} details` : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--dash-accent-soft)] text-[var(--dash-accent)]">
          {createElement(Icon, { size: 24 })}
        </div>

        <div className="text-right">
          <p className="m-0 text-sm text-[var(--dash-muted)]">{title}</p>
          <p className="m-0 mt-1 text-2xl font-semibold leading-none text-[var(--dash-text)]">
            {value}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${badgeBg} ${changeColor}`}
        >
          {badgeText}
        </span>
      </div>

      <p className="m-0 mt-4 text-sm text-[var(--dash-muted)]">{subtitle}</p>
    </article>
  );
}
