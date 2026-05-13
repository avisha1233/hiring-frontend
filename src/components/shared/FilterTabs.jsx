export default function FilterTabs({ tabs, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            active === tab.value
              ? 'bg-orange-500 text-white'
              : 'border border-orange-200 bg-white text-gray-700 hover:border-orange-300'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
