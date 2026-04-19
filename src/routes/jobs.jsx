/* eslint-disable react-refresh/only-export-components */

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Funnel, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { getCompanies } from "@/apis/companies";
import { createJob, deleteJob, getJobs, updateJob } from "@/apis/jobs";
import { Button } from "@/components/companies/Button";
import { Modal } from "@/components/companies/Modal";
import { SearchBar } from "@/components/companies/SearchBar";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { JobModal } from "@/components/jobs/JobModal";
import { JobsHeader } from "@/components/jobs/JobsHeader";
import { JobsTable } from "@/components/jobs/JobsTable";
import { ToastStack } from "@/components/jobs/ToastStack";
import { clearAuthSession, getAuthUser } from "@/lib/auth";

const PAGE_SIZE = 8;

export const Route = createFileRoute("/jobs")({
  component: JobsPage,
});

function normalizeStatus(status) {
  const value = String(status || "").toLowerCase();
  if (value === "open") return "open";
  if (value === "closed") return "closed";
  if (value === "draft") return "draft";
  return "draft";
}

function getErrorMessage(error, fallback = "Something went wrong") {
  return error?.message || fallback;
}

function JobsPage() {
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [jobModalMode, setJobModalMode] = useState("create");
  const [activeJob, setActiveJob] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "success") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  };

  const jobsQuery = useQuery({
    queryKey: ["jobs", page, jobSearch, statusFilter],
    queryFn: () =>
      getJobs({
        page,
        limit: PAGE_SIZE,
        search: jobSearch,
        ...(statusFilter !== "all" && statusFilter !== "draft"
          ? { status: statusFilter }
          : {}),
      }),
    staleTime: 20_000,
    retry: false,
  });

  const companiesQuery = useQuery({
    queryKey: ["companies", "jobs-map"],
    queryFn: () =>
      getCompanies({
        page: 1,
        limit: 200,
      }),
    staleTime: 60_000,
    retry: false,
  });

  const companyMap = useMemo(() => {
    const rows = companiesQuery.data?.data || [];
    const map = new Map();
    rows.forEach((company) => {
      map.set(company.id, company.name);
    });
    return map;
  }, [companiesQuery.data?.data]);

  const companyOptions = useMemo(() => {
    const rows = companiesQuery.data?.data || [];
    return rows.map((company) => ({ id: company.id, name: company.name }));
  }, [companiesQuery.data?.data]);

  const createMutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setJobModalOpen(false);
      setActiveJob(null);
      addToast("Job created successfully.");
    },
    onError: (error) => {
      addToast(getErrorMessage(error, "Failed to create job."), "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateJob(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setJobModalOpen(false);
      setActiveJob(null);
      addToast("Job updated successfully.");
    },
    onError: (error) => {
      addToast(getErrorMessage(error, "Failed to update job."), "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setDeleteTarget(null);
      addToast("Job deleted successfully.");
    },
    onError: (error) => {
      addToast(getErrorMessage(error, "Failed to delete job."), "error");
    },
  });

  const rows = useMemo(() => {
    const data = jobsQuery.data?.data || [];
    const headerTerm = headerSearch.trim().toLowerCase();

    const filteredByHeader = !headerTerm
      ? data
      : data.filter((job) => {
          const companyName = String(companyMap.get(job.company_id) || "")
            .toLowerCase()
            .trim();
          return (
            String(job.title || "")
              .toLowerCase()
              .includes(headerTerm) ||
            String(job.location || "")
              .toLowerCase()
              .includes(headerTerm) ||
            companyName.includes(headerTerm)
          );
        });

    if (statusFilter === "draft") {
      return filteredByHeader.filter(
        (job) => normalizeStatus(job.status) === "draft",
      );
    }

    return filteredByHeader;
  }, [jobsQuery.data?.data, headerSearch, statusFilter, companyMap]);

  const pagination = {
    currentPage: jobsQuery.data?.currentPage || page,
    totalPage: jobsQuery.data?.totalPage || 1,
  };

  const submitJob = (payload) => {
    if (jobModalMode === "edit" && activeJob?.id) {
      updateMutation.mutate({ id: activeJob.id, payload });
      return;
    }

    createMutation.mutate(payload);
  };

  const currentUser = getAuthUser();

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
        <JobsHeader
          title="Job Management"
          subtitle="Manage job postings across all companies"
          headerSearch={headerSearch}
          onHeaderSearch={setHeaderSearch}
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="space-y-5 p-4 sm:p-8">
          <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-(--dash-border) bg-(--dash-surface) p-3 shadow-(--dash-shadow)">
            <SearchBar
              value={jobSearch}
              onChange={(value) => {
                setPage(1);
                setJobSearch(value);
              }}
              placeholder="Search jobs..."
              className="min-w-65 flex-1"
            />

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(event) => {
                  setPage(1);
                  setStatusFilter(event.target.value);
                }}
                className="h-10 rounded-xl border border-(--dash-border) bg-(--dash-surface) pl-9 pr-8 text-sm text-(--dash-text) outline-none"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="draft">Draft</option>
              </select>
              <Funnel
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--dash-accent)"
              />
            </div>

            <Button
              onClick={() => {
                setJobModalMode("create");
                setActiveJob(null);
                setJobModalOpen(true);
              }}
            >
              <Plus size={16} />
              Post Job
            </Button>
          </section>

          <JobsTable
            jobs={rows}
            companyMap={companyMap}
            isLoading={jobsQuery.isPending}
            isError={jobsQuery.isError}
            errorMessage={jobsQuery.error?.message}
            onRetry={() => jobsQuery.refetch()}
            onEdit={(job) => {
              setJobModalMode("edit");
              setActiveJob(job);
              setJobModalOpen(true);
            }}
            onDelete={(job) => setDeleteTarget(job)}
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
                  setPage((prev) => Math.min(pagination.totalPage, prev + 1))
                }
              >
                Next
              </Button>
            </div>
          </section>
        </main>
      </div>

      <JobModal
        open={jobModalOpen}
        mode={jobModalMode}
        job={activeJob}
        companyOptions={companyOptions}
        isSaving={createMutation.isPending || updateMutation.isPending}
        onClose={() => {
          setJobModalOpen(false);
          setActiveJob(null);
        }}
        onSave={submitJob}
      />

      <Modal
        open={Boolean(deleteTarget)}
        title="Delete Job"
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
          Are you sure you want to delete {deleteTarget?.title || "this job"}?
          This action cannot be undone.
        </p>
      </Modal>

      <ToastStack
        toasts={toasts}
        onDismiss={(toastId) =>
          setToasts((prev) => prev.filter((toast) => toast.id !== toastId))
        }
      />
    </div>
  );
}
