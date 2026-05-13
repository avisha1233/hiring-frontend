import { Search } from 'lucide-react';

export default function SearchInput({ value, onChange, placeholder = 'Search...', disabled = false }) {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-lg border border-orange-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:bg-gray-50"
      />
    </div>
  );
}
