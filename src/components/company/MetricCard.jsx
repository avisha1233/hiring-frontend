export function MetricCard({ label, value, delta, icon }) {
  return (
    <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm shadow-orange-100/50">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-orange-600">
            {label}
          </p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">{value}</p>
        </div>
        {icon ? <div className="text-3xl">{icon}</div> : null}
      </div>
      {delta ? <p className="mt-4 text-sm text-slate-500">{delta}</p> : null}
    </div>
  );
}
