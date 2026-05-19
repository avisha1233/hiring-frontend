import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import { candidateApi } from "@/apis/candidate";
import { api } from "@/services/api";

const STATUS_STYLES = {
  scheduled: "bg-green-50 text-green-700",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-50 text-red-600",
  rescheduled: "bg-yellow-50 text-yellow-700",
};

const STATUS_LABELS = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  rescheduled: "Rescheduled",
};

const TYPE_STYLES = {
  online: "bg-pink-50 text-pink-600",
  offline: "bg-teal-50 text-teal-600",
  phone: "bg-blue-50 text-blue-600",
};

const TYPE_LABELS = {
  online: "Online",
  offline: "On-site",
  phone: "Phone",
};

function normalizeInterviewType(raw) {
  const value = String(raw || "").toLowerCase();

  if (value === "online" || value === "video") {
    return "online";
  }

  if (value === "offline" || value === "on-site" || value === "onsite") {
    return "offline";
  }

  if (value === "phone") {
    return "phone";
  }

  return value;
}

function normalizeInterviewStatus(raw) {
  return String(raw || "").toLowerCase();
}

function normalizeInterviewRow(interview) {
  const type = normalizeInterviewType(
    interview.interview_type || interview.type || interview.interviewBadge,
  );
  const status = normalizeInterviewStatus(interview.status);

  return {
    ...interview,
    interviewerName:
      interview.interviewer_name ||
      interview.interviewerName ||
      interview.interviewer?.name ||
      interview.interviewer?.full_name ||
      interview.interviewer?.fullName ||
      interview.interviewer?.email ||
      "",
    interviewerRole:
      interview.interviewer_role ||
      interview.interviewerRole ||
      interview.interviewer?.role ||
      "",
    jobTitle:
      interview.job_title ||
      interview.jobTitle ||
      interview.job?.title ||
      interview.application?.job?.title ||
      "",
    companyName:
      interview.company_name ||
      interview.companyName ||
      interview.job?.company?.name ||
      interview.application?.job?.company?.name ||
      "",
    scheduledAt:
      interview.scheduled_at ||
      interview.scheduledAt ||
      interview.interview_at ||
      interview.interviewAt ||
      "",
    durationMinutes:
      interview.duration_minutes ||
      interview.durationMinutes ||
      interview.duration ||
      null,
    type,
    status,
    notes:
      interview.notes ||
      interview.note ||
      interview.remarks ||
      interview.feedback ||
      "",
    feedback:
      interview.feedback ||
      interview.review ||
      interview.feedback_text ||
      interview.reviewer_feedback ||
      interview.notes ||
      "",
    meetingLink:
      interview.meeting_link ||
      interview.meetingLink ||
      interview.meeting_url ||
      interview.join_url ||
      "",
  };
}

function handleJoin(interview) {
  if (interview.meetingLink) {
    window.open(interview.meetingLink, "_blank");
  } else {
    toast.info("No meeting link available yet");
  }
}

export default function Interviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [activeFeedback, setActiveFeedback] = useState(null);

  useEffect(() => {
    loadInterviews();
  }, []);

  async function handleCancel(id) {
    if (!window.confirm("Cancel this interview?")) return;

    try {
      await api.patch(`/interviews/${id}`, { status: "cancelled" });
      setInterviews((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: "cancelled" } : i)),
      );
      toast.success("Interview cancelled");
    } catch {
      toast.error("Failed to cancel interview");
    }
  }

  async function loadInterviews() {
    setLoading(true);
    try {
      const res = await candidateApi.getInterviews();
      const payload = res?.data;
      const data = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

      setInterviews(data.map(normalizeInterviewRow));
    } catch {
      toast.error("Failed to load interviews");
    } finally {
      setLoading(false);
    }
  }

  const tabs = ["All", "Scheduled", "Completed", "Cancelled"];

  const filtered =
    filter === "All"
      ? interviews
      : interviews.filter((i) => i.status === filter.toLowerCase());

  if (loading) return <LoadingSkeleton rows={5} columns={9} />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
        <p className="text-sm text-gray-500">
          Track your upcoming and past interviews
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          {
            label: "Total",
            value: interviews.length,
            color: "bg-gray-50 text-gray-700",
          },
          {
            label: "Scheduled",
            value: interviews.filter((i) => i.status === "scheduled").length,
            color: "bg-green-50 text-green-700",
          },
          {
            label: "Completed",
            value: interviews.filter((i) => i.status === "completed").length,
            color: "bg-blue-50 text-blue-700",
          },
          {
            label: "Cancelled",
            value: interviews.filter((i) => i.status === "cancelled").length,
            color: "bg-red-50 text-red-700",
          },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl p-4 ${color}`}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="mt-0.5 text-sm">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === tab
                ? "bg-orange-600 text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-orange-100 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-400">No interviews found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-orange-50 bg-orange-50/60">
                {[
                  "Interviewer",
                  "Job",
                  "Scheduled At",
                  "Duration",
                  "Type",
                  "Status",
                  "Notes",
                  "Feedback",
                  "Action",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((interview) => (
                <tr
                  key={interview.id}
                  className="transition-colors hover:bg-orange-50/30"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">
                      {interview.interviewerName || "—"}
                    </p>
                    {interview.interviewerRole && (
                      <p className="mt-0.5 text-xs text-gray-400">
                        {interview.interviewerRole}
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <p className="max-w-[160px] truncate font-medium text-gray-800">
                      {interview.jobTitle || "—"}
                    </p>
                    {interview.companyName && (
                      <p className="mt-0.5 text-xs text-gray-400">
                        {interview.companyName}
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-3 text-gray-600">
                    {interview.scheduledAt ? (
                      <>
                        <p>{new Date(interview.scheduledAt).toLocaleDateString()}</p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {new Date(interview.scheduledAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="px-4 py-3 text-gray-600">
                    {interview.durationMinutes
                      ? `${interview.durationMinutes} min`
                      : "—"}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        TYPE_STYLES[interview.type] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {TYPE_LABELS[interview.type] || interview.type || "—"}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        STATUS_STYLES[interview.status] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {STATUS_LABELS[interview.status] || interview.status || "—"}
                    </span>
                  </td>

                  <td className="max-w-[200px] px-4 py-3 text-gray-500">
                    <p className="truncate text-xs">{interview.notes || "—"}</p>
                  </td>

                  <td className="px-4 py-3">
                    {interview.feedback ? (
                      <button
                        type="button"
                        onClick={() => setActiveFeedback(interview)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                      >
                        View feedback
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">No feedback yet</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {interview.status === "scheduled" && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleJoin(interview)}
                          className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700"
                        >
                          Join
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancel(interview.id)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {activeFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Interview feedback
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {activeFeedback.jobTitle || "Interview"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveFeedback(null)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Feedback
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                  {activeFeedback.feedback || "No feedback provided."}
                </p>
              </div>

              {activeFeedback.notes &&
                activeFeedback.notes !== activeFeedback.feedback && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      Notes
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                      {activeFeedback.notes}
                    </p>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
