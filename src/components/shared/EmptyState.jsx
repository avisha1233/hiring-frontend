import { Package } from 'lucide-react';

export default function EmptyState({ title = 'No data', message = 'Nothing to display', icon: Icon = Package }) {
  return (
    <div className="rounded-xl border border-dashed border-orange-200 bg-orange-50 p-12 text-center">
      <Icon className="mx-auto mb-4 text-orange-300" size={48} />
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{message}</p>
    </div>
  );
}
