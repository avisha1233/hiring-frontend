export function SettingsButton({ children, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-12 items-center justify-center rounded-xl bg-(--dash-accent) px-6 text-xl font-semibold text-white transition hover:bg-(--dash-accent-strong) disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}
