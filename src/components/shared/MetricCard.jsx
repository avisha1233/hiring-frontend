export default function MetricCard({ title, value, icon: Icon, trend, color = 'orange' }) {
  const bgColor = color === 'orange' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600';

  return (
    <div className="rounded-xl border border-orange-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`mt-1 text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}% vs last month
            </p>
          )}
        </div>
        {Icon && <div className={`rounded-lg p-3 ${bgColor}`}>
          <Icon size={24} />
        </div>}
      </div>
    </div>
  );
}
