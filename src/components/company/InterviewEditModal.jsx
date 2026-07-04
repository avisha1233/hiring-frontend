import { useEffect, useState } from "react";
import { X } from "lucide-react";

const formatDateValue = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

const formatTimeValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return date.toTimeString().slice(0, 5);
};

function InterviewEditModal({
  open,
  interview,
  onClose,
  onSubmit,
  submitting = false,
  error = "",
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [meetingLink, setMeetingLink] = useState("");
  const [status, setStatus] = useState("scheduled");

  useEffect(() => {
    if (!open || !interview) return;

    if (interview.scheduled_at) {
      setDate(formatDateValue(interview.scheduled_at));
      setTime(formatTimeValue(interview.scheduled_at));
    }
    setDurationMinutes(interview.duration_minutes || 30);
    setMeetingLink(interview.meeting_link || "");
    setStatus(interview.status || "scheduled");
  }, [open, interview]);

  if (!open || !interview) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!date || !time) {
      return;
    }

    const scheduledAt = new Date(`${date}T${time}`);

    await onSubmit(interview.id, {
      scheduled_at: scheduledAt.toISOString(),
      duration_minutes: Number(durationMinutes),
      meeting_link: meetingLink || null,
      status: status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Edit Interview</h2>
            <p className="mt-1 text-sm text-gray-500">
              Update the interview schedule and details.
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <label className="space-y-1 text-sm font-medium text-gray-700">
              <span>Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
              >
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
          </div>

          <label className="space-y-1 text-sm font-medium text-gray-700">
            <span>Meeting Link (optional)</span>
            <input
              type="url"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
              placeholder="https://..."
            />
          </label>

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

export default InterviewEditModal;
