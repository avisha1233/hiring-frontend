import { MoreVertical, Trash2, Edit2 } from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "./StatusBadge";
import { RoleBadge } from "./RoleBadge";

function initials(name) {
  return (
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}

function formatDate(dateString) {
  if (!dateString) return "â€”";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "â€”";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function UserRow({ user, onEdit, onDelete, isDeleting = false }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <tr className="border-b border-[#162338] hover:bg-[#0a131f] transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a3a4a] text-sm font-semibold text-[#00d09c]">
            {initials(user.full_name)}
          </div>
          <div>
            <p className="m-0 font-medium text-white">
              {user.full_name || "â€”"}
            </p>
            <p className="m-0 text-sm text-[#8ca1bd]">{user.email || "â€”"}</p>
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        <RoleBadge role={user.role} />
      </td>

      <td className="px-6 py-4">
        <StatusBadge status={user.status} />
      </td>

      <td className="px-6 py-4 text-sm text-[#8ca1bd]">
        {formatDate(user.created_at)}
      </td>

      <td className="px-6 py-4">
        <div className="relative inline-block">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#8ca1bd] hover:bg-[#1a2e42] hover:text-white transition"
            aria-label="Actions"
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-10 z-30 w-40 rounded-lg border border-[#1f3048] bg-[#0d162a] shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    onEdit(user);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#8ca1bd] hover:bg-[#1a2e42] hover:text-white transition"
                >
                  <Edit2 size={14} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(user.id);
                    setMenuOpen(false);
                  }}
                  disabled={isDeleting}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#f87171] hover:bg-[#2a1515] transition disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

