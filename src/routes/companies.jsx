/* eslint-disable react-refresh/only-export-components */

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Funnel, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import {
  createCompany,
  deleteCompany,
  getCompanies,
  updateCompany,
} from "@/apis/companies";
import { Button } from "@/components/companies/Button";
import { CompanyModal } from "@/components/companies/CompanyModal";
import { ErrorMessage } from "@/components/companies/ErrorMessage";
import { Header } from "@/components/companies/Header";
import { Loader } from "@/components/companies/Loader";
import { Modal } from "@/components/companies/Modal";
import { SearchBar } from "@/components/companies/SearchBar";
import { Table } from "@/components/companies/Table";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { clearAuthSession, getAuthUser } from "@/lib/auth";

const PAGE_SIZE = 8;

export const Route = createFileRoute("/companies")({
  component: CompaniesPage,
});

function CompaniesPage() {
  const queryClient = useQueryClient();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [activeCompany, setActiveCompany] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const companiesQuery = useQuery({
    queryKey: ["companies", companySearch, page],
    queryFn: () =>
      getCompanies({
        search: companySearch,
        page,
        limit: PAGE_SIZE,
      }),
    staleTime: 20_000,
    retry: false,
  });

  const companies = useMemo(() => {
    const rows = companiesQuery.data?.data || [];

    return rows.filter((company) => {
      const currentStatus = String(company.status || "active").toLowerCase();
      const matchesStatus =
        statusFilter === "all" || currentStatus === statusFilter;

      const headerTerm = headerSearch.trim().toLowerCase();
      const matchesHeaderSearch =
        !headerTerm ||
        String(company.name || "")
          .toLowerCase()
          .includes(headerTerm) ||
        String(company.location || "")
          .toLowerCase()
          .includes(headerTerm);

      return matchesStatus && matchesHeaderSearch;
    });
  }, [companiesQuery.data?.data, headerSearch, statusFilter]);

  const createMutation = useMutation({
    mutationFn: createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setModalOpen(false);
      setActiveCompany(null);
    },
    onError: (error) => {
      console.error("Create company failed", error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateCompany(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setModalOpen(false);
      setActiveCompany(null);
    },
    onError: (error) => {
      console.error("Update company failed", error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setDeleteTarget(null);
    },
    onError: (error) => {
      console.error("Delete company failed", error);
    },
  });

  const submitCompany = (payload) => {
    if (modalMode === "edit" && activeCompany?.id) {
      updateMutation.mutate({ id: activeCompany.id, payload });
      return;
    }

    createMutation.mutate(payload);
  };
  const currentUser = getAuthUser();

  const statusCode = companiesQuery.error?.status;
  const errorTitle =
    statusCode === 401
      ? "Session expired"
      : statusCode === 400
        ? "Invalid request"
        : "Unable to fetch companies";

  const errorMessage =
    statusCode === 401
      ? "Please sign in again to continue."
      : statusCode === 500
        ? "The server returned an error while loading companies."
        : companiesQuery.error?.message;

  const pagination = {
    currentPage: companiesQuery.data?.currentPage || 1,
    totalPage: companiesQuery.data?.totalPage || 1,
  };

  return (
    <div className="min-h-screen bg-(--dash-bg) text-(--dash-text)">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        user={currentUser}
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
        <Header
          title="Company Management"
          subtitle="Manage registered companies and their verification status"
          headerSearch={headerSearch}
          onHeaderSearch={setHeaderSearch}
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="space-y-5 p-4 sm:p-8">
          <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-(--dash-border) bg-(--dash-surface) p-3 shadow-(--dash-shadow)">
            <SearchBar
              value={companySearch}
              onChange={(value) => {
                setPage(1);
                setCompanySearch(value);
              }}
              placeholder="Search companies..."
              className="min-w-65 flex-1"
            />

            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-10 rounded-xl border border-(--dash-border) bg-(--dash-surface) pl-9 pr-8 text-sm text-(--dash-text) outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
                <Funnel
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--dash-accent)"
                />
              </div>

              <Button
                onClick={() => {
                  setModalMode("create");
                  setActiveCompany(null);
                  setModalOpen(true);
                }}
              >
                <Plus size={16} />
                Add Company
              </Button>
            </div>
          </section>

          {companiesQuery.isPending ? (
            <Loader label="Loading companies..." />
          ) : null}

          {companiesQuery.isError ? (
            <ErrorMessage
              title={errorTitle}
              message={errorMessage}
              onRetry={() => companiesQuery.refetch()}
            />
          ) : null}

          {!companiesQuery.isPending && !companiesQuery.isError ? (
            <>
              <Table
                companies={companies}
                onEdit={(company) => {
                  setModalMode("edit");
                  setActiveCompany(company);
                  setModalOpen(true);
                }}
                onDelete={(company) => {
                  setDeleteTarget(company);
                }}
              />

              <section className="flex items-center justify-between rounded-2xl border border-(--dash-border) bg-(--dash-surface) px-4 py-3 shadow-(--dash-shadow)">
                <p className="m-0 text-sm text-(--dash-muted)">
                  Page {pagination.currentPage} of {pagination.totalPage}
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pagination.currentPage <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pagination.currentPage >= pagination.totalPage}
                    onClick={() =>
                      setPage((prev) =>
                        Math.min(pagination.totalPage, prev + 1),
                      )
                    }
                  >
                    Next
                  </Button>
                </div>
              </section>
            </>
          ) : null}
        </main>
      </div>

      <CompanyModal
        key={`${modalMode}-${activeCompany?.id || "new"}-${modalOpen ? "open" : "closed"}`}
        open={modalOpen}
        mode={modalMode}
        company={activeCompany}
        onClose={() => {
          setModalOpen(false);
          setActiveCompany(null);
        }}
        onSubmit={submitCompany}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      <Modal
        open={Boolean(deleteTarget)}
        title="Delete Company"
        onClose={() => setDeleteTarget(null)}
        widthClassName="max-w-md"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!deleteTarget?.id) return;
                deleteMutation.mutate(deleteTarget.id);
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </>
        }
      >
        <p className="m-0 text-sm text-(--dash-muted)">
          Are you sure you want to delete {deleteTarget?.name || "this company"}
          ? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

