/* eslint-disable react-refresh/only-export-components */

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BriefcaseBusiness,
  Building2,
  FileText,
  TrendingUp,
  UserRoundPlus,
  Users,
  Clock3,
} from "lucide-react";
import { useMemo, useState } from "react";
import { getDashboardDetailList } from "@/apis/dashboard-details";
import { getDashboardBundle } from "@/apis/dashboard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { DetailsModal } from "@/components/dashboard/DetailsModal";
import { Navbar } from "@/components/dashboard/Navbar";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { StatCard } from "@/components/dashboard/StatCard";
import { updateUser } from "@/apis/users";
import { clearAuthSession } from "@/lib/auth";

const ACTIVITY_PAGE_SIZE = 5;

export const Route = createFileRoute("/")({
  component: HomePage,
});

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Number(value || 0));
}

const STAT_DETAIL_META = {
  users: {
    title: "Total Users",
    subtitle: "Latest registered and active users",
  },
  companies: {
    title: "Companies",
    subtitle: "Most recent registered companies",
  },
  jobs: {
    title: "Active Jobs",
    subtitle: "Latest open and active job postings",
  },
  applications: {
    title: "Applications",
    subtitle: "Most recent application submissions",
  },
  pendingApprovals: {
    title: "Pending Approvals",
    subtitle: "Users awaiting verification approval",
  },
  newThisWeek: {
    title: "New This Week",
    subtitle: "Users who joined in the last 7 days",
  },
};

function getItemPrimaryText(type, item) {
  if (type === "users") return item.full_name || item.email || "User";
  if (type === "pendingApprovals")
    return item.full_name || item.email || "User";
  if (type === "newThisWeek") return item.full_name || item.email || "User";
  if (type === "companies") return item.name || "Company";
  if (type === "jobs") return item.title || "Job";
  if (type === "applications") return `Application #${item.id}`;
  return `Item #${item.id}`;
}

function getItemSecondaryText(type, item) {
  if (type === "users")
    return `${item.email || "No email"} • ${item.role || "role n/a"}`;
  if (type === "pendingApprovals") {
    return `${item.email || "No email"} • ${item.role || "role n/a"} • verification pending`;
  }
  if (type === "newThisWeek") {
    return `${item.email || "No email"} • ${item.role || "role n/a"} • joined this week`;
  }
  if (type === "companies") return `${item.location || "Unknown location"}`;
  if (type === "jobs")
    return `${item.location || "Unknown"} • ${item.status || "status n/a"}`;
  if (type === "applications") {
    return `Candidate ${item.candidate_id || "-"} • Job ${item.job_id || "-"} • ${item.status || "pending"}`;
  }
  return "";
}

