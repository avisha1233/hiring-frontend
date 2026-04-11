export function StatCard({ icon: Icon, title, value, change, subtitle }) {
  const changeColor = change >= 0 ? "text-[#00d09c]" : "text-[#f87171]";
  const badgeBg = change >= 0 ? "bg-[#0f2b22]" : "bg-[#36171a]";
  const badgeText = `${change >= 0 ? "+" : ""}${change}%`;

  return (
    <article className="group rounded-2xl border border-[#162338] bg-[#050b16] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#28415f]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0d2f26] text-[#00d09c]">
          <Icon size={24} />
        </div>

        <div className="text-right">
          <p className="m-0 text-sm text-[#90a5c1]">{title}</p>
          <p className="m-0 mt-1 text-2xl font-semibold leading-none text-white">
            {value}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${badgeBg} ${changeColor}`}
        >
          {badgeText}
        </span>
      </div>

      <p className="m-0 mt-4 text-sm text-[#7f94b1]">{subtitle}</p>
    </article>
  );
}
