import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Pencil, Trash2, Check, X, Plus, Zap, ChevronDown } from "lucide-react";
import axiosApi from "../../api/axios";

// ─── constants ───────────────────────────────────────────────────────────────

const LEVELS = ["basic", "intermediate", "advanced"];

const LEVEL_STYLE = {
  basic:     "bg-gray-100   text-gray-600",

  intermediate: "bg-yellow-100 text-yellow-700",
  advanced:     "bg-orange-100 text-orange-700",
  
};

const inputClass =
  "h-9 w-full rounded-lg border border-orange-100 px-3 text-sm outline-none " +
  "focus:border-orange-400 focus:ring-1 focus:ring-orange-100 bg-white";

const selectClass =
  "h-9 w-full rounded-lg border border-orange-100 px-2 text-sm outline-none " +
  "focus:border-orange-400 focus:ring-1 focus:ring-orange-100 bg-white";

// ─── helpers ─────────────────────────────────────────────────────────────────

function LevelPill({ level }) {
  const displayLevel = level ? level.charAt(0).toUpperCase() + level.slice(1) : "";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        LEVEL_STYLE[level] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {displayLevel}
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

  // searchable dropdown state
  const [skillSearch, setSkillSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // ── load ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const [meRes, skillsRes] = await Promise.all([
          axiosApi.get("/candidates/me"),
          axiosApi.get("/skills?limit=1000"),
        ]);

        if (!alive) return;

        const me              = meRes.data ?? {};
        const candidateSkills = me.CandidateSkills ?? me.candidateSkills ?? [];
        const allSkills       = Array.isArray(skillsRes.data?.data) ? skillsRes.data.data : (Array.isArray(skillsRes.data) ? skillsRes.data : []);

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

  // ── close dropdown on click outside ──
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── available skills for add-form (exclude already-added ones) ──────────────
  const availableSkills = useMemo(() => {
    return skills.filter(
      (s) => !rows.some((r) => String(r.skill_id ?? r.Skill?.id ?? r.skillId) === String(s.id)),
    );
  }, [skills, rows]);

  // ── filtered skills for dropdown ──
  const filteredSkills = useMemo(() => {
    const selectedSkillName = availableSkills.find(s => String(s.id) === String(addForm.skill_id))?.name || "";
    if (skillSearch === selectedSkillName) {
      return availableSkills;
    }
    return availableSkills.filter((s) =>
      s.name.toLowerCase().includes(skillSearch.toLowerCase())
    );
  }, [availableSkills, skillSearch, addForm.skill_id]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSkillSearch(val);
    setShowDropdown(true);
    
    const matchingSkill = availableSkills.find(s => s.name.toLowerCase() === val.trim().toLowerCase());
    if (matchingSkill) {
      setAddForm(p => ({ ...p, skill_id: matchingSkill.id }));
    } else {
      setAddForm(p => ({ ...p, skill_id: "" }));
    }
  };

  // ── add ─────────────────────────────────────────────────────────────────────
  async function handleAdd() {
    if (!addForm.skill_id) return toast.error("Please select a skill");
    if (!addForm.level)    return toast.error("Please select a level");

    const yoe = Math.round(Number(addForm.years_of_experience));
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
      setSkillSearch("");
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
    const yoe = Math.round(Number(editForm.years_of_experience));
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
            <div className="flex flex-col gap-1 relative" ref={dropdownRef}>
              <span className="text-xs text-gray-500">Skill</span>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search skill..."
                  value={skillSearch}
                  onFocus={() => setShowDropdown(true)}
                  onChange={handleSearchChange}
                  className="h-9 w-full rounded-lg border border-orange-100 pl-3 pr-8 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 bg-white"
                />
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>

              {showDropdown && (
                <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-48 overflow-y-auto rounded-lg border border-orange-100 bg-white shadow-lg">
                  {filteredSkills.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-gray-400">No matching skills</p>
                  ) : (
                    filteredSkills.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setAddForm((p) => ({ ...p, skill_id: s.id }));
                          setSkillSearch(s.name);
                          setShowDropdown(false);
                        }}
                        className="flex w-full items-center px-3 py-2 text-sm text-left hover:bg-orange-50 text-gray-700 transition"
                      >
                        {s.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Level</span>
              <select
                value={addForm.level}
                onChange={(e) => setAddForm((p) => ({ ...p, level: e.target.value }))}
                className={selectClass}
              >
                {LEVELS.map((l) => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
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
              onClick={() => { setShowAdd(false); setSkillSearch(""); }}
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
                        {LEVELS.map((l) => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
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
