import { ShieldX, Trash2, X } from "lucide-react";

export default function BulkActionBar({
  selectedCount,
  onBlock,
  onDelete,
  onClear,
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 flex items-center gap-4">
      <span className="text-sm font-medium text-orange-700">
        {selectedCount} selected
      </span>

      <div className="flex-1" />

      <button
        onClick={onBlock}
        className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
      >
        <ShieldX size={16} />
        Block Selected
      </button>

      <button
        onClick={onDelete}
        className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
      >
        <Trash2 size={16} />
        Delete Selected
      </button>

      <button onClick={onClear} className="text-gray-400 hover:text-gray-600">
        <X size={18} />
      </button>
    </div>
  );
}
