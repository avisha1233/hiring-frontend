// src/pages/company/Skills.jsx
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { apiClient } from "@/apis/api";
import { Plus, Trash2, Pencil, X, Check, Layers, ChevronDown } from "lucide-react";

// ── Modal Component ────────────────────────────────────────────────────────────
function SkillModal({ isOpen, onClose, onSave, initial = null }) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm(
        initial
          ? { name: initial.name, description: initial.description || "" }
          : { name: "", description: "" }
      );
    }
  }, [isOpen, initial]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Skill name is required");
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    /* backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between border-b border-orange-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-orange-600" />
            <h2 className="text-base font-semibold text-gray-900">
              {isEdit ? "Edit Skill" : "Add New Skill"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {/* Skill Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Skill Name <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. React.js"
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>



          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Brief description of this skill…"
              rows={3}
              className="w-full resize-none rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          {/* actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60 transition"
            >
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Check size={15} />
              )}
              {isEdit ? "Save Changes" : "Add Skill"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function CompanySkills() {
  const [skills, setSkills]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modalOpen, setModalOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = create, skill obj = edit

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const res  = await apiClient.get("/skills");
      const data = res?.data?.data || res?.data || [];
      setSkills(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load skills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSkills(); }, []);

  const openCreate = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit   = (skill) => { setEditTarget(skill); setModalOpen(true); };
  const closeModal = () => setModalOpen(false);

  const handleSave = async (form) => {
    if (editTarget) {
      // ── update ──────────────────────────────────────────────────────────────
      const res     = await apiClient.patch(`/skills/${editTarget.id}`, form);
      const updated = res?.data?.data || res?.data || res;
      setSkills((prev) => prev.map((s) => (s.id === editTarget.id ? { ...s, ...form } : s)));
      toast.success("Skill updated");
    } else {
      // ── create ──────────────────────────────────────────────────────────────
      const res     = await apiClient.post("/skills", form);
      const created = res?.data?.data || res?.data || res;
      setSkills((prev) => [created, ...prev]);
      toast.success("Skill added");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this skill?")) return;
    try {
      await apiClient.delete(`/skills/${id}`);
      setSkills((prev) => prev.filter((s) => s.id !== id));
      toast.success("Skill deleted");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete skill");
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Skills Library</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage the skills available across your job listings.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-orange-700 transition"
        >
          <Plus size={16} />
          Add Skill
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-orange-100 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-10 w-full animate-pulse rounded-lg bg-orange-50" />
            ))}
          </div>
        ) : skills.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Layers size={36} className="text-orange-200" />
            <p className="text-sm text-gray-400">No skills yet.</p>
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
            >
              <Plus size={15} />
              Add your first skill
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-orange-50 bg-orange-50/60">
                {["#", "Skill Name", "Description", "Actions"].map((h) => (
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
              {skills.map((skill, idx) => (
                <tr key={skill.id} className="hover:bg-orange-50/30 transition-colors">
                  <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{skill.name}</td>

                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                    {skill.description || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(skill)}
                        className="flex items-center gap-1 rounded-lg border border-orange-100 px-2.5 py-1.5 text-xs font-medium text-orange-600 hover:bg-orange-50 transition-colors"
                      >
                        <Pencil size={12} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(skill.id)}
                        className="flex items-center gap-1 rounded-lg border border-red-100 px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      <SkillModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSave={handleSave}
        initial={editTarget}
      />
    </div>
  );
}
