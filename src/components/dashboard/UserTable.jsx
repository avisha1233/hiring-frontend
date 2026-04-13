import { Loader2 } from "lucide-react";
import { UserRow } from "./UserRow";

export function UserTable({ users, onEdit, onDelete, isLoading, deletingIds }) {
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={32} className="animate-spin text-[#00d09c]" />
          <p className="text-[#8ca1bd]">Loading users...</p>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-[#8ca1bd]">
          No users found. Try adjusting your search.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-[#1f3048] bg-[#0a121f]">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-semibold text-[#8ca1bd]">
              User
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-[#8ca1bd]">
              Role
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-[#8ca1bd]">
              Status
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-[#8ca1bd]">
              Created
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-[#8ca1bd]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              onEdit={onEdit}
              onDelete={onDelete}
              isDeleting={deletingIds.has(user.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