function formatDate(input) {
  if (!input) return "-";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function isWithinLastDays(input, days = 7) {
  if (!input) return false;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return false;

  const now = Date.now();
  const diff = now - date.getTime();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

function isUserDetailType(type) {
  return (
    type === "users" || type === "pendingApprovals" || type === "newThisWeek"
  );
}

function toPositivePercent(value) {
  const numeric = Number(value || 0);
  return Math.max(0, Math.min(100, numeric));
}

function toMetricBarWidth(growthValue) {
  const normalized = Math.min(100, Math.abs(Number(growthValue || 0)));
  return `${Math.max(8, normalized)}%`;
}

function HomePage() {
  const queryClient = useQueryClient();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [selectedStatType, setSelectedStatType] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);

  const dashboardQuery = useQuery({
    queryKey: ["admin-dashboard", activityPage],
    queryFn: async () =>
      getDashboardBundle({ page: activityPage, limit: ACTIVITY_PAGE_SIZE }),
    staleTime: 30_000,
    retry: false,
  });

  const dashboard = dashboardQuery.data?.dashboard;
  const user = dashboardQuery.data?.currentUser;

  const statDetailsQuery = useQuery({
    queryKey: ["dashboard-details", selectedStatType],
    queryFn: () =>
      getDashboardDetailList(selectedStatType, {
        limit: selectedStatType === "newThisWeek" ? 30 : 8,
      }),
    enabled: Boolean(selectedStatType),
    staleTime: 20_000,
    retry: false,
  });

  const statDetailItems = useMemo(() => {
    const rows = statDetailsQuery.data?.data || [];

    if (selectedStatType === "newThisWeek") {
      return rows.filter((item) => isWithinLastDays(item.created_at, 7));
    }

    return rows;
  }, [selectedStatType, statDetailsQuery.data?.data]);

  const approvalActionMutation = useMutation({
    mutationFn: async ({ userId, action }) => {
      if (action === "approve") {
        return updateUser(userId, { is_verified: true, status: "active" });
      }

      return updateUser(userId, { is_verified: false, status: "disabled" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-details"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
    onError: (error) => {
      console.error("Pending approval action failed", error);
    },
  });

  const statCards = useMemo(() => {
    const summary = dashboard?.summary || {};
    const growth = dashboard?.growth || {};

    return [
      {
        key: "users",
        title: "Total Users",
        value: formatNumber(summary.totalUsers),
        change: Number(growth.users || 0),
        subtitle: "Active platform users",
        icon: Users,
      },
      {
        key: "companies",
        title: "Companies",
        value: formatNumber(summary.totalCompanies),
        change: Number(growth.companies || 0),
        subtitle: "Registered companies",
        icon: Building2,
      },
      {
        key: "jobs",
        title: "Active Jobs",
        value: formatNumber(summary.activeJobs),
        change: Number(growth.jobs || 0),
        subtitle: "Open positions",
        icon: BriefcaseBusiness,
      },
      {
        key: "applications",
        title: "Applications",
        value: formatNumber(summary.totalApplications),
        change: Number(growth.applications || 0),
        subtitle: "Total submissions",
        icon: FileText,
      },
    ];
  }, [dashboard]);

  const highlights = dashboard?.highlights || {};
  const summary = dashboard?.summary || {};
  const growth = dashboard?.growth || {};
  const activities = dashboard?.activities?.data || [];
  const pagination = dashboard?.activities?.pagination;

  const conversionRateValue = Number(highlights.conversionRate || 0);
  const estimatedInterviews = Math.round(
    (conversionRateValue / 100) * Number(summary.totalApplications || 0),
  );

  if (dashboardQuery.isError) {
    const status = dashboardQuery.error?.status;

    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--dash-bg)] px-4">
        <section className="w-full max-w-lg rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-6 text-center shadow-[var(--dash-shadow)]">
          <h2 className="m-0 text-2xl font-semibold text-[var(--dash-text)]">
            {status === 401 ? "Session expired" : "Dashboard unavailable"}
          </h2>
          <p className="mt-2 text-[var(--dash-muted)]">
            {status === 401
              ? "Your login has expired. Please sign in again to continue."
              : status === 400
                ? "Invalid request for dashboard stats. Please refresh and try again."
                : "Something went wrong while loading dashboard data."}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            {status === 401 ? (
              <button
                type="button"
                onClick={() => {
                  clearAuthSession();
                  window.location.assign("/login");
                }}
                className="rounded-xl bg-[var(--dash-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--dash-accent-strong)]"
              >
                Go to login
              </button>
            ) : (
              <button
                type="button"
                onClick={() => dashboardQuery.refetch()}
                className="rounded-xl bg-[var(--dash-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--dash-accent-strong)]"
              >
                Retry
              </button>
            )}
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--dash-bg)] text-[var(--dash-text)]">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        user={user}
        onLogout={() => {
          clearAuthSession();
          window.location.assign("/login");
        }}
      />

      <div
        className={`transition-all duration-300 ${
          collapsed ? "lg:ml-[92px]" : "lg:ml-[320px]"
        }`}
      >
        <Navbar onMenuClick={() => setMobileOpen(true)} />

        <main className="space-y-6 p-4 sm:p-8">
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <StatCard
                key={card.title}
                {...card}
                onClick={() => {
                  setSelectedStatType(card.key);
                }}
              />
            ))}
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <article
              className="rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-6 shadow-[var(--dash-shadow)] transition duration-300 hover:border-[var(--dash-accent)] hover:bg-[var(--dash-accent-soft)] cursor-pointer"
              onClick={() => setSelectedStatType("pendingApprovals")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedStatType("pendingApprovals");
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="View pending approvals details"
            >
              <p className="m-0 flex items-center justify-between text-lg font-semibold text-[var(--dash-text)] sm:text-xl">
                Pending Approvals
                <Clock3 size={18} className="text-[var(--dash-warning)]" />
              </p>
              <p className="m-0 mt-8 text-2xl font-semibold text-[var(--dash-text)]">
                {formatNumber(highlights.pendingApprovals)}
              </p>
              <p className="m-0 mt-2 text-sm text-[var(--dash-muted)]">
                Users awaiting verification
              </p>
            </article>

            <article
              className="rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-6 shadow-[var(--dash-shadow)] transition duration-300 hover:border-[var(--dash-accent)] hover:bg-[var(--dash-accent-soft)] cursor-pointer"
              onClick={() => setSelectedStatType("newThisWeek")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedStatType("newThisWeek");
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="View new users this week"
            >
              <p className="m-0 flex items-center justify-between text-lg font-semibold text-[var(--dash-text)] sm:text-xl">
                New This Week
                <UserRoundPlus
                  size={18}
                  className="text-[var(--dash-accent)]"
                />
              </p>
              <p className="m-0 mt-8 text-2xl font-semibold text-[var(--dash-text)]">
                {formatNumber(highlights.newThisWeek)}
              </p>
              <p className="m-0 mt-2 text-sm text-[var(--dash-muted)]">
                New user registrations
              </p>
            </article>

            <article
              className="rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-6 shadow-[var(--dash-shadow)] transition duration-300 hover:border-[var(--dash-accent)] hover:bg-[var(--dash-accent-soft)] cursor-pointer"
              onClick={() => setAnalyticsModalOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setAnalyticsModalOpen(true);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="View conversion rate analytics"
            >
              <p className="m-0 flex items-center justify-between text-lg font-semibold text-[var(--dash-text)] sm:text-xl">
                Conversion Rate
                <TrendingUp size={18} className="text-[var(--dash-accent)]" />
              </p>
              <p className="m-0 mt-8 text-2xl font-semibold text-[var(--dash-accent)]">
                {Number(highlights.conversionRate || 0).toFixed(1)}%
              </p>
              <p className="m-0 mt-2 text-sm text-[var(--dash-muted)]">
                Applications to interviews
              </p>
            </article>
          </section>

          <ActivityFeed
            items={activities}
            pagination={pagination}
            isLoading={dashboardQuery.isPending || dashboardQuery.isFetching}
            onPageChange={(nextPage) => {
              setActivityPage(nextPage);
            }}
            onActivityClick={(item) => setSelectedActivity(item)}
          />
        </main>
      </div>

      <DetailsModal
        open={Boolean(selectedStatType)}
        title={
          selectedStatType
            ? STAT_DETAIL_META[selectedStatType]?.title
            : "Details"
        }
        subtitle={
          selectedStatType ? STAT_DETAIL_META[selectedStatType]?.subtitle : ""
        }
        onClose={() => setSelectedStatType(null)}
      >
        {statDetailsQuery.isPending ? (
          <p className="m-0 text-sm text-[var(--dash-muted)]">
            Loading details...
          </p>
        ) : null}

        {statDetailsQuery.isError ? (
          <p className="m-0 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-3 py-3 text-sm text-[var(--dash-danger)]">
            Unable to load detail list right now.
          </p>
        ) : null}

        {!statDetailsQuery.isPending && !statDetailsQuery.isError ? (
          statDetailItems.length > 0 ? (
            <div className="space-y-2">
              {statDetailItems.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] px-4 py-3"
                >
                  <p className="m-0 text-sm font-semibold text-[var(--dash-text)]">
                    {getItemPrimaryText(selectedStatType, item)}
                  </p>
                  <p className="m-0 mt-1 text-sm text-[var(--dash-muted)]">
                    {getItemSecondaryText(selectedStatType, item)}
                  </p>
                  <p className="m-0 mt-1 text-xs text-[var(--dash-muted)]">
                    Created: {formatDate(item.created_at || item.applied_at)}
                  </p>

                  {selectedStatType === "pendingApprovals" ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${item.status === "disabled" ? "bg-[#2a151f] text-[#ff93ad]" : "bg-[#132b1f] text-[#7df0be]"}`}
                      >
                        {item.status || "active"}
                      </span>
                      <span className="rounded-full bg-[#132235] px-2 py-1 text-xs font-semibold text-[#9fc1e0]">
                        {item.is_verified ? "Verified" : "Unverified"}
                      </span>

                      <button
                        type="button"
                        disabled={approvalActionMutation.isPending}
                        onClick={() =>
                          approvalActionMutation.mutate({
                            userId: item.id,
                            action: "approve",
                          })
                        }
                        className="rounded-lg border border-[#86efac] bg-[#f0fdf4] px-3 py-1 text-xs font-semibold text-[var(--dash-success)] transition hover:bg-[#dcfce7] disabled:opacity-50"
                      >
                        {approvalActionMutation.isPending &&
                        approvalActionMutation.variables?.userId === item.id
                          ? "Approving..."
                          : "Approve"}
                      </button>

                      <button
                        type="button"
                        disabled={approvalActionMutation.isPending}
                        onClick={() =>
                          approvalActionMutation.mutate({
                            userId: item.id,
                            action: "reject",
                          })
                        }
                        className="rounded-lg border border-[#fecaca] bg-[#fff1f2] px-3 py-1 text-xs font-semibold text-[var(--dash-danger)] transition hover:bg-[#ffe4e6] disabled:opacity-50"
                      >
                        {approvalActionMutation.isPending &&
                        approvalActionMutation.variables?.userId === item.id
                          ? "Rejecting..."
                          : "Reject"}
                      </button>
                    </div>
                  ) : null}

                  {isUserDetailType(selectedStatType) ? (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => setSelectedProfileUser(item)}
                        className="rounded-lg border border-[var(--dash-border)] bg-white px-3 py-1 text-xs font-medium text-[var(--dash-muted)] transition hover:border-[var(--dash-accent)] hover:bg-[var(--dash-accent-soft)] hover:text-[var(--dash-accent)]"
                      >
                        View Profile
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <p className="m-0 text-sm text-[var(--dash-muted)]">
              No records found.
            </p>
          )
        ) : null}
      </DetailsModal>

      <DetailsModal
        open={Boolean(selectedProfileUser)}
        title="User Profile"
        subtitle="Quick profile preview"
        onClose={() => setSelectedProfileUser(null)}
        sizeClassName="max-w-md"
      >
        <div className="space-y-2">
          <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] p-3">
            <p className="m-0 text-xs text-[var(--dash-muted)]">Name</p>
            <p className="m-0 mt-1 text-sm font-medium text-[var(--dash-text)]">
              {selectedProfileUser?.full_name || "-"}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] p-3">
            <p className="m-0 text-xs text-[var(--dash-muted)]">Email</p>
            <p className="m-0 mt-1 text-sm text-[var(--dash-text)]">
              {selectedProfileUser?.email || "-"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] p-3">
              <p className="m-0 text-xs text-[var(--dash-muted)]">Role</p>
              <p className="m-0 mt-1 text-sm text-[var(--dash-text)]">
                {selectedProfileUser?.role || "-"}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] p-3">
              <p className="m-0 text-xs text-[var(--dash-muted)]">Status</p>
              <p className="m-0 mt-1 text-sm text-[var(--dash-text)]">
                {selectedProfileUser?.status || "-"}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] p-3">
            <p className="m-0 text-xs text-[var(--dash-muted)]">Verification</p>
            <p className="m-0 mt-1 text-sm text-[var(--dash-text)]">
              {selectedProfileUser?.is_verified ? "Verified" : "Unverified"}
            </p>
          </div>
        </div>
      </DetailsModal>

      <DetailsModal
        open={analyticsModalOpen}
        title="Conversion Rate Analytics"
        subtitle="Conversion performance, trends, and weekly metric breakdown"
        onClose={() => setAnalyticsModalOpen(false)}
      >
        <div className="space-y-3">
          <article className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] p-4">
            <p className="m-0 text-xs uppercase tracking-wide text-[var(--dash-muted)]">
              Current Conversion
            </p>
            <p className="m-0 mt-1 text-2xl font-semibold text-[var(--dash-accent)]">
              {conversionRateValue.toFixed(1)}%
            </p>
            <div className="mt-3 h-2 w-full rounded-full bg-[#ffe2c7]">
              <div
                className="h-2 rounded-full bg-[var(--dash-accent)]"
                style={{ width: `${toPositivePercent(conversionRateValue)}%` }}
              />
            </div>
            <p className="m-0 mt-2 text-xs text-[var(--dash-muted)]">
              Based on {formatNumber(summary.totalApplications)} applications
              and
              {formatNumber(estimatedInterviews)} estimated interview
              conversions.
            </p>
          </article>

          <article className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] p-4">
            <p className="m-0 text-sm font-semibold text-[var(--dash-text)]">
              Weekly Trend Breakdown
            </p>
            <p className="m-0 mt-1 text-xs text-[var(--dash-muted)]">
              Growth by category over the previous period.
            </p>

            <div className="mt-3 space-y-3">
              {[
                { label: "Users", value: growth.users },
                { label: "Companies", value: growth.companies },
                { label: "Jobs", value: growth.jobs },
                { label: "Applications", value: growth.applications },
              ].map((metric) => {
                const positive = Number(metric.value || 0) >= 0;
                return (
                  <div key={metric.label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-[var(--dash-muted)]">
                        {metric.label}
                      </span>
                      <span
                        className={
                          positive
                            ? "text-[var(--dash-success)]"
                            : "text-[var(--dash-danger)]"
                        }
                      >
                        {positive ? "+" : ""}
                        {Number(metric.value || 0)}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#ffe2c7]">
                      <div
                        className={`h-2 rounded-full ${positive ? "bg-[var(--dash-success)]" : "bg-[var(--dash-danger)]"}`}
                        style={{ width: toMetricBarWidth(metric.value) }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] p-4">
            <p className="m-0 text-sm font-semibold text-[var(--dash-text)]">
              Summary
            </p>
            <ul className="m-0 mt-2 list-disc space-y-1 pl-4 text-sm text-[var(--dash-muted)]">
              <li>
                Total applications: {formatNumber(summary.totalApplications)}
              </li>
              <li>Estimated interviews: {formatNumber(estimatedInterviews)}</li>
              <li>
                Active jobs driving funnel: {formatNumber(summary.activeJobs)}
              </li>
            </ul>
          </article>
        </div>
      </DetailsModal>

      <DetailsModal
        open={Boolean(selectedActivity)}
        title={selectedActivity?.title || "Activity details"}
        subtitle="Full activity content"
        onClose={() => setSelectedActivity(null)}
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] p-4">
            <p className="m-0 text-sm text-[var(--dash-muted)]">Message</p>
            <p className="m-0 mt-1 text-sm text-[var(--dash-text)]">
              {selectedActivity?.message || "No message available."}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] p-3">
              <p className="m-0 text-xs text-[var(--dash-muted)]">Type</p>
              <p className="m-0 mt-1 text-sm text-[var(--dash-text)]">
                {selectedActivity?.type || "info"}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] p-3">
              <p className="m-0 text-xs text-[var(--dash-muted)]">Created</p>
              <p className="m-0 mt-1 text-sm text-[var(--dash-text)]">
                {formatDate(selectedActivity?.created_at)}
              </p>
            </div>
          </div>
        </div>
      </DetailsModal>
    </div>
  );
}
