import { useEffect, useState } from "react";
import MetricCard from "../../components/shared/MetricCard";
import StatusBadge from "../../components/shared/StatusBadge";
import EmptyState from "../../components/shared/EmptyState";
import { candidateApi } from "@/apis/candidate";
import { api } from "@/services/api";
import { getAuthUser } from "@/lib/auth";
import {
  Users,
  CalendarDays,
  CheckSquare,
  FileText,
  Clock,
} from "lucide-react";

export default function Overview() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  const user = getAuthUser();
  const userId = user?.id;

  const toArray = (value) => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.submissions)) return value.submissions;
    if (Array.isArray(value?.data)) return value.data;
    return [];
  };

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const [appsRes, interviewsRes, tasksRes, subsRes] = await Promise.all([
          candidateApi.getApplications({ candidate_id: userId }),
          candidateApi.getInterviews({ candidate_id: userId }),
          candidateApi.getTasks({ candidate_id: userId }),
          api.get(`/submissions`, { params: { user_id: userId } }),
        ]);

        if (!mounted) return;

        setApplications(toArray(appsRes.data || appsRes));
        setInterviews(toArray(interviewsRes.data || interviewsRes));
        setTasks(toArray(tasksRes.data || tasksRes));
        setSubmissions(toArray(subsRes.data || subsRes));
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (userId) load();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const totalApplications = applications.length;
  const upcomingInterviews = interviews.filter(
    (i) => new Date(i.date) > new Date(),
  );
  const pendingTasks = tasks.filter((t) => t.status !== "done");
  const totalSubmissions = submissions.length;

  // pipeline grouping by status
  const pipeline = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});

  const nextInterview = upcomingInterviews.sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  )[0];

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Applications"
          value={totalApplications}
          icon={FileText}
        />
        <MetricCard
          title="Upcoming Interviews"
          value={upcomingInterviews.length}
          icon={CalendarDays}
        />
        <MetricCard
          title="Pending Tasks"
          value={pendingTasks.length}
          icon={CheckSquare}
        />
        <MetricCard title="Submissions" value={totalSubmissions} icon={Users} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-orange-100 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-600">Pipeline</h3>
          <div className="mt-4 space-y-2">
            {Object.keys(pipeline).length === 0 && (
              <p className="text-sm text-gray-500">No applications yet</p>
            )}
            {Object.entries(pipeline).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusBadge status={status} />
                  <p className="text-sm text-gray-700">{status}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">{count}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-orange-100 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-600">Next Interview</h3>
          <div className="mt-4">
            {nextInterview ? (
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {nextInterview.title || "Interview"}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {new Date(nextInterview.date).toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {nextInterview.location || ""}
                  </p>
                </div>
                <div className="text-orange-600">
                  <Clock size={20} />
                </div>
              </div>
            ) : (
              <EmptyState
                title="No upcoming interviews"
                message="You're all clear for now"
              />
            )}
          </div>
        </div>

        <div className="rounded-xl border border-orange-100 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-600">Pending Tasks</h3>
          <div className="mt-4 space-y-3">
            {pendingTasks.length === 0 && (
              <p className="text-sm text-gray-500">No pending tasks</p>
            )}
            {pendingTasks.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{t.title}</p>
                  <p className="text-xs text-gray-500">
                    Due:{" "}
                    {t.due_date
                      ? new Date(t.due_date).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
                <div className="text-orange-600">
                  <Clock size={18} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-orange-100 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-medium text-gray-600">Recent Activity</h3>
        <div className="mt-4 space-y-3">
          {applications.length === 0 &&
            submissions.length === 0 &&
            interviews.length === 0 && (
              <EmptyState
                title="No recent activity"
                message="You haven't taken any actions yet"
              />
            )}

          {applications.slice(0, 5).map((a) => (
            <div
              key={`app-${a.id}`}
              className="flex items-center justify-between"
            >
              <div>
                <p className="text-sm text-gray-800">
                  Applied to {a.job_title || a.job?.title || "a job"}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(
                    a.created_at || a.created_at || a.date,
                  ).toLocaleString()}
                </p>
              </div>
              <StatusBadge status={a.status} />
            </div>
          ))}

          {submissions.slice(0, 5).map((s) => (
            <div
              key={`sub-${s.id}`}
              className="flex items-center justify-between"
            >
              <div>
                <p className="text-sm text-gray-800">
                  Submitted {s.type || "file"}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(s.created_at).toLocaleString()}
                </p>
              </div>
              <FileText className="text-orange-600" />
            </div>
          ))}

          {interviews.slice(0, 5).map((i) => (
            <div
              key={`int-${i.id}`}
              className="flex items-center justify-between"
            >
              <div>
                <p className="text-sm text-gray-800">
                  {i.title || "Interview"}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(i.date).toLocaleString()}
                </p>
              </div>
              <CalendarDays className="text-orange-600" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
