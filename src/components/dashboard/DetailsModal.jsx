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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-(--dash-overlay) p-4">
      <section
        className={`w-full ${sizeClassName} rounded-2xl border border-(--dash-border) bg-(--dash-surface) p-6 shadow-(--dash-shadow)`}
      >
        <header className="flex items-start justify-between gap-3">
          <div>
            <h2 className="m-0 text-xl font-semibold text-(--dash-text)">
              {title}
            </h2>
            {subtitle ? (
              <p className="m-0 mt-1 text-sm text-(--dash-muted)">
                {subtitle}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-(--dash-border) px-2 py-1 text-sm text-(--dash-muted) transition hover:bg-(--dash-accent-soft) hover:text-(--dash-accent)"
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

