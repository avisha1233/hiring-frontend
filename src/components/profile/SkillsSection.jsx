import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Pencil, Trash2, Check, X, Plus, Zap } from "lucide-react";
import axiosApi from "../../api/axios";

// ─── constants ───────────────────────────────────────────────────────────────

const LEVELS = ["Beginner", "Intermediate", "Advanced"];

const LEVEL_STYLE = {
  Beginner:     "bg-gray-100   text-gray-600",

  Intermediate: "bg-yellow-100 text-yellow-700",
  Advanced:     "bg-orange-100 text-orange-700",
  
};

const inputClass =
  "h-9 w-full rounded-lg border border-orange-100 px-3 text-sm outline-none " +
  "focus:border-orange-400 focus:ring-1 focus:ring-orange-100 bg-white";

const selectClass =
  "h-9 w-full rounded-lg border border-orange-100 px-2 text-sm outline-none " +
  "focus:border-orange-400 focus:ring-1 focus:ring-orange-100 bg-white";

// ─── helpers ─────────────────────────────────────────────────────────────────

function LevelPill({ level }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        LEVEL_STYLE[level] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {level}
    </span>
  );
}

// ─── component ───────────────────────────────────────────────────────────────

export default function SkillsSection() {
  const [skills, setSkills]           = useState([]);   // all available skills from GET /skills
  const [rows, setRows]               = useState([]);   // candidate's current skills
  const [loading, setLoading]         = useState(true);
  const candidateIdRef                = useRef(null);   // cached from GET /candidates/me

  // inline-edit state  (editId = candidate-skill id being edited)
  const [editId, setEditId]           = useState(null);
  const [editForm, setEditForm]       = useState({ level: "", years_of_experience: "" });

  // add-skill form
  const [showAdd, setShowAdd]         = useState(false);
  const [addForm, setAddForm]         = useState({ skill_id: "", level: LEVELS[2], years_of_experience: "" });
  const [saving, setSaving]           = useState(false);

  // ── load ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const [meRes, skillsRes] = await Promise.all([
          axiosApi.get("/candidates/me"),
          axiosApi.get("/skills"),
        ]);

        if (!alive) return;

        const me              = meRes.data ?? {};
        const candidateSkills = me.CandidateSkills ?? me.candidateSkills ?? [];
        const allSkills       = Array.isArray(skillsRes.data) ? skillsRes.data : [];

        candidateIdRef.current = me.id ?? null;
        setRows(candidateSkills);
        setSkills(allSkills);
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to load skills");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, []);

  // ── add ─────────────────────────────────────────────────────────────────────
  async function handleAdd() {
    if (!addForm.skill_id) return toast.error("Please select a skill");
    if (!addForm.level)    return toast.error("Please select a level");

    const yoe = Number(addForm.years_of_experience);
    if (isNaN(yoe) || yoe < 0) return toast.error("Enter valid years of experience");

    // duplicate guard
    const alreadyHas = rows.some((r) => String(r.skill_id ?? r.Skill?.id) === String(addForm.skill_id));
    if (alreadyHas) return toast.error("You already have this skill listed");

    setSaving(true);
    try {
      // Resolve candidate_id — use cached value, fall back to a fresh GET
      let candidateId = candidateIdRef.current;
      if (!candidateId) {
        const meRes  = await axiosApi.get("/candidates/me");
        candidateId  = meRes.data?.id;
        candidateIdRef.current = candidateId;
      }

      const res = await axiosApi.post("/candidate-skills", {
        candidate_id:       candidateId,
        skill_id:           Number(addForm.skill_id),
        level:              addForm.level,
        years_of_experience: yoe,
      });

      const newRow = res.data;
      // attach Skill name if backend doesn't return it
      if (!newRow.Skill) {
        const skillObj = skills.find((s) => String(s.id) === String(addForm.skill_id));
        newRow.Skill = { name: skillObj?.name ?? "" };
      }

      setRows((prev) => [newRow, ...prev]);
      setAddForm({ skill_id: "", level: LEVELS[2], years_of_experience: "" });
      setShowAdd(false);
      toast.success("Skill added");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add skill");
    } finally {
      setSaving(false);
    }
  }

  // ── edit ────────────────────────────────────────────────────────────────────
  function startEdit(row) {
    setEditId(row.id);
    setEditForm({
      level:              row.level ?? LEVELS[2],
      years_of_experience: String(row.years_of_experience ?? ""),
    });
    setShowAdd(false);
  }

  function cancelEdit() {
    setEditId(null);
  }

  async function handleSave(id) {
    const yoe = Number(editForm.years_of_experience);
    if (isNaN(yoe) || yoe < 0) return toast.error("Enter valid years of experience");

    setSaving(true);
    try {
      const res = await axiosApi.patch(`/candidate-skills/${id}`, {
        level:              editForm.level,
        years_of_experience: yoe,
      });

      setRows((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, level: editForm.level, years_of_experience: yoe, ...res.data }
            : r,
        ),
      );
      setEditId(null);
      toast.success("Skill updated");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update skill");
    } finally {
      setSaving(false);
    }
  }

  // ── delete ──────────────────────────────────────────────────────────────────
  async function handleDelete(id) {
    if (!window.confirm("Remove this skill from your profile?")) return;
    try {
      await axiosApi.delete(`/candidate-skills/${id}`);
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast.success("Skill removed");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete skill");
    }
  }

  // ── available skills for add-form (exclude already-added ones) ──────────────
  const availableSkills = skills.filter(
    (s) => !rows.some((r) => String(r.skill_id ?? r.Skill?.id ?? r.skillId) === String(s.id)),
  );

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm">

      {/* header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-orange-500" />
          <h2 className="text-sm font-semibold text-gray-700">My Skills</h2>
        </div>
        <button
          type="button"
          onClick={() => { setShowAdd((v) => !v); setEditId(null); }}
          className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 transition-colors"
        >
          <Plus size={13} />
          Add Skill
        </button>
      </div>

      {/* ── add-skill inline form ── */}
      {showAdd && (
        <div className="mb-4 rounded-lg border border-orange-100 bg-orange-50/30 p-3 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">New Skill</p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Skill</span>
              <select
                value={addForm.skill_id}
                onChange={(e) => setAddForm((p) => ({ ...p, skill_id: e.target.value }))}
                className={selectClass}
              >
                <option value="">— Select skill —</option>
                {availableSkills.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Level</span>
              <select
                value={addForm.level}
                onChange={(e) => setAddForm((p) => ({ ...p, level: e.target.value }))}
                className={selectClass}
              >
                {LEVELS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Years</span>
              <input
                type="number"
                min={0}
                step={0.5}
                placeholder="e.g. 2"
                value={addForm.years_of_experience}
                onChange={(e) => setAddForm((p) => ({ ...p, years_of_experience: e.target.value }))}
                className={inputClass}
              />
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving}
              className="rounded-lg bg-orange-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-60 transition-colors"
            >
              {saving ? "Adding…" : "Add"}
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── skills table ── */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-9 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 && !showAdd ? (
        <p className="text-sm text-gray-400">No skills added yet. Click <strong>+ Add Skill</strong> to get started.</p>
      ) : rows.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-orange-50">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-orange-50/60 text-left">
                <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Skill</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Level</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Years</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              {rows.map((row) =>
                editId === row.id ? (
                  /* ── inline edit row ── */
                  <tr key={row.id} className="bg-orange-50/20">
                    <td className="px-4 py-2">
                      <span className="text-sm font-medium text-gray-800">
                        {row.Skill?.name ?? row.skill_name ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={editForm.level}
                        onChange={(e) => setEditForm((p) => ({ ...p, level: e.target.value }))}
                        className="h-8 rounded-lg border border-orange-200 px-2 text-xs outline-none focus:border-orange-400 bg-white"
                      >
                        {LEVELS.map((l) => <option key={l}>{l}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={editForm.years_of_experience}
                        onChange={(e) => setEditForm((p) => ({ ...p, years_of_experience: e.target.value }))}
                        className="h-8 w-20 rounded-lg border border-orange-200 px-2 text-xs outline-none focus:border-orange-400 bg-white"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSave(row.id)}
                          disabled={saving}
                          title="Save"
                          className="p-1.5 rounded-lg text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-60 transition-colors"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          title="Cancel"
                          className="p-1.5 rounded-lg text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  /* ── read row ── */
                  <tr key={row.id} className="hover:bg-orange-50/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {row.Skill?.name ?? row.skill_name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <LevelPill level={row.level} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {row.years_of_experience != null ? `${row.years_of_experience} yr${row.years_of_experience !== 1 ? "s" : ""}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(row)}
                          title="Edit"
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          title="Delete"
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      ) : null}

    </div>
  );
}
