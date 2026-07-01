import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  Building2,
  Briefcase,
  FileText,
  CalendarDays,
  Upload,
  ShieldX,
  UserCheck,
} from "lucide-react";

import * as userService from "../../services/userService";
import * as companyService from "../../services/companyService";
import * as candidateService from "../../services/candidateService";
import * as jobService from "../../services/jobService";
import * as applicationService from "../../services/applicationService";
import * as interviewService from "../../services/interviewService";
import * as activityService from "../../services/activityService";

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function timeAgo(dateString) {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

function initials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  if (Array.isArray(value?.data?.data?.data)) return value.data.data.data;
  return [];
}

// Build weekly grouped-bar data from a list of dated records.
// Returns the last 6 weeks as W1…W6.
function buildWeeklyData(candidates, companies) {
  const now = Date.now();
  const weeks = Array.from({ length: 6 }, (_, i) => ({
    week: `W${i + 1}`,
    candidates: 0,
    companies: 0,
  }));

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;

  candidates.forEach((c) => {
    const age = now - new Date(c.created_at).getTime();
    const idx = Math.floor(age / msPerWeek);
    if (idx >= 0 && idx < 6) weeks[5 - idx].candidates += 1;
  });

  companies.forEach((c) => {
    const age = now - new Date(c.created_at).getTime();
    const idx = Math.floor(age / msPerWeek);
    if (idx >= 0 && idx < 6) weeks[5 - idx].companies += 1;
  });

  return weeks;
}

// ------------------------------------------------------------------
// Sub-components
// ------------------------------------------------------------------

