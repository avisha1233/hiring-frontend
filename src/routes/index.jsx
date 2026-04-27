/* eslint-disable react-refresh/only-export-components */

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Briefcase, CheckSquare, Clock3, MessageCircle } from "lucide-react";
import { candidateApi } from "@/apis/candidate";
import { CandidateLayout } from "@/components/candidate/CandidateLayout";

export const Route = createFileRoute("/")({
  component: CandidateDashboardPage,
});

const STATUS_CLASS = {
  reviewing: "border border-sky-200 bg-sky-50 text-sky-700",
  shortlisted: "border border-amber-200 bg-amber-50 text-amber-700",
  pending: "border border-orange-200 bg-orange-50 text-orange-700",
  rejected: "border border-red-200 bg-red-50 text-red-700",
  offered: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  interview: "border border-violet-200 bg-violet-50 text-violet-700",
};

function toDateLabel(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, "MMM d, yyyy");
}

function toDateTimeLabel(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, "MMM d, yyyy h:mm a");
}

function normalizeAppStatus(raw) {
  const value = String(raw || "").toLowerCase();
  if (value === "interviewing") return "reviewing";
  if (value === "applied") return "pending";
  if (value === "offered") return "offered";
  if (value === "rejected") return "rejected";
  return "reviewing";
}

function normalizeInterviewType(raw) {
  const value = String(raw || "").toLowerCase();
  return value === "online" || value === "video" ? "video" : "phone";
}

function StatCard({ title, value, Icon }) {
  return (
    <article className="rounded-xl border border-(--dash-border) bg-(--dash-surface) p-5 shadow-(--dash-shadow)">
      <p className="m-0 flex items-center justify-between text-sm text-(--dash-muted)">
        {title}
        <Icon size={16} className="text-(--dash-accent)" />
      </p>
      <p className="m-0 mt-3 text-3xl font-semibold text-(--dash-text)">
        {value}
      </p>
      <p className="m-0 mt-2 text-xs text-(--dash-muted)">View all</p>
    </article>
  );
}

function CandidateDashboardPage() {
  const statsQuery = useQuery({
    queryKey: ["candidate", "stats"],
    queryFn: candidateApi.getStats,
    retry: false,
    staleTime: 30_000,
  });

  const applicationsQuery = useQuery({
    queryKey: ["candidate", "applications", "recent"],
    queryFn: () => candidateApi.getApplications({ limit: 3, sort: "recent" }),
    retry: false,
    staleTime: 30_000,
  });

  const interviewsQuery = useQuery({
    queryKey: ["candidate", "interviews", "upcoming"],
    queryFn: () => candidateApi.getInterviews({ upcoming: true, limit: 2 }),
    retry: false,
    staleTime: 30_000,
  });

  const stats = statsQuery.data || {
    appliedJobs: 0,
    pendingTasks: 0,
    upcomingInterviews: 0,
    unreadMessages: 0,
  };

  const applications = applicationsQuery.data?.data || [];
  const interviews = interviewsQuery.data?.data || [];

  return (
    <CandidateLayout
      title="Candidate Dashboard"
      subtitle="Track your job search progress"
    >
      <section className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Applied Jobs"
            value={Number(stats.appliedJobs || 0)}
            Icon={Briefcase}
          />
          <StatCard
            title="Pending Tasks"
            value={Number(stats.pendingTasks || 0)}
            Icon={CheckSquare}
          />
          <StatCard
            title="Upcoming Interviews"
            value={Number(stats.upcomingInterviews || 0)}
            Icon={Clock3}
          />
          <StatCard
            title="Unread Messages"
            value={Number(stats.unreadMessages || 0)}
            Icon={MessageCircle}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <article className="rounded-xl border border-(--dash-border) bg-(--dash-surface) p-5 shadow-(--dash-shadow)">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="m-0 text-base font-semibold text-(--dash-text)">
                Recent Applications
              </h2>
            </div>

            {applicationsQuery.isPending ? (
              <div className="space-y-2">
                <div className="h-12 animate-pulse rounded-lg bg-(--dash-accent-soft)" />
                <div className="h-12 animate-pulse rounded-lg bg-(--dash-accent-soft)" />
                <div className="h-12 animate-pulse rounded-lg bg-(--dash-accent-soft)" />
              </div>
            ) : applications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-(--dash-border) bg-(--dash-bg-elevated) p-6 text-center text-sm text-(--dash-muted)">
                No applications found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[460px] text-sm">
                  <thead>
                    <tr className="text-left text-xs text-(--dash-muted)">
                      <th className="pb-2">Job Title</th>
                      <th className="pb-2">Company</th>
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((item) => {
                      const status = normalizeAppStatus(item.status);
                      return (
                        <tr
                          key={item.id}
                          className="border-t border-(--dash-border)"
                        >
                          <td className="py-3 text-(--dash-text)">
                            {item.jobTitle || "Role"}
                          </td>
                          <td className="py-3 text-(--dash-muted)">
                            {item.companyName || "Company"}
                          </td>
                          <td className="py-3 text-(--dash-muted)">
                            {toDateLabel(item.applied_at)}
                          </td>
                          <td className="py-3">
                            <span
                              className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${STATUS_CLASS[status] || STATUS_CLASS.pending}`}
                            >
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          <article className="rounded-xl border border-(--dash-border) bg-(--dash-surface) p-5 shadow-(--dash-shadow)">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="m-0 text-base font-semibold text-(--dash-text)">
                Upcoming Interviews
              </h2>
            </div>

            {interviewsQuery.isPending ? (
              <div className="space-y-2">
                <div className="h-16 animate-pulse rounded-lg bg-(--dash-accent-soft)" />
                <div className="h-16 animate-pulse rounded-lg bg-(--dash-accent-soft)" />
              </div>
            ) : interviews.length === 0 ? (
              <div className="rounded-xl border border-dashed border-(--dash-border) bg-(--dash-bg-elevated) p-6 text-center text-sm text-(--dash-muted)">
                No interviews scheduled.
              </div>
            ) : (
              <div className="space-y-2">
                {interviews.map((item) => {
                  const type = normalizeInterviewType(
                    item.interviewBadge || item.interview_type,
                  );
                  const typeClass =
                    type === "video"
                      ? "border border-sky-200 bg-sky-50 text-sky-700"
                      : "border border-amber-200 bg-amber-50 text-amber-700";

                  return (
                    <article
                      key={item.id}
                      className="rounded-lg border border-(--dash-border) bg-(--dash-bg-elevated) p-3"
                    >
                      <p className="m-0 text-sm font-semibold text-(--dash-text)">
                        {item.jobTitle || "Interview"}
                      </p>
                      <p className="m-0 mt-1 text-xs text-(--dash-muted)">
                        {item.companyName || "Company"}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <p className="m-0 text-xs text-(--dash-muted)">
                          {toDateTimeLabel(item.scheduled_at)}
                        </p>
                        <span
                          className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${typeClass}`}
                        >
                          {type}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </article>
        </div>
      </section>
    </CandidateLayout>
  );
}
