export default function Pagination({ page, pageSize, total, onPageChange, loading = false }) {
  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="flex items-center justify-between rounded-lg border border-orange-100 bg-white px-4 py-3">
      <p className="text-sm text-gray-600">
        Page <span className="font-semibold">{page}</span> of{' '}
        <span className="font-semibold">{totalPages}</span> ({total} total)
      </p>

      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || loading}
          className="rounded-lg border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || loading}
          className="rounded-lg border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
