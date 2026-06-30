import { useEffect, useMemo, useState } from "react";
import StatusBadge from "../../components/shared/StatusBadge";
import EmptyState from "../../components/shared/EmptyState";
import { getInterviews } from "@/apis/company";
import { getCompanyProfile } from "@/apis/company";
import { getAuthUser } from "../../lib/auth";
import { api } from "../../services/api";
import {
  CalendarDays,
  Clock,
  Video,
  MapPin,
  RotateCcw,
  CheckCircle,
  Search,
} from "lucide-react";

export default function Interviews() {
  const authUser = getAuthUser();

  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("scheduled");
  const [showSchedule, setShowSchedule] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationSearch, setApplicationSearch] = useState("");
  const [applicationPickerOpen, setApplicationPickerOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    application_id: "",
    interview_type: "online",
    scheduled_at: "",
    duration_minutes: "30",
  });

  const toArray = (value) => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.data?.data)) return value.data.data;
    return [];
  };

  const applicationOptions = useMemo(() => {
    return applications.map((app) => {
      const candidateName =
        [app.candidate?.first_name, app.candidate?.last_name]
          .filter(Boolean)
          .join(" ") ||
        app.candidate?.name ||
        app.candidate?.full_name ||
        app.candidate_name ||
        `Candidate #${app.candidate_id}`;

      const jobTitle = app.job?.title || app.job_title || `Job #${app.job_id}`;

      return {
        ...app,
        label: `${candidateName} – ${jobTitle}`,
        candidateName,
        jobTitle,
      };
    });
  }, [applications]);

  const filteredApplications = useMemo(() => {
    const query = applicationSearch.trim().toLowerCase();
    if (!query) return applicationOptions;
    return applicationOptions.filter((app) =>
      app.label.toLowerCase().includes(query),
    );
  }, [applicationOptions, applicationSearch]);

  const resetForm = () => {
    setForm({
      application_id: "",
      interview_type: "online",
      scheduled_at: "",
      duration_minutes: "30",
    });
    setApplicationSearch("");
    setSelectedApplication(null);
    setApplicationPickerOpen(false);
    setFormError("");
  };

  const loadApplications = async (resolvedCompanyId) => {
    if (!resolvedCompanyId) return;
    setApplicationsLoading(true);
    try {
      const response = await api.get("/applications", {
        params: { company_id: resolvedCompanyId },
      });
      const data = response?.data?.data || response?.data || response || [];
      setApplications(toArray(data));
    } catch {
      setApplications([]);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const handleOpenSchedule = () => {
    setShowSchedule(true);
    setFormError("");
    loadApplications(companyId || authUser?.company_id || authUser?.id);
  };

  const handleCloseSchedule = () => {
    setShowSchedule(false);
    resetForm();
  };

  const handleScheduleSubmit = async () => {
    if (!form.application_id) {
      setFormError("Please select a candidate.");
      return;
    }
    if (!form.scheduled_at) {
      setFormError("Please pick a date and time.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      await api.post("/interviews", {
        application_id: Number(form.application_id),
        interviewer_id: Number(authUser?.id),
        interview_type: form.interview_type,
        scheduled_at: form.scheduled_at,
        duration_minutes: Number(form.duration_minutes),
      });
      handleCloseSchedule();
      load();
    } catch (error) {
      setFormError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to schedule interview.",
      );
    } finally {
      setSubmitting(false);
    }
  };

