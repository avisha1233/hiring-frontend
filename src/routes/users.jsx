/* eslint-disable react-refresh/only-export-components */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { createUser, getUsers } from "@/apis/users";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { AddUserModal } from "@/components/users/AddUserModal";
import { UsersHeader } from "@/components/users/UsersHeader";
import { UsersTable } from "@/components/users/UsersTable";
import { UsersToolbar } from "@/components/users/UsersToolbar";
import { clearAuthSession, getAuthUser } from "@/lib/auth";

const PAGE_SIZE = 10;

export const Route = createFileRoute("/users")({
  component: UsersPage,
});

const getCreateUserErrorMessage = (error) => {
  if (!error) {
    return "";
  }

  const firstValidationError = error.payload?.errors?.[0]?.msg;
  if (firstValidationError) {
    return firstValidationError;
  }

  return error.message || "Failed to create user.";
};

function UsersPage() {
  const queryClient = useQueryClient();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [headerSearch, setHeaderSearch] = useState("");
  const [toolbarSearch, setToolbarSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [addUserOpen, setAddUserOpen] = useState(false);

  const usersQuery = useQuery({
    queryKey: ["users", page, toolbarSearch, roleFilter, statusFilter],
    queryFn: () =>
      getUsers({
        page,
        limit: PAGE_SIZE,
        search: toolbarSearch,
        role: roleFilter,
        status: statusFilter,
      }),
    staleTime: 20_000,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setAddUserOpen(false);
    },
  });

  const createUserError = createMutation.isError
    ? getCreateUserErrorMessage(createMutation.error)
    : "";

  const baseUsers = useMemo(() => {
    if (Array.isArray(usersQuery.data?.data)) return usersQuery.data.data;
    if (Array.isArray(usersQuery.data?.users)) return usersQuery.data.users;
    return [];
  }, [usersQuery.data]);

  const users = useMemo(() => {
    const searchTerm = headerSearch.trim().toLowerCase();
    if (!searchTerm) return baseUsers;

    return baseUsers.filter((user) => {
      const name = String(user.full_name || "").toLowerCase();
      const email = String(user.email || "").toLowerCase();
      return name.includes(searchTerm) || email.includes(searchTerm);
    });
  }, [baseUsers, headerSearch]);

  const pagination = {
    current:
      usersQuery.data?.currentPage || usersQuery.data?.pagination?.page || page,
    total:
      usersQuery.data?.totalPage ||
      usersQuery.data?.pagination?.totalPages ||
      1,
  };

  const authUser = getAuthUser();

  return (
    <div className="min-h-screen bg-(--dash-bg) text-(--dash-text)">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        user={authUser}
        onLogout={() => {
          clearAuthSession();
          window.location.assign("/login");
        }}
      />

      <div
        className={`transition-all duration-300 ${
          collapsed ? "lg:ml-23" : "lg:ml-80"
        }`}
      >
        <UsersHeader
          title="User Management"
          subtitle="Manage platform users and their permissions"
          headerSearch={headerSearch}
          onHeaderSearch={setHeaderSearch}
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="space-y-5 p-4 sm:p-8">
          <UsersToolbar
            toolbarSearch={toolbarSearch}
            onToolbarSearch={(value) => {
              setPage(1);
              setToolbarSearch(value);
            }}
            roleFilter={roleFilter}
            onRoleFilter={(value) => {
              setPage(1);
              setRoleFilter(value);
            }}
            statusFilter={statusFilter}
            onStatusFilter={(value) => {
              setPage(1);
              setStatusFilter(value);
            }}
            onAddUser={() => setAddUserOpen(true)}
          />

          <UsersTable
            users={users}
            isLoading={usersQuery.isPending}
            error={usersQuery.isError}
            errorMessage={usersQuery.error?.message}
            onRetry={() => usersQuery.refetch()}
          />

          <section className="flex items-center justify-between rounded-2xl border border-(--dash-border) bg-(--dash-surface) px-4 py-3 shadow-(--dash-shadow)">
            <p className="m-0 text-sm text-(--dash-muted)">
              Page {pagination.current} of {pagination.total}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.current <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="rounded-lg border border-(--dash-border) bg-white px-3 py-2 text-sm text-(--dash-text) transition hover:bg-(--dash-accent-soft) disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={pagination.current >= pagination.total}
                onClick={() =>
                  setPage((prev) => Math.min(pagination.total, prev + 1))
                }
                className="rounded-lg border border-(--dash-border) bg-white px-3 py-2 text-sm text-(--dash-text) transition hover:bg-(--dash-accent-soft) disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </section>
        </main>
      </div>

      <AddUserModal
        open={addUserOpen}
        isSaving={createMutation.isPending}
        errorMessage={createUserError}
        onClearError={() => createMutation.reset()}
        onClose={() => {
          createMutation.reset();
          setAddUserOpen(false);
        }}
        onSave={(payload) => createMutation.mutate(payload)}
      />
    </div>
  );
}
