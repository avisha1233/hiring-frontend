import { MapPin, UsersRound } from "lucide-react";
import { StatusBadge } from "@/components/companies/StatusBadge";
import { DropdownMenu } from "@/components/companies/DropdownMenu";

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-US");
}

function getInitials(name) {
  if (!name) return "NA";
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || "")
    .join("");
}

export function TableRow({ company, onEdit, onDelete }) {
  const name = company.name || "Unnamed Company";
  const industry = company.industry || "Technology";
  const location = company.location || "Unknown";
  const size = company.size || company.employee_range || "100-500 employees";
  const status = company.status || "active";

  return (
    <tr className="border-b border-(--dash-border) transition hover:bg-(--dash-accent-soft)">
      <td className="px-4 py-4 text-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-(--dash-accent-soft) text-sm font-semibold text-(--dash-accent)">
            {getInitials(name)}
          </div>
          <div>
            <p className="m-0 text-base font-medium text-(--dash-text)">
              {name}
            </p>
            <p className="m-0 text-sm text-(--dash-muted)">{industry}</p>
          </div>
        </div>
      </td>

      <td className="px-4 py-4 text-sm text-(--dash-muted)">
        <span className="inline-flex items-center gap-2">
          <MapPin size={16} className="text-(--dash-warning)" />
          {location}
        </span>
      </td>

      <td className="px-4 py-4 text-sm text-(--dash-muted)">
        <span className="inline-flex items-center gap-2">
          <UsersRound size={16} className="text-(--dash-warning)" />
          {size}
        </span>
      </td>

      <td className="px-4 py-4 text-sm">
        <StatusBadge status={status} />
      </td>

      <td className="px-4 py-4 text-sm text-(--dash-muted)">
        {formatDate(company.created_at)}
      </td>

      <td className="px-4 py-4 text-right text-sm">
        <DropdownMenu onEdit={onEdit} onDelete={onDelete} />
      </td>
    </tr>
  );
}

