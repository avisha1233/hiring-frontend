export function Modal({
  open,
  title,
  children,
  onClose,
  actions,
  widthClassName = "max-w-xl",
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--dash-overlay)] p-4">
      <div
        className={`w-full ${widthClassName} rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-6 shadow-[var(--dash-shadow)]`}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="m-0 text-lg font-semibold text-[var(--dash-text)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--dash-border)] px-2 py-1 text-sm text-[var(--dash-muted)] transition hover:bg-[var(--dash-accent-soft)] hover:text-[var(--dash-accent)]"
            aria-label="Close modal"
          >
            X
          </button>
        </div>

        <div className="mt-4">{children}</div>

        {actions ? (
          <div className="mt-5 flex justify-end gap-2">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
