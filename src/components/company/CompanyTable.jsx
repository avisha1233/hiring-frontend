export function CompanyTable({ columns, rows }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm shadow-orange-100/40">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-orange-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-4 font-medium text-slate-700"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {rows.map((row, index) => (
            <tr key={index} className="hover:bg-orange-50">
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-4 text-slate-700">
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
