import { Funnel, Plus, Search } from "lucide-react";

export function UsersToolbar({
  toolbarSearch,
  onToolbarSearch,
  roleFilter,
  onRoleFilter,
  statusFilter,
  onStatusFilter,
  onAddUser,
}) {
  return (
    <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-(--dash-border) bg-(--dash-surface) p-3 shadow-(--dash-shadow)">
      <div className="flex min-w-65 flex-1 items-center gap-2 rounded-xl border border-(--dash-border) bg-white px-3">
        <Search size={16} className="text-(--dash-muted)" />
        <input
          value={toolbarSearch}
          onChange={(event) => onToolbarSearch(event.target.value)}
          placeholder="Search users..."
          className="h-11 w-full bg-transparent text-sm text-(--dash-text) outline-none placeholder:text-(--dash-muted)"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-(--dash-border) bg-white text-(--dash-muted) transition hover:bg-(--dash-accent-soft) hover:text-(--dash-accent)"
          aria-label="Filter users"
        >
          <Funnel size={18} />
        </button>

        <select
          value={roleFilter}
          onChange={(event) => onRoleFilter(event.target.value)}
          className="h-11 rounded-xl border border-(--dash-border) bg-white px-3 text-sm text-(--dash-text) outline-none"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="hr">HR</option>
          <option value="company">Company</option>
          <option value="candidate">Candidate</option>
        </select>

        <select
          value={statusFilter}
          onChange={(event) => onStatusFilter(event.target.value)}
          className="h-11 rounded-xl border border-(--dash-border) bg-white px-3 text-sm text-(--dash-text) outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="disabled">Disabled</option>
          <option value="inactive">Inactive</option>
        </select>

        <button
          type="button"
          onClick={onAddUser}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-(--dash-accent) px-4 text-sm font-semibold text-white transition hover:bg-(--dash-accent-strong)"
        >
          <Plus size={16} />
          Add User
        </button>
      </div>
    </section>
  );
}
