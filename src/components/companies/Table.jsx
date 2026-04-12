import { TableRow } from "@/components/companies/TableRow";

const HEADERS = ["Company", "Location", "Size", "Status", "Created", ""];

export function Table({ companies, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-surface)] shadow-[var(--dash-shadow)]">
      <table className="min-w-[880px] w-full border-collapse">
        <thead>
          <tr className="border-b border-[var(--dash-border)] bg-[var(--dash-bg)]">
            {HEADERS.map((header) => (
              <th
                key={header || "actions"}
                className="px-4 py-4 text-left text-lg font-medium text-[var(--dash-muted)]"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {companies.map((company) => (
            <TableRow
              key={company.id}
              company={company}
              onEdit={() => onEdit(company)}
              onDelete={() => onDelete(company)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
