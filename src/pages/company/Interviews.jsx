import { useEffect, useState } from "react";
import StatusBadge from "../../components/shared/StatusBadge";
import EmptyState from "../../components/shared/EmptyState";
import {
  getUpcomingInterviews,
  getInterviews,
} from "@/apis/company";
import {
  CalendarDays,
  Clock,
  Video,
  MapPin,
  RotateCcw,
  CheckCircle,
  Plus,
  Search,
} from "lucide-react";

export default function Interviews() {
  const [loading, setLoading]         = useState(true);
  const [interviews, setInterviews]   = useState([]);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);

  // normalise whatever shape the API returns into a plain array
  const toArray = (value) => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.data?.data)) return value.data.data;
    return [];
  };

  async function load() {
    setLoading(true);
    try {
      const res = await getInterviews({ limit: 50 });
      setInterviews(toArray(res?.data || res));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // ── confirm an interview (PATCH status → scheduled) ───────────────────────
  async function handleConfirm(id) {
    try {
      // swap this for your real PATCH call, e.g.:
      // await apiClient.patch(`/interviews/${id}`, { status: "scheduled" });
      setInterviews((prev) =>
        prev.map((iv) =>
          iv.id === id ? { ...iv, status: "scheduled" } : iv
        )
      );
    } catch (err) {
      console.error(err);
    }
  }

  // ── reschedule — optimistically marks as rescheduled ─────────────────────
  async function handleReschedule(id) {
    try {
      // swap this for your real PATCH call, e.g.:
      // await apiClient.patch(`/interviews/${id}`, { status: "rescheduled" });
      setInterviews((prev) =>
        prev.map((iv) =>
          iv.id === id ? { ...iv, status: "rescheduled" } : iv
        )
      );
    } catch (err) {
      console.error(err);
    }
  }

  // ── filter client-side ────────────────────────────────────────────────────
  const filtered = interviews.filter((iv) => {
    const candidateName =
      iv.candidate?.name ||
      iv.candidate?.full_name ||
      iv.application?.candidate?.full_name ||
      "";
    const jobTitle =
      iv.job?.title ||
      iv.application?.job?.title ||
      "";

    const matchesSearch =
      search === "" ||
      candidateName.toLowerCase().includes(search.toLowerCase()) ||
      jobTitle.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "" || iv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // ── helpers ───────────────────────────────────────────────────────────────
  function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString([], {
      month: "short",
      day:   "numeric",
      year:  "numeric",
    });
  }

  function formatTime(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString([], {
      hour:   "2-digit",
      minute: "2-digit",
    });
  }

  function typeIcon(type) {
    if (!type) return null;
    const t = type.toLowerCase();
    if (t === "online" || t === "virtual") return <Video size={14} className="text-orange-500" />;
    return <MapPin size={14} className="text-orange-500" />;
  }

  // ── loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-orange-100 bg-white p-5 shadow-sm h-28 animate-pulse" />
          <div className="rounded-xl border border-orange-100 bg-white p-5 shadow-sm h-28 animate-pulse" />
          <div className="rounded-xl border border-orange-100 bg-white p-5 shadow-sm h-28 animate-pulse" />
          <div className="rounded-xl border border-orange-100 bg-white p-5 shadow-sm h-28 animate-pulse" />
        </div>
        <div className="rounded-xl border border-orange-100 bg-white p-6 shadow-sm h-64 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── page header: title + Schedule button ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Interviews</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage and track all candidate interviews
          </p>
        </div>
        <button
          onClick={() => setShowSchedule(true)}
          className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-600 transition-colors"
        >
          <Plus size={16} />
          Schedule Interview
        </button>
      </div>

      {/* ── quick-stat cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-orange-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{interviews.length}</p>
        </div>
        <div className="rounded-xl border border-orange-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Scheduled</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {interviews.filter((i) => i.status === "scheduled").length}
          </p>
        </div>
        <div className="rounded-xl border border-orange-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Completed</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {interviews.filter((i) => i.status === "completed").length}
          </p>
        </div>
        <div className="rounded-xl border border-orange-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Upcoming (7 days)</p>
          <p className="mt-2 text-3xl font-semibold text-orange-500">
            {interviews.filter((i) => {
              if (!i.scheduled_at) return false;
              const d = new Date(i.scheduled_at);
              const now = new Date();
              const in7 = new Date();
              in7.setDate(now.getDate() + 7);
              return d >= now && d <= in7;
            }).length}
          </p>
        </div>
      </div>

      {/* ── search + status filter ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by candidate or job…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
        >
          <option value="">All statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="rescheduled">Rescheduled</option>
        </select>
      </div>

      {/* ── interviews table ── */}
      <div className="rounded-xl border border-orange-100 bg-white shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No interviews found"
              message={
                search || statusFilter
                  ? "Try adjusting your search or filter"
                  : "Schedule your first interview using the button above"
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-orange-50 bg-orange-50/60">
                  {[
                    "Candidate",
                    "Job",
                    "Date",
                    "Time",
                    "Duration",
                    "Type",
                    "Status",
                    "Actions",
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
                {filtered.map((iv) => {
                  const candidateName =
                    iv.candidate?.name ||
                    iv.candidate?.full_name ||
                    iv.application?.candidate?.full_name ||
                    `Candidate #${iv.application_id ?? iv.id}`;

                  const jobTitle =
                    iv.job?.title ||
                    iv.application?.job?.title ||
                    `Job #${iv.job_id ?? "—"}`;

                  return (
                    <tr key={iv.id} className="hover:bg-orange-50/30 transition-colors">

                      {/* candidate */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700">
                            {candidateName
                              .split(" ")
                              .map((w) => w[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          <span className="font-medium text-gray-900">
                            {candidateName}
                          </span>
                        </div>
                      </td>

                      {/* job */}
                      <td className="px-4 py-3 text-gray-700">{jobTitle}</td>

                      {/* date */}
                      <td className="px-4 py-3 text-gray-700">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays size={13} className="text-orange-400" />
                          {formatDate(iv.scheduled_at)}
                        </div>
                      </td>

                      {/* time */}
                      <td className="px-4 py-3 text-gray-700">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-orange-400" />
                          {formatTime(iv.scheduled_at)}
                        </div>
                      </td>

                      {/* duration */}
                      <td className="px-4 py-3 text-gray-700">
                        {iv.duration_minutes ? `${iv.duration_minutes} min` : "—"}
                      </td>

                      {/* type */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 capitalize text-gray-700">
                          {typeIcon(iv.interview_type)}
                          {iv.interview_type || "—"}
                        </div>
                      </td>

                      {/* status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={iv.status} />
                      </td>

                      {/* actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleReschedule(iv.id)}
                            disabled={iv.status === "completed" || iv.status === "cancelled"}
                            className="flex items-center gap-1 rounded-lg border border-orange-200 px-2.5 py-1.5 text-xs font-medium text-orange-600 hover:bg-orange-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <RotateCcw size={12} />
                            Reschedule
                          </button>
                          <button
                            onClick={() => handleConfirm(iv.id)}
                            disabled={iv.status === "completed" || iv.status === "cancelled"}
                            className="flex items-center gap-1 rounded-lg bg-orange-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <CheckCircle size={12} />
                            Confirm
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── schedule interview modal ── */}
      {showSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md rounded-2xl border border-orange-100 bg-white p-6 shadow-xl">
            <h2 className="text-base font-semibold text-gray-900">
              Schedule Interview
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Fill in the details and hit Save.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Application ID
                </label>
                <input
                  type="number"
                  placeholder="e.g. 12"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Interviewer ID
                </label>
                <input
                  type="number"
                  placeholder="e.g. 3"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Type
                </label>
                <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100">
                  <option value="online">Online</option>
                  <option value="onsite">Onsite</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 30"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowSchedule(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // TODO: call apiClient.post("/interviews", payload) here
                  setShowSchedule(false);
                  load();
                }}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}