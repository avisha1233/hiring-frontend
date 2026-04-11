import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
import { getDashboardBundle } from "@/apis/dashboard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { Navbar } from "@/components/dashboard/Navbar";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { StatCard } from "@/components/dashboard/StatCard";
import { clearAuthSession } from "@/lib/auth";

const ACTIVITY_PAGE_SIZE = 5;

export const Route = createFileRoute("/")({
  component: HomePage,
});

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Number(value || 0));
}

function HomePage() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activityPage, setActivityPage] = useState(1);

  const dashboardQuery = useQuery({
    queryKey: ["admin-dashboard", activityPage],
    queryFn: async () =>
      getDashboardBundle({ page: activityPage, limit: ACTIVITY_PAGE_SIZE }),
    staleTime: 30_000,
    retry: false,
  });

  const dashboard = dashboardQuery.data?.dashboard;
  const user = dashboardQuery.data?.currentUser;

  const statCards = useMemo(() => {
    const summary = dashboard?.summary || {};
    const growth = dashboard?.growth || {};

    return [
      {
        title: "Total Users",
        value: formatNumber(summary.totalUsers),
        change: Number(growth.users || 0),
        subtitle: "Active platform users",
        icon: Users,
      },
      {
        title: "Companies",
        value: formatNumber(summary.totalCompanies),
        change: Number(growth.companies || 0),
        subtitle: "Registered companies",
        icon: Building2,
      },
      {
        title: "Active Jobs",
        value: formatNumber(summary.activeJobs),
        change: Number(growth.jobs || 0),
        subtitle: "Open positions",
        icon: BriefcaseBusiness,
      },
      {
        title: "Applications",
        value: formatNumber(summary.totalApplications),
        change: Number(growth.applications || 0),
        subtitle: "Total submissions",
        icon: FileText,
      },
    ];
  }, [dashboard]);

  const highlights = dashboard?.highlights || {};
  const activities = dashboard?.activities?.data || [];
  const pagination = dashboard?.activities?.pagination;

  const notificationCount = activities.filter((item) => !item.is_read).length;

  if (dashboardQuery.isError) {
    const status = dashboardQuery.error?.status;

    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030711] px-4">
        <section className="w-full max-w-lg rounded-2xl border border-[#1c2b41] bg-[#050b16] p-6 text-center">
          <h2 className="m-0 text-2xl font-semibold text-white">
            {status === 401 ? "Session expired" : "Dashboard unavailable"}
          </h2>
          <p className="mt-2 text-[#8ea2be]">
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
                className="rounded-xl bg-[#00d09c] px-4 py-2 text-sm font-semibold text-[#062018]"
              >
                Go to login
              </button>
            ) : (
              <button
                type="button"
                onClick={() => dashboardQuery.refetch()}
                className="rounded-xl bg-[#00d09c] px-4 py-2 text-sm font-semibold text-[#062018]"
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
    <div className="min-h-screen bg-[#030711] text-white">
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
        <Navbar
          onMenuClick={() => setMobileOpen(true)}
          notificationCount={notificationCount}
        />

        <main className="space-y-6 p-4 sm:p-8">
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <StatCard key={card.title} {...card} />
            ))}
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <article className="rounded-2xl border border-[#162338] bg-[#050b16] p-6 transition duration-300 hover:border-[#28415f]">
              <p className="m-0 flex items-center justify-between text-lg font-semibold text-white sm:text-xl">
                Pending Approvals
                <Clock3 size={18} className="text-[#8fa4c0]" />
              </p>
              <p className="m-0 mt-8 text-2xl font-semibold text-white">
                {formatNumber(highlights.pendingApprovals)}
              </p>
              <p className="m-0 mt-2 text-sm text-[#8ca1bd]">
                Users awaiting verification
              </p>
            </article>

            <article className="rounded-2xl border border-[#162338] bg-[#050b16] p-6 transition duration-300 hover:border-[#28415f]">
              <p className="m-0 flex items-center justify-between text-lg font-semibold text-white sm:text-xl">
                New This Week
                <UserRoundPlus size={18} className="text-[#8fa4c0]" />
              </p>
              <p className="m-0 mt-8 text-2xl font-semibold text-white">
                {formatNumber(highlights.newThisWeek)}
              </p>
              <p className="m-0 mt-2 text-sm text-[#8ca1bd]">
                New user registrations
              </p>
            </article>

            <article className="rounded-2xl border border-[#162338] bg-[#050b16] p-6 transition duration-300 hover:border-[#28415f]">
              <p className="m-0 flex items-center justify-between text-lg font-semibold text-white sm:text-xl">
                Conversion Rate
                <TrendingUp size={18} className="text-[#00d09c]" />
              </p>
              <p className="m-0 mt-8 text-2xl font-semibold text-[#00d09c]">
                {Number(highlights.conversionRate || 0).toFixed(1)}%
              </p>
              <p className="m-0 mt-2 text-sm text-[#8ca1bd]">
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
          />
        </main>
      </div>
    </div>
  );
}