function MetricCard({ label, value, icon: Icon, danger }) {
  return (
    <div className="rounded-xl border border-orange-100 bg-white p-4">
      <div
        className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg ${
          danger ? "bg-red-50" : "bg-orange-50"
        }`}
      >
        <Icon
          size={16}
          className={danger ? "text-red-500" : "text-orange-500"}
        />
      </div>
      <p className="text-xs text-gray-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-medium ${
          danger ? "text-red-500" : "text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Avatar({ name }) {
  return (
    <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full border border-orange-200 bg-orange-50 text-xs font-medium text-orange-600">
      {initials(name)}
    </div>
  );
}

// ------------------------------------------------------------------
// Main page
// ------------------------------------------------------------------

export default function Overview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [
          users,
          companies,
          candidates,
          jobs,
          applications,
          interviews,
          activities,
        ] = await Promise.all([
          userService.getUsers(),
          companyService.getCompanies(),
          candidateService.getCandidates(),
          jobService.getJobs(),
          applicationService.getApplications(),
          interviewService.getInterviews(),
          activityService.getActivities(), // { user_name, action, time }
        ]);

        setData({
          users: toArray(users?.data),
          companies: toArray(companies?.data),
          candidates: toArray(candidates?.data),
          jobs: toArray(jobs?.data),
          applications: toArray(applications?.data),
          interviews: toArray(interviews?.data),
          activities: toArray(activities?.data?.data),
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // ---- loading skeleton ----
  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-orange-100 bg-gray-100"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-sm text-red-500">
        Failed to load overview: {error}
      </div>
    );
  }

  // ---- derived values ----
  const totalUsers = data.users.length;
  const totalCompanies = data.companies.length;
  const totalJobs = data.jobs.length;
  const totalApps = data.applications.length;
  const scheduledCount = data.interviews.filter(
    (i) => i.status === "scheduled",
  ).length;
  const blockedCount = data.users.filter((u) => u.status === "blocked").length;
  const hiredThisMonth = data.applications.filter((a) => {
    const hired = a.status === "hired";
    const thisMonth =
      new Date(a.updated_at).getMonth() === new Date().getMonth();
    return hired && thisMonth;
  }).length;

  const candidateCount = data.candidates.length;
  const companyCount = data.companies.length;
  const total = candidateCount + companyCount || 1;

  const appliedCount = data.applications.filter((a) => a.status === "applied").length;
  const interviewingCount = data.applications.filter((a) => a.status === "interviewing" || a.status === "rejected").length;
  const hiredCount = data.applications.filter((a) => a.status === "hired").length;

  const pendingPct = Math.round((appliedCount / (totalApps || 1)) * 100);
  const reviewedPct = Math.round((interviewingCount / (totalApps || 1)) * 100);
  const hiredPct = Math.round((hiredCount / (totalApps || 1)) * 100);

  const chartData = buildWeeklyData(data.candidates, data.companies);

  return (
    <div className="space-y-5 p-6">
      {/* ── Row 1: core metrics ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total users" value={totalUsers} icon={Users} />
        <MetricCard label="Companies" value={totalCompanies} icon={Building2} />
        <MetricCard label="Active jobs" value={totalJobs} icon={Briefcase} />
        <MetricCard label="Applications" value={totalApps} icon={FileText} />
      </div>

      {/* ── Row 2: activity metrics ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Interviews scheduled"
          value={scheduledCount}
          icon={CalendarDays}
        />
        <MetricCard
          label="Blocked accounts"
          value={blockedCount}
          icon={ShieldX}
          danger
        />
        <MetricCard
          label="Hired this month"
          value={hiredThisMonth}
          icon={UserCheck}
        />
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Bar chart */}
        <div className="lg:col-span-2 rounded-xl border border-orange-100 bg-white p-5">
          <p className="mb-4 text-sm font-medium text-gray-900">
            Platform growth
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barCategoryGap="35%">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f3f4f6"
                vertical={false}
              />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "#fff7ed" }}
                contentStyle={{
                  border: "0.5px solid #fed7aa",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend
                iconType="square"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, color: "#9ca3af" }}
              />
              <Bar dataKey="candidates" fill="#f97316" radius={[3, 3, 0, 0]} />
              <Bar dataKey="companies" fill="#fdba74" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Breakdown */}
        <div className="rounded-xl border border-orange-100 bg-white p-5">
          <p className="mb-4 text-sm font-medium text-gray-900">
            User breakdown
          </p>

          <div className="space-y-3">
            <BarRow
              label="Candidates"
              value={candidateCount}
              pct={Math.round((candidateCount / total) * 100)}
              color="bg-orange-500"
            />
            <BarRow
              label="Companies"
              value={companyCount}
              pct={Math.round((companyCount / total) * 100)}
              color="bg-orange-300"
            />
          </div>

          <div className="mt-5 border-t border-orange-100 pt-4">
            <p className="mb-3 text-sm font-medium text-gray-900">
              Application status
            </p>
            <div className="space-y-3">
              <BarRow
                label="Pending"
                value={`${pendingPct}%`}
                pct={pendingPct}
                color="bg-orange-500"
              />
              <BarRow
                label="Reviewed"
                value={`${reviewedPct}%`}
                pct={reviewedPct}
                color="bg-orange-300"
              />
              <BarRow
                label="Hired"
                value={`${hiredPct}%`}
                pct={hiredPct}
                color="bg-green-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent activity ── */}
      <div className="rounded-xl border border-orange-100 bg-white p-5">
        <p className="mb-4 text-sm font-medium text-gray-900">
          Recent activity
        </p>
        {data.activities.length === 0 ? (
          <p className="text-sm text-gray-500">No recent activity yet.</p>
        ) : (
          <div className="divide-y divide-orange-50">
            {data.activities.slice(0, 15).map((activity, idx) => (
              <ActivityRow key={idx} activity={activity} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- small helpers ----

function BarRow({ label, value, pct, color }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium text-gray-800">{value}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ActivityRow({ activity }) {
  const actorName =
    activity.user_name ||
    activity.candidateName ||
    activity.companyName ||
    "System";
  const actionText =
    activity.action || activity.description || "Activity recorded";
  const timestamp = activity.created_at || activity.timestamp;

  return (
    <div className="flex items-center gap-3 py-2.5">
      <Avatar name={actorName} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-gray-800 leading-snug">
          <span className="font-medium">{actorName}</span> {actionText}
        </p>
        <p className="mt-0.5 text-[11px] text-gray-400">{timeAgo(timestamp)}</p>
      </div>
    </div>
  );
}
