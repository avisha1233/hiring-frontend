export function SettingsToggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-(--dash-border) pb-4 last:border-b-0 last:pb-0">
      <div>
        <p className="m-0 text-lg font-semibold text-(--dash-text)">{label}</p>
        <p className="m-0 mt-1 text-sm text-(--dash-muted)">{description}</p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition ${
          checked
            ? "border-(--dash-accent) bg-(--dash-accent)"
            : "border-(--dash-border) bg-[#e5e7eb]"
        }`}
      >
        <span
          className={`inline-block h-6 w-6 rounded-full bg-white shadow transition ${
            checked ? "translate-x-7" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
