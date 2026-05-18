import { useEffect, useState } from "react";
import MetricCard from "../../components/shared/MetricCard";
import StatusBadge from "../../components/shared/StatusBadge";
import EmptyState from "../../components/shared/EmptyState";
import {
  getOverviewMetrics,
  getUpcomingInterviews,
  getCompanyJobs,
  getWeeklyApplications,
  getHiringFunnel,
} from "@/apis/company";
import {
  Briefcase,
  FileText,
  CalendarDays,
  UserCheck,
  Clock,
} from "lucide-react";

function CompanyOverview() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [funnel, setFunnel] = useState([]);
  const [weekly, setWeekly] = useState([]);

  // normalise whatever shape the API returns into a plain array
  const toArray = (value) => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    return [];
  };

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const [metricsRes, jobsRes, interviewsRes, funnelRes, weeklyRes] =
          await Promise.all([
            getOverviewMetrics(),
            getCompanyJobs({ limit: 20 }),
            getUpcomingInterviews(),
            getHiringFunnel(),
            getWeeklyApplications(),
          ]);

        if (!mounted) return;

        setMetrics(metricsRes);
        setJobs(toArray(jobsRes?.data || jobsRes));
        setInterviews(toArray(interviewsRes));
        setFunnel(toArray(funnelRes));
        setWeekly(toArray(weeklyRes));
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  // ── derived numbers — fall back to 0 if API returns nothing ──────────────
  const activeJobs =
    metrics?.active_jobs ?? jobs.filter((j) => j.status === "open").length;
  const totalApps = metrics?.total_applications ?? 0;
  const interviewing = metrics?.interviews ?? interviews.length;
  const hires = metrics?.hires ?? 0;

  // upcoming interviews sorted soonest-first
  const upcomingInterviews = interviews
    .filter(
      (i) => i.status === "scheduled" || new Date(i.scheduled_at) > new Date(),
    )
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));

  const nextInterview = upcomingInterviews[0];

  // open jobs for the sidebar card
  const openJobs = jobs.filter((j) => j.status === "open").slice(0, 5);

  // ── loading skeleton — identical to candidate Overview ────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-orange-100 bg-white p-5 shadow-sm h-28 animate-pulse" />
          <div className="rounded-xl border border-orange-100 bg-white p-5 shadow-sm h-28 animate-pulse" />
          <div className="rounded-xl border border-orange-100 bg-white p-5 shadow-sm h-28 animate-pulse" />
          <div className="rounded-xl border border-orange-100 bg-white p-5 shadow-sm h-28 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── 4 metric cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Active Jobs" value={activeJobs} icon={Briefcase} />
        <MetricCard
          title="Total Applications"
          value={totalApps}
          icon={FileText}
        />
        <MetricCard
          title="Interviews"
          value={interviewing}
          icon={CalendarDays}
        />
        <MetricCard title="Hires" value={hires} icon={UserCheck} />
      </div>

      {/* ── 3-column middle row ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* hiring funnel */}
        <div className="rounded-xl border border-orange-100 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-600">Hiring Funnel</h3>
          <div className="mt-4 space-y-2">
            {funnel.length === 0 && (
              <p className="text-sm text-gray-500">No data yet</p>
            )}
            {funnel.map((stage) => (
              <div
                key={stage.stage || stage.status}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge status={stage.stage || stage.status} />
                  <p className="text-sm text-gray-700 capitalize">
                    {stage.stage || stage.status}
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {stage.count ?? stage.total ?? 0}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* next upcoming interview */}
        <div className="rounded-xl border border-orange-100 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-600">Next Interview</h3>
          <div className="mt-4">
            {nextInterview ? (
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {nextInterview.interview_type
                      ? `${nextInterview.interview_type} Interview`
                      : "Interview"}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {new Date(nextInterview.scheduled_at).toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {nextInterview.duration_minutes
                      ? `${nextInterview.duration_minutes} min`
                      : ""}
                  </p>
                </div>
                <div className="text-orange-600">
                  <Clock size={20} />
                </div>
              </div>
            ) : (
              <EmptyState
                title="No upcoming interviews"
                message="Nothing scheduled yet"
              />
            )}
          </div>
        </div>

        {/* open job listings */}
        <div className="rounded-xl border border-orange-100 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-600">Open Jobs</h3>
          <div className="mt-4 space-y-3">
            {openJobs.length === 0 && (
              <p className="text-sm text-gray-500">No open jobs</p>
            )}
            {openJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {job.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {job.location || "—"} ·{" "}
                    {job.is_remote ? "Remote" : "On-site"}
                  </p>
                </div>
                <div className="text-orange-600">
                  <Briefcase size={18} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── weekly applications + recent interviews activity ── */}
      <div className="rounded-xl border border-orange-100 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-medium text-gray-600">Recent Activity</h3>
        <div className="mt-4 space-y-3">
          {weekly.length === 0 && interviews.length === 0 && (
            <EmptyState
              title="No recent activity"
              message="Applications will appear here once candidates apply"
            />
          )}

          {/* weekly application entries */}
          {weekly.slice(0, 5).map((entry, idx) => (
            <div
              key={`weekly-${idx}`}
              className="flex items-center justify-between"
            >
              <div>
                <p className="text-sm text-gray-800">
                  Application received
                  {entry.job_title ? ` for ${entry.job_title}` : ""}
                </p>
                <p className="text-xs text-gray-500">
                  {entry.created_at
                    ? new Date(entry.created_at).toLocaleString()
                    : entry.date
                      ? new Date(entry.date).toLocaleString()
                      : "—"}
                </p>
              </div>
              <StatusBadge status={entry.status || "applied"} />
            </div>
          ))}

          {/* recent interviews */}
          {interviews.slice(0, 5).map((i) => (
            <div
              key={`iv-${i.id}`}
              className="flex items-center justify-between"
            >
              <div>
                <p className="text-sm text-gray-800">
                  {i.interview_type
                    ? `${i.interview_type} interview`
                    : "Interview"}{" "}
                  scheduled
                </p>
                <p className="text-xs text-gray-500">
                  {i.scheduled_at
                    ? new Date(i.scheduled_at).toLocaleString()
                    : "—"}
                </p>
              </div>
              <CalendarDays className="text-orange-600" size={18} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CompanyOverview;
