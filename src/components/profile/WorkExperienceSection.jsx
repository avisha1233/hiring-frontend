import { useState } from "react";
import { toast } from "react-toastify";
import { Briefcase, Pencil, Trash2, MapPin, Building2, Clock, CalendarDays } from "lucide-react";
import { candidateApi } from "@/apis/candidate";

const inputClass =
  "h-10 w-full rounded-lg border border-orange-100 px-3 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100";

const EMPTY = {
  title: "", company: "", type: "Full-time",
  location: "", start_date: "", end_date: "",
  is_current: false, description: "",
};

/* ─── tiny helper ─── */
function Field({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
        {label}
      </span>
      <span className="text-sm font-medium text-gray-700 leading-snug">
        {value || <span className="text-gray-300 italic">—</span>}
      </span>
    </div>
  );
}

function formatDuration(start, end, isCurrent) {
  const s = start?.slice(0, 7) ?? "";
  const e = isCurrent ? "Present" : end?.slice(0, 7) ?? "";
  if (!s && !e) return null;
  if (!s) return e;
  if (!e) return s;
  return `${s} – ${e}`;
}

export default function WorkExperienceSection({ items, onUpdate }) {
  const [form, setForm]         = useState(EMPTY);
  const [editId, setEditId]     = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);

  function openAdd() {
    setForm(EMPTY);
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(item) {
    setForm({
      ...item,
      start_date: item.start_date?.slice(0, 7) ?? "",
      end_date:   item.end_date?.slice(0, 7)   ?? "",
    });
    setEditId(item.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.company.trim())
      return toast.error("Job title and company are required");

    setSaving(true);
    try {
      if (editId) {
        const res = await candidateApi.updateWork(editId, form);
        onUpdate(items.map((i) => (i.id === editId ? res.data : i)));
        toast.success("Experience updated");
      } else {
        const res = await candidateApi.addWork(form);
        onUpdate([res.data, ...items]);
        toast.success("Experience added");
      }
      setShowForm(false);
    } catch {
      toast.error("Failed to save experience");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this experience?")) return;
    try {
      await candidateApi.deleteWork(id);
      onUpdate(items.filter((i) => i.id !== id));
      toast.success("Experience removed");
    } catch {
      toast.error("Failed to delete");
    }
  }

  return (
    <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm">

      {/* ── section header ── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Work Experience</h2>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700"
        >
          + Add
        </button>
      </div>

      {/* ── add / edit form ── */}
      {showForm && (
        <div className="mb-4 rounded-lg border border-orange-100 bg-orange-50/30 p-3 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {editId ? "Edit experience" : "New experience"}
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Job title</span>
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Company</span>
              <input
                value={form.company}
                onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Type</span>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                className={inputClass}
              >
                {["Full-time", "Part-time", "Contract", "Freelance", "Internship"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Location</span>
              <input
                value={form.location}
                onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Start date</span>
              <input
                type="month"
                value={form.start_date}
                onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
                className={inputClass}
              />
            </label>
            {!form.is_current && (
              <label className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">End date</span>
                <input
                  type="month"
                  value={form.end_date}
                  onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
                  className={inputClass}
                />
              </label>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_current}
              onChange={(e) =>
                setForm((p) => ({ ...p, is_current: e.target.checked, end_date: "" }))
              }
              className="rounded border-orange-200 text-orange-600 focus:ring-orange-400"
            />
            Currently working here
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Description</span>
            <textarea
              value={form.description}
              rows={3}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Key responsibilities and achievements..."
              className="w-full rounded-lg border border-orange-100 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 resize-none"
            />
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-orange-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── cards ── */}
      {items.length === 0 && !showForm ? (
        <p className="text-sm text-gray-400">No work experience added yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-gray-100 bg-gray-50/60 overflow-hidden"
            >
              {/* card header */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                  <Briefcase size={14} className="text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {item.title}
                    {item.is_current && (
                      <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-100">
                        Current
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                    title="Edit"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* divider */}
              <div className="h-px bg-gray-100 mx-4" />

              {/* labeled fields grid */}
              <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
                <Field
                  label={<span className="flex items-center gap-1"><Building2 size={9} />Company</span>}
                  value={item.company}
                />
                <Field
                  label={<span className="flex items-center gap-1"><Clock size={9} />Type</span>}
                  value={item.type}
                />
                <Field
                  label={<span className="flex items-center gap-1"><MapPin size={9} />Location</span>}
                  value={item.location}
                />
                <Field
                  label={<span className="flex items-center gap-1"><CalendarDays size={9} />Duration</span>}
                  value={formatDuration(item.start_date, item.end_date, item.is_current)}
                />
              </div>

              {/* description */}
              {item.description && (
                <>
                  <div className="h-px bg-gray-100 mx-4" />
                  <div className="px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
                      Description
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}