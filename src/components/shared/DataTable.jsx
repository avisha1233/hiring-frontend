export default function DataTable({
  columns,
  data,
  loading,
  error,
  empty,
  onRowClick,
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-orange-200 bg-orange-50 p-8 text-center">
        <p className="text-sm text-gray-600">{empty || "No data found"}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-orange-100 bg-white">
      <table className="w-full">
        <thead className="border-b border-orange-100 bg-orange-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-600"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              onClick={() => onRowClick?.(row)}
              className="border-b border-orange-100 hover:bg-orange-50 cursor-pointer transition"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm text-gray-700">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
