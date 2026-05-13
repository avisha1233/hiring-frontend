import { getStatusColor } from '../../utils/formatters';

export default function StatusBadge({ status, children }) {
  const colorClass = getStatusColor(status);
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${colorClass}`}>
      {children || status}
    </span>
  );
}