async function load() {
    setLoading(true);
    try {
      // Fetch scheduled interviews only
      const res = await getInterviews({ status: "scheduled", limit: 50 });
      // Extract array of interviews from possible nested structures
      const interviewsArray = (() => {
        if (Array.isArray(res?.data?.data?.data)) return res.data.data.data;
        if (Array.isArray(res?.data?.data)) return res.data.data;
        if (Array.isArray(res?.data)) return res.data;
        if (Array.isArray(res?.data?.rows)) return res.data.rows;
        if (Array.isArray(res?.interviews)) return res.interviews;
        return [];
      })();
      setInterviews(interviewsArray);

      // Fetch company profile to display company name
      const profile = await getCompanyProfile();
      const comp = profile?.data?.data || profile?.data || profile || {};
      setCompanyName(comp.name || comp.company_name || "");
    } catch {
      // silent on error
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    async function resolveCompany() {
      if (!authUser?.id) return;
      try {
        const profile = await getCompanyProfile();
        const company = profile?.data?.data || profile?.data || profile || {};
        const resolvedId = Number(
          company?.id || company?.company_id || authUser?.company_id || authUser?.id,
        );
        if (resolvedId) {
          setCompanyId(resolvedId);
          loadApplications(resolvedId);
        }
      } catch {
        const resolvedId = Number(authUser?.company_id || authUser?.id);
        if (resolvedId) {
          setCompanyId(resolvedId);
          loadApplications(resolvedId);
        }
      }
    }
    resolveCompany();
  }, [authUser?.id]);

  async function handleConfirm(id) {
    try {
      await api.patch(`/interviews/${id}`, { status: "scheduled" });
      setInterviews((prev) =>
        prev.map((iv) => (iv.id === id ? { ...iv, status: "scheduled" } : iv)),
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function handleReschedule(id) {
    try {
      await api.patch(`/interviews/${id}`, { status: "rescheduled" });
      setInterviews((prev) =>
        prev.map((iv) =>
          iv.id === id ? { ...iv, status: "rescheduled" } : iv,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  }

  const filtered = interviews.filter((iv) => {
    const candidateName =
      iv.candidate?.name ||
      iv.candidate?.full_name ||
      iv.application?.candidate?.full_name ||
      "";
    const jobTitle = iv.job?.title || iv.application?.job?.title || "";
    const matchesSearch =
      search === "" ||
      candidateName.toLowerCase().includes(search.toLowerCase()) ||
      jobTitle.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "" || iv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const now = new Date();
  const in7 = new Date();
  in7.setDate(now.getDate() + 7);

  const stats = {
    total: interviews.length,
    scheduled: interviews.filter((iv) => iv.status === "scheduled").length,
    completed: interviews.filter((iv) => iv.status === "completed").length,
    upcoming: interviews.filter((iv) => {
      const d = new Date(iv.scheduled_at);
      return d >= now && d <= in7;
    }).length,
  };

  function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatTime(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function typeIcon(type) {
    if (!type) return null;
    const t = type.toLowerCase();
    if (t === "online" || t === "virtual")
      return <Video size={14} className="text-orange-500" />;
    return <MapPin size={14} className="text-orange-500" />;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-orange-100 bg-white p-5 shadow-sm"
            />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl border border-orange-100 bg-white p-6 shadow-sm" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Interviews</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Manage and track all candidate interviews
          </p>
        </div>
        <button
          onClick={handleOpenSchedule}
          className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
        >
          + Schedule Interview
        </button>
      </div>

      {/* stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "TOTAL", value: stats.total },
          { label: "SCHEDULED", value: stats.scheduled },
          { label: "COMPLETED", value: stats.completed },
          { label: "UPCOMING (7 DAYS)", value: stats.upcoming },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-orange-100 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {s.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-orange-500">{s.value}</p>
          </div>
        ))}
      </div>

      {/* search + filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
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
          <option value="pending">Pending</option>
          <option value="scheduled">Scheduled</option>
          <option value="rescheduled">Rescheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-xl border border-orange-100 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <EmptyState
            title="No interviews found"
            message={
              search || statusFilter
                ? "Try adjusting your search or filter"
                : "Schedule your first interview using the button above"
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-orange-50 bg-orange-50/60">
                  {["Candidate","Job","Company","Date","Time","Duration","Type","Status","Actions"].map((h) => (
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
                    <tr
                      key={iv.id}
                      className="transition-colors hover:bg-orange-50/30"
                    >
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
                      <td className="px-4 py-3 text-gray-700">{jobTitle}</td>
                      <td className="px-4 py-3 text-gray-700">{companyName}</td>
                      <td className="px-4 py-3 text-gray-700">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays size={13} className="text-orange-400" />
                          {formatDate(iv.scheduled_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-orange-400" />
                          {formatTime(iv.scheduled_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {iv.duration_minutes
                          ? `${iv.duration_minutes} min`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 capitalize text-gray-700">
                          {typeIcon(iv.interview_type)}
                          {iv.interview_type || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={iv.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleReschedule(iv.id)}
                            disabled={
                              iv.status === "completed" ||
                              iv.status === "cancelled"
                            }
                            className="flex items-center gap-1 rounded-lg border border-orange-200 px-2.5 py-1.5 text-xs font-medium text-orange-600 transition-colors hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <RotateCcw size={12} />
                            Reschedule
                          </button>
                          <button
                            onClick={() => handleConfirm(iv.id)}
                            disabled={
                              iv.status === "completed" ||
                              iv.status === "cancelled"
                            }
                            className="flex items-center gap-1 rounded-lg bg-orange-500 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
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

      {/* schedule modal */}
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
              {/* Candidate searchable picker */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Candidate
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search candidate or job title…"
                    value={applicationSearch}
                    onChange={(e) => {
                      setApplicationSearch(e.target.value);
                      setForm((prev) => ({ ...prev, application_id: "" }));
                      setSelectedApplication(null);
                      setApplicationPickerOpen(true);
                    }}
                    onFocus={() => setApplicationPickerOpen(true)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
                  />
                  {applicationPickerOpen && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-md">
                      {applicationsLoading ? (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          Loading…
                        </div>
                      ) : filteredApplications.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          No applications found.
                        </div>
                      ) : (
                        filteredApplications.map((app) => (
                          <button
                            key={app.id}
                            type="button"
                            onClick={() => {
                              setForm((prev) => ({
                                ...prev,
                                application_id: String(app.id),
                              }));
                              setApplicationSearch(app.label);
                              setSelectedApplication(app);
                              setApplicationPickerOpen(false);
                            }}
                            className="block w-full border-b border-gray-100 px-3 py-2 text-left text-sm text-gray-700 last:border-b-0 hover:bg-orange-50"
                          >
                            <div className="font-medium text-gray-900">
                              {app.candidateName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {app.jobTitle}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Type
                </label>
                <select
                  value={form.interview_type}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      interview_type: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
                >
                  <option value="online">Online</option>
                  <option value="onsite">Onsite</option>
                </select>
              </div>

              {/* Date & Time */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      scheduled_at: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 30"
                  value={form.duration_minutes}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      duration_minutes: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
                />
              </div>

              {/* Error */}
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleCloseSchedule}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleSubmit}
                disabled={submitting}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
