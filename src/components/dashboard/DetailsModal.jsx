export function DetailsModal({
  open,
  title,
  subtitle,
  onClose,
  children,
  sizeClassName = "max-w-2xl",
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--dash-overlay)] p-4">
      <section
        className={`w-full ${sizeClassName} rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-6 shadow-[var(--dash-shadow)]`}
      >
        <header className="flex items-start justify-between gap-3">
          <div>
            <h2 className="m-0 text-xl font-semibold text-[var(--dash-text)]">
              {title}
            </h2>
            {subtitle ? (
              <p className="m-0 mt-1 text-sm text-[var(--dash-muted)]">
                {subtitle}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--dash-border)] px-2 py-1 text-sm text-[var(--dash-muted)] transition hover:bg-[var(--dash-accent-soft)] hover:text-[var(--dash-accent)]"
            aria-label="Close details"
          >
            X
          </button>
        </header>

        <div className="mt-4 max-h-[65vh] overflow-y-auto pr-1">{children}</div>
      </section>
    </div>
  );
}
