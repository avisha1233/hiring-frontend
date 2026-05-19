import { useState } from "react";
import { toast } from "react-toastify";
import { GraduationCap, Pencil, Trash2 } from "lucide-react";
import { candidateApi } from "@/apis/candidate";

const inputClass = "h-10 w-full rounded-lg border border-orange-100 px-3 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100";

const EMPTY = {
  degree: "", institution: "", field: "",
  grade: "", start_date: "", end_date: "",
  is_current: false, description: "",
};

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

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Education</h2>
        <button type="button" onClick={openAdd}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
          + Add
        </button>
      </div>

      {showForm && (
        <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50/30 p-3 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {editId ? "Edit education" : "New education"}
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Degree</span>
              <input value={form.degree} onChange={(e) => setForm((p) => ({ ...p, degree: e.target.value }))}
                placeholder="e.g. B.Sc Computer Science" className={inputClass} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Institution</span>
              <input value={form.institution} onChange={(e) => setForm((p) => ({ ...p, institution: e.target.value }))}
                placeholder="e.g. State University" className={inputClass} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Field of study</span>
              <input value={form.field} onChange={(e) => setForm((p) => ({ ...p, field: e.target.value }))}
                placeholder="e.g. Software Engineering" className={inputClass} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Grade / GPA</span>
              <input value={form.grade} onChange={(e) => setForm((p) => ({ ...p, grade: e.target.value }))}
                placeholder="e.g. 3.8 / 4.0" className={inputClass} />
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
            Currently studying here
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Activities / description</span>
            <textarea value={form.description} rows={2}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Coursework, clubs, thesis..."
              className="w-full rounded-lg border border-orange-100 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 resize-none" />
          </label>

          <div className="flex gap-2">
            <button type="button" onClick={handleSave} disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
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
        <p className="text-sm text-gray-400">No education added yet.</p>
      ) : (
        <div>
          {items.map((item, idx) => (
            <div key={item.id} className="flex gap-3 relative">
              {idx < items.length - 1 && (
                <div className="absolute left-[13px] top-8 bottom-0 w-px bg-blue-100" />
              )}
              <div className="mt-1 w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 z-10">
                <GraduationCap size={13} className="text-blue-500" />
              </div>
              <div className="flex-1 pb-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{item.degree}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.institution}{item.grade ? ` · GPA ${item.grade}` : ""}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.start_date?.slice(0, 7)} – {item.is_current ? "Present" : item.end_date?.slice(0, 7)}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button type="button" onClick={() => openEdit(item)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600">
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