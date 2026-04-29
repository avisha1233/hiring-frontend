/* eslint-disable react-refresh/only-export-components */

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Eye, Search } from "lucide-react";
import { format } from "date-fns";
import { candidateApi } from "@/apis/candidate";
import { CandidateLayout } from "@/components/candidate/CandidateLayout";

export const Route = createFileRoute("/applications")({
  component: ApplicationsPage,
});

const TABS = ["all", "reviewing", "shortlisted", "pending", "rejected"];

const STATUS_CLASS = {
  reviewing: "border border-sky-200 bg-sky-50 text-sky-700",
  shortlisted: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border border-orange-200 bg-orange-50 text-orange-700",
  rejected: "border border-red-200 bg-red-50 text-red-700",
  offered: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  interview: "border border-violet-200 bg-violet-50 text-violet-700",
};

function normalizeStatus(raw) {
  const value = String(raw || "").toLowerCase();
  if (value === "interviewing") return "reviewing";
  if (value === "applied") return "pending";
  if (value === "offered") return "shortlisted";
  if (value === "shortlisted") return "shortlisted";
  if (value === "rejected") return "rejected";
  return "pending";
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, "MMM d, yyyy");
}

function formatShortDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, "MMM d");
}

function getStatusMeta(status) {
  const normalized = normalizeStatus(status);

  const meta = {
    reviewing: {
      label: "Reviewing",
      className: "border border-sky-200 bg-sky-50 text-sky-700",
    },
    shortlisted: {
      label: "Shortlisted",
      className: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    pending: {
      label: "Pending",
      className: "border border-orange-200 bg-orange-50 text-orange-700",
    },
    rejected: {
      label: "Rejected",
      className: "border border-red-200 bg-red-50 text-red-700",
    },
    offered: {
      label: "Offered",
      className: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    interview: {
      label: "Interview",
      className: "border border-violet-200 bg-violet-50 text-violet-700",
    },
  };

  return meta[normalized] || meta.pending;
}

function getApplicationDate(application) {
  return (
    application.appliedDate ||
    application.applied_at ||
    application.created_at ||
    application.updated_at
  );
}

function ApplicationsPage() {
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);

  const applicationsQuery = useQuery({
    queryKey: ["candidate", "applications", status, search, timeRange],
    queryFn: () =>
      candidateApi.getApplications({
        status,
        search,
        timeRange,
        page: 1,
        limit: 50,
        sort: "applied_at",
        sortDirection: "DESC",
      }),
    retry: false,
    staleTime: 20_000,
  });

  const rows = useMemo(
    () => applicationsQuery.data?.data || [],
    [applicationsQuery.data?.data],
  );

  const selectedApplicationQuery = useQuery({
    queryKey: ["candidate", "application", selectedApplicationId],
    queryFn: () => candidateApi.getApplicationById(selectedApplicationId),
    enabled: selectedApplicationId !== null,
    retry: false,
    staleTime: 20_000,
  });

  const summary = useMemo(() => {
    const counts = rows.reduce(
      (accumulator, item) => {
        const normalized = normalizeStatus(item.status);
        accumulator.total += 1;
        accumulator[normalized] = (accumulator[normalized] || 0) + 1;
        return accumulator;
      },
      {
        total: 0,
        reviewing: 0,
        shortlisted: 0,
        pending: 0,
        rejected: 0,
        offered: 0,
        interview: 0,
      },
    );

    return [
      { title: "Total", value: counts.total, accent: "text-(--dash-accent)" },
      { title: "Reviewing", value: counts.reviewing, accent: "text-sky-600" },
      {
        title: "Shortlisted",
        value: counts.shortlisted,
        accent: "text-emerald-600",
      },
      { title: "Offered", value: counts.offered, accent: "text-emerald-600" },
    ];
  }, [rows]);

  const activeApplication =
    selectedApplicationQuery.data ||
    rows.find((item) => item.id === selectedApplicationId) ||
    rows[0] ||
    null;

  return (
    <CandidateLayout
      title="My Applications"
      subtitle="Track and manage your job applications"
      searchValue={search}
      onSearch={setSearch}
    >
      <section className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {summary.map((item) => (
            <article
              key={item.title}
              className="rounded-xl border border-(--dash-border) bg-(--dash-surface) p-4 shadow-(--dash-shadow)"
            >
              <p className="m-0 text-xs font-semibold uppercase tracking-[0.12em] text-(--dash-muted)">
                {item.title}
              </p>
              <p className={`m-0 mt-2 text-3xl font-semibold ${item.accent}`}>
                {item.value}
              </p>
              <p className="m-0 mt-2 text-xs text-(--dash-muted)">
                Applications across your current filters
              </p>
            </article>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-(--dash-border) bg-(--dash-surface) p-3 shadow-(--dash-shadow)">
              {TABS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setStatus(item)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize transition ${status === item ? "bg-(--dash-accent-soft) text-(--dash-accent)" : "text-(--dash-muted) hover:bg-(--dash-accent-soft) hover:text-(--dash-accent)"}`}
                >
                  {item}
                </button>
              ))}

              <div className="ml-auto flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-lg border border-(--dash-border) bg-white px-3 py-1.5">
                  <Search size={14} className="text-(--dash-muted)" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search applications"
                    className="w-40 bg-transparent text-xs text-(--dash-text) outline-none placeholder:text-(--dash-muted)"
                  />
                </div>

                <select
                  value={timeRange}
                  onChange={(event) => setTimeRange(event.target.value)}
                  className="rounded-lg border border-(--dash-border) bg-white px-3 py-1.5 text-xs text-(--dash-muted)"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="all">All time</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-(--dash-border) bg-(--dash-surface) p-3 shadow-(--dash-shadow)">
              {applicationsQuery.isError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  Unable to load applications right now. Please try again.
                </div>
              ) : null}

              {applicationsQuery.isPending ? (
                <div className="space-y-2">
                  <div className="h-12 animate-pulse rounded-lg bg-(--dash-accent-soft)" />
                  <div className="h-12 animate-pulse rounded-lg bg-(--dash-accent-soft)" />
                  <div className="h-12 animate-pulse rounded-lg bg-(--dash-accent-soft)" />
                </div>
              ) : rows.length === 0 ? (
                <div className="rounded-xl border border-dashed border-(--dash-border) bg-(--dash-bg-elevated) p-8 text-center text-sm text-(--dash-muted)">
                  No applications found for the selected filters.
                </div>
              ) : (
                <table className="w-full min-w-[860px] text-sm">
                  <thead>
                    <tr className="border-b border-(--dash-border) text-left text-xs text-(--dash-muted)">
                      <th className="pb-2">Job Title</th>
                      <th className="pb-2">Company</th>
                      <th className="pb-2">Applied On</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((item) => {
                      const statusMeta = getStatusMeta(item.status);
                      return (
                        <tr
                          key={item.id}
                          className="border-b border-(--dash-border) last:border-b-0 hover:bg-(--dash-bg-elevated)"
                        >
                          <td className="py-3">
                            <p className="m-0 font-semibold text-(--dash-text)">
                              {item.jobTitle || item.job_title || "Role"}
                            </p>
                            <p className="m-0 mt-1 text-xs text-(--dash-muted)">
                              Application #{item.id}
                            </p>
                          </td>
                          <td className="py-3 text-(--dash-muted)">
                            {item.companyName || item.company_name || "Company"}
                          </td>
                          <td className="py-3 text-(--dash-muted)">
                            {formatDate(getApplicationDate(item))}
                          </td>
                          <td className="py-3">
                            <span
                              className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${statusMeta.className}`}
                            >
                              {statusMeta.label}
                            </span>
                          </td>
                          <td className="py-3">
                            <button
                              type="button"
                              onClick={() => setSelectedApplicationId(item.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-(--dash-accent) px-3 py-1 text-xs font-semibold text-white transition hover:opacity-90"
                            >
                              <Eye size={14} /> View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <aside className="space-y-4 rounded-xl border border-(--dash-border) bg-(--dash-surface) p-4 shadow-(--dash-shadow)">
            <div>
              <h3 className="m-0 text-base font-semibold text-(--dash-text)">
                Application Details
              </h3>
              <p className="m-0 mt-1 text-sm text-(--dash-muted)">
                Click View Details to inspect a submission.
              </p>
            </div>

            {selectedApplicationQuery.isError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Unable to load application details right now.
              </div>
            ) : selectedApplicationQuery.isFetching &&
              selectedApplicationId !== null ? (
              <div className="space-y-3 rounded-xl border border-(--dash-border) bg-(--dash-bg-elevated) p-4">
                <div className="h-4 w-24 animate-pulse rounded bg-(--dash-accent-soft)" />
                <div className="h-5 w-40 animate-pulse rounded bg-(--dash-accent-soft)" />
                <div className="h-4 w-32 animate-pulse rounded bg-(--dash-accent-soft)" />
                <div className="h-4 w-28 animate-pulse rounded bg-(--dash-accent-soft)" />
              </div>
            ) : activeApplication ? (
              <div className="space-y-3 rounded-xl border border-(--dash-border) bg-(--dash-bg-elevated) p-4">
                <div>
                  <p className="m-0 text-xs font-semibold uppercase tracking-[0.12em] text-(--dash-muted)">
                    Position
                  </p>
                  <p className="m-0 mt-1 text-base font-semibold text-(--dash-text)">
                    {activeApplication.jobTitle ||
                      activeApplication.job_title ||
                      "Role"}
                  </p>
                </div>

                <div>
                  <p className="m-0 text-xs font-semibold uppercase tracking-[0.12em] text-(--dash-muted)">
                    Company
                  </p>
                  <p className="m-0 mt-1 text-sm text-(--dash-text)">
                    {activeApplication.companyName ||
                      activeApplication.company_name ||
                      "Company"}
                  </p>
                </div>

                <div>
                  <p className="m-0 text-xs font-semibold uppercase tracking-[0.12em] text-(--dash-muted)">
                    Applied On
                  </p>
                  <p className="m-0 mt-1 text-sm text-(--dash-text)">
                    {formatDate(getApplicationDate(activeApplication))}
                  </p>
                </div>

                <div>
                  <p className="m-0 text-xs font-semibold uppercase tracking-[0.12em] text-(--dash-muted)">
                    Latest Update
                  </p>
                  <p className="m-0 mt-1 text-sm text-(--dash-text)">
                    {formatShortDate(
                      activeApplication.updated_at ||
                        getApplicationDate(activeApplication),
                    )}
                  </p>
                </div>

                <div>
                  <p className="m-0 text-xs font-semibold uppercase tracking-[0.12em] text-(--dash-muted)">
                    Status
                  </p>
                  <p className="m-0 mt-1 text-sm text-(--dash-text)">
                    {getStatusMeta(activeApplication.status).label}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {Object.entries(STATUS_CLASS).map(([key, className]) => (
                    <span
                      key={key}
                      className={`rounded-md px-2 py-1 text-[11px] font-semibold ${className}`}
                    >
                      {key}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-(--dash-border) bg-(--dash-bg-elevated) p-6 text-center text-sm text-(--dash-muted)">
                No application selected.
              </div>
            )}

            <div className="rounded-xl border border-(--dash-border) bg-(--dash-bg-elevated) p-4">
              <p className="m-0 text-sm font-semibold text-(--dash-text)">
                Quick Tip
              </p>
              <p className="m-0 mt-2 text-sm text-(--dash-muted)">
                Keep your resume and profile up to date to improve your
                reviewing and shortlisted status.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </CandidateLayout>
  );
}
