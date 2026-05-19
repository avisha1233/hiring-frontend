import { useState } from "react";
import { toast } from "react-toastify";
import { Briefcase, Pencil, Trash2 } from "lucide-react";
import { candidateApi } from "@/apis/candidate";

const inputClass = "h-10 w-full rounded-lg border border-orange-100 px-3 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100";

const EMPTY = {
  title: "", company: "", type: "Full-time",
  location: "", start_date: "", end_date: "",
  is_current: false, description: "",
};

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

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Work experience</h2>
        <button type="button" onClick={openAdd}
          className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700">
          + Add
        </button>
      </div>

      {showForm && (
        <div className="mb-4 rounded-lg border border-orange-100 bg-orange-50/30 p-3 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {editId ? "Edit experience" : "New experience"}
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Job title</span>
              <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Frontend Developer" className={inputClass} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Company</span>
              <input value={form.company} onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                placeholder="e.g. Acme Corp" className={inputClass} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Type</span>
              <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                className={inputClass}>
                {["Full-time", "Part-time", "Contract", "Freelance", "Internship"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Location</span>
              <input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                placeholder="e.g. Remote" className={inputClass} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Start date</span>
              <input type="month" value={form.start_date}
                onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
                className={inputClass} />
            </label>
            {!form.is_current && (
              <label className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">End date</span>
                <input type="month" value={form.end_date}
                  onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
                  className={inputClass} />
              </label>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={form.is_current}
              onChange={(e) => setForm((p) => ({ ...p, is_current: e.target.checked, end_date: "" }))}
              className="rounded border-orange-200 text-orange-600 focus:ring-orange-400" />
            Currently working here
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Description</span>
            <textarea value={form.description} rows={3}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Key responsibilities and achievements..."
              className="w-full rounded-lg border border-orange-100 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 resize-none" />
          </label>

          <div className="flex gap-2">
            <button type="button" onClick={handleSave} disabled={saving}
              className="rounded-lg bg-orange-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-60">
              {saving ? "Saving..." : "Save"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {items.length === 0 && !showForm ? (
        <p className="text-sm text-gray-400">No work experience added yet.</p>
      ) : (
        <div className="space-y-0">
          {items.map((item, idx) => (
            <div key={item.id} className="flex gap-3 relative">
              {idx < items.length - 1 && (
                <div className="absolute left-[13px] top-8 bottom-0 w-px bg-orange-100" />
              )}
              <div className="mt-1 w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0 z-10">
                <Briefcase size={13} className="text-orange-500" />
              </div>
              <div className="flex-1 pb-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {item.title}
                      {item.is_current && (
                        <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700">
                          Current
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.company} · {item.type}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.start_date?.slice(0, 7)} – {item.is_current ? "Present" : item.end_date?.slice(0, 7)}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button type="button" onClick={() => openEdit(item)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-orange-50 hover:text-orange-600">
                      <Pencil size={13} />
                    </button>
                    <button type="button" onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {item.description && (
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}