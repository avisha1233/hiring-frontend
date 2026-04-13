import { MoreHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

function getInitials(name) {
  return (
    name
      ?.split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "NA"
  );
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
}

function RoleBadge({ role }) {
  const normalized = String(role || "candidate").toLowerCase();

  const classes = {
    admin: "border-orange-200 bg-orange-50 text-orange-700",
    hr: "border-sky-200 bg-sky-50 text-sky-700",
    company: "border-amber-200 bg-amber-50 text-amber-700",
    candidate: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${classes[normalized] || classes.candidate}`}
    >
      {normalized.charAt(0).toUpperCase() + normalized.slice(1)}
    </span>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || "active").toLowerCase();

  const classes = {
    active: "border-emerald-200 bg-emerald-50 text-emerald-700",
    pending: "border-orange-200 bg-orange-50 text-orange-700",
    inactive: "border-red-200 bg-red-50 text-red-700",
    disabled: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${classes[normalized] || classes.pending}`}
    >
      {normalized.charAt(0).toUpperCase() + normalized.slice(1)}
    </span>
  );
}

function RowActions({ onSelect }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-(--dash-muted) transition hover:bg-(--dash-accent-soft) hover:text-(--dash-accent)"
        aria-label="Open actions"
      >
        <MoreHorizontal size={16} />
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
            aria-label="Close actions"
          />
          <div className="absolute right-0 top-9 z-20 min-w-36 rounded-xl border border-(--dash-border) bg-white py-1 shadow-(--dash-shadow)">
            <button
              type="button"
              onClick={() => {
                onSelect("view");
                setOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm text-(--dash-text) transition hover:bg-(--dash-accent-soft)"
            >
              View profile
            </button>
            <button
              type="button"
              onClick={() => {
                onSelect("disable");
                setOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm text-(--dash-danger) transition hover:bg-red-50"
            >
              Disable user
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function UsersTable({ users, isLoading, error, errorMessage, onRetry }) {
  const empty = useMemo(
    () => !isLoading && !error && users.length === 0,
    [error, isLoading, users.length],
  );

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-(--dash-border) bg-white p-10 text-center text-(--dash-muted) shadow-(--dash-shadow)">
        Loading users...
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-(--dash-shadow)">
        <p className="m-0 text-sm text-(--dash-danger)">
          {errorMessage || "Failed to load users."}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg bg-white px-3 py-2 text-sm text-(--dash-text)"
        >
          Retry
        </button>
      </section>
    );
  }

  if (empty) {
    return (
      <section className="rounded-2xl border border-(--dash-border) bg-white p-10 text-center text-(--dash-muted) shadow-(--dash-shadow)">
        No users found for the current search and filters.
      </section>
    );
  }

  return (
    <section className="overflow-x-auto rounded-2xl border border-(--dash-border) bg-white shadow-(--dash-shadow)">
      <table className="w-full min-w-[760px]">
        <thead>
          <tr className="border-b border-(--dash-border) bg-[#f9fafb]">
            <th className="px-4 py-3 text-left text-sm font-semibold text-(--dash-muted)">
              User
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-(--dash-muted)">
              Role
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-(--dash-muted)">
              Status
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-(--dash-muted)">
              Created
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-(--dash-muted)">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className="border-b border-(--dash-border) last:border-b-0"
            >
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-700">
                    {getInitials(user.full_name)}
                  </div>
                  <div>
                    <p className="m-0 font-semibold text-(--dash-text)">
                      {user.full_name || "Unknown User"}
                    </p>
                    <p className="m-0 text-sm text-(--dash-muted)">
                      {user.email || "No email"}
                    </p>
                  </div>
                </div>
              </td>

              <td className="px-4 py-4">
                <RoleBadge role={user.role} />
              </td>

              <td className="px-4 py-4">
                <StatusBadge status={user.status} />
              </td>

              <td className="px-4 py-4 text-sm text-(--dash-muted)">
                {formatDate(user.created_at)}
              </td>

              <td className="px-4 py-4 text-right">
                <div className="inline-block">
                  <RowActions onSelect={() => {}} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
