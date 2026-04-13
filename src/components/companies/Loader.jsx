export function Loader({ label = "Loading..." }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-sm text-(--dash-muted)">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#fed7aa] border-t-(--dash-accent)" />
      <span>{label}</span>
    </div>
  );
}

