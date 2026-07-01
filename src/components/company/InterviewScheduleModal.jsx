import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

const DEFAULT_DURATION = 30;

const formatDateValue = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

function InterviewScheduleModal({
  open,
  application,
  onClose,
  onSubmit,
  submitting = false,
  error = "",
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [mode, setMode] = useState("online");
  const [interviewerName, setInterviewerName] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(DEFAULT_DURATION);

  const title = useMemo(() => {
    if (!application) return "Schedule Interview";
    const candidateName =
      application.candidate?.full_name ||
      application.candidate?.name ||
      application.candidate_name ||
      `Candidate #${application.candidate_id}`;
    const jobTitle = application.job?.title || application.job_title || null;
    return jobTitle
      ? `Schedule Interview for ${candidateName} - ${jobTitle}`
      : `Schedule Interview for ${candidateName}`;
  }, [application]);

  useEffect(() => {
    if (!open) return;

    const now = new Date();
    setDate(formatDateValue(now));
    setTime(now.toTimeString().slice(0, 5));
    setMode("online");
    setInterviewerName("");
    setDurationMinutes(DEFAULT_DURATION);
  }, [open]);

  if (!open || !application) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!date || !time || !interviewerName.trim()) {
      return;
    }

    const scheduledAt = new Date(`${date}T${time}`);

    await onSubmit({
      application_id: Number(application.id),
      interviewer_name: interviewerName.trim(),
      interview_type: mode,
      scheduled_at: scheduledAt.toISOString(),
      duration_minutes: Number(durationMinutes),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <p className="mt-1 text-sm text-gray-500">
              Choose the interview details and save the schedule.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-medium text-gray-700">
              <span>Date</span>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
              />
            </label>
            <label className="space-y-1 text-sm font-medium text-gray-700">
              <span>Time</span>
              <input
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
              />
            </label>
          </div>

          <label className="space-y-1 text-sm font-medium text-gray-700">
            <span>Interviewer Name</span>
            <input
              type="text"
              value={interviewerName}
              onChange={(event) => setInterviewerName(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
              placeholder="Enter interviewer name"
              required
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-medium text-gray-700">
              <span>Interview Type</span>
              <select
                value={mode}
                onChange={(event) => setMode(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
              >
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </label>

            <label className="space-y-1 text-sm font-medium text-gray-700">
              <span>Duration (minutes)</span>
              <input
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
                placeholder="Duration in minutes"
              />
            </label>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InterviewScheduleModal;
