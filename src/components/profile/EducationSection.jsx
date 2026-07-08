import { useState } from "react";
import { toast } from "react-toastify";
import { GraduationCap, Pencil, Trash2, BookOpen, Award, CalendarDays, Building2 } from "lucide-react";
import { candidateApi } from "@/apis/candidate";

const inputClass =
  "h-10 w-full rounded-lg border border-orange-100 px-3 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100";

const EMPTY = {
  degree: "", institution: "", field: "",
  grade: "", start_date: "", end_date: "",
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

export default function EducationSection({ items, onUpdate }) {
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
    if (!form.degree.trim() || !form.institution.trim())
      return toast.error("Degree and institution are required");

    setSaving(true);
    try {
      if (editId) {
        const res = await candidateApi.updateEdu(editId, form);
        onUpdate(items.map((i) => (i.id === editId ? res.data : i)));
        toast.success("Education updated");
      } else {
        const res = await candidateApi.addEdu(form);
        onUpdate([res.data, ...items]);
        toast.success("Education added");
      }
      setShowForm(false);
    } catch {
      toast.error("Failed to save education");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this education entry?")) return;
    try {
      await candidateApi.deleteEdu(id);
      onUpdate(items.filter((i) => i.id !== id));
      toast.success("Education removed");
    } catch {
      toast.error("Failed to delete");
    }
  }

  return (
    <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm">

      {/* ── section header ── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Education</h2>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
        >
          + Add
        </button>
      </div>

      {/* ── add / edit form ── */}
      {showForm && (
        <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50/30 p-3 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {editId ? "Edit education" : "New education"}
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Degree</span>
              <input
                value={form.degree}
                onChange={(e) => setForm((p) => ({ ...p, degree: e.target.value }))}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Institution</span>
              <input
                value={form.institution}
                onChange={(e) => setForm((p) => ({ ...p, institution: e.target.value }))}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Field of study</span>
              <input
                value={form.field}
                onChange={(e) => setForm((p) => ({ ...p, field: e.target.value }))}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Grade / GPA</span>
              <input
                value={form.grade}
                onChange={(e) => setForm((p) => ({ ...p, grade: e.target.value }))}
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
            Currently studying here
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Activities / description</span>
            <textarea
              value={form.description}
              rows={2}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full rounded-lg border border-orange-100 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 resize-none"
            />
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
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
        <p className="text-sm text-gray-400">No education added yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-gray-100 bg-gray-50/60 overflow-hidden"
            >
              {/* card header */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <GraduationCap size={14} className="text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {item.degree}
                    {item.is_current && (
                      <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        Current
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
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
                  label={<span className="flex items-center gap-1"><Building2 size={9} />Institution</span>}
                  value={item.institution}
                />
                <Field
                  label={<span className="flex items-center gap-1"><BookOpen size={9} />Field of Study</span>}
                  value={item.field}
                />
                <Field
                  label={<span className="flex items-center gap-1"><Award size={9} />Grade / GPA</span>}
                  value={item.grade}
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