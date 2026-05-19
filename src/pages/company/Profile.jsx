// src/pages/company/Profile.jsx

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import Avatar from "../../components/shared/Avatar";
import {
  getCompanyProfile,
  updateCompanyProfile,
} from "@/apis/company";
import { apiClient } from "@/apis/api";
import { Plus, Trash2 } from "lucide-react";

export default function Profile() {
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({
    name:        "",
    location:    "",
    website_url: "",
    logo_url:    "",
  });
  const [initial, setInitial]   = useState(null);

  // ── skills library state ──────────────────────────────────────────────────
  const [skills, setSkills]         = useState([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [newSkill, setNewSkill]     = useState({ name: "", description: "" });
  const [addingSkill, setAddingSkill] = useState(false);
  const [showAddRow, setShowAddRow]  = useState(false);

  // ── load company profile ──────────────────────────────────────────────────
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res  = await getCompanyProfile();
      const data = res?.data || res || {};

      const merged = {
        name:        data.name        || "",
        location:    data.location    || "",
        website_url: data.website_url || "",
        logo_url:    data.logo_url    || "",
      };

      setForm(merged);
      setInitial(merged);
    } catch (err) {
      toast.error(err?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  // ── load skills library ───────────────────────────────────────────────────
  const fetchSkills = async () => {
    setSkillsLoading(true);
    try {
      const res  = await apiClient.get("/skills");
      const data = res?.data?.data || res?.data || res;
      setSkills(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to load skills");
    } finally {
      setSkillsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchSkills();
  }, []);

  // ── unsaved-changes detection (identical to candidate Profile) ────────────
  const hasUnsaved = useMemo(() => {
    if (!initial) return false;
    return JSON.stringify(initial) !== JSON.stringify(form);
  }, [initial, form]);

  useEffect(() => {
    const beforeUnload = (e) => {
      if (!hasUnsaved) return;
      e.preventDefault();
      e.returnValue = "You have unsaved changes.";
      return "You have unsaved changes.";
    };

    const origPush    = window.history.pushState;
    const origReplace = window.history.replaceState;

    function confirmAndRun(fn) {
      return function (...args) {
        if (hasUnsaved) {
          const ok = window.confirm(
            "You have unsaved changes. Leave without saving?"
          );
          if (!ok) return;
        }
        return fn.apply(this, args);
      };
    }

    window.addEventListener("beforeunload", beforeUnload);
    window.history.pushState   = confirmAndRun(origPush);
    window.history.replaceState = confirmAndRun(origReplace);

    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.history.pushState   = origPush;
      window.history.replaceState = origReplace;
    };
  }, [hasUnsaved]);

  // ── save company profile ──────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCompanyProfile({
        name:        form.name,
        location:    form.location,
        website_url: form.website_url,
        logo_url:    form.logo_url,
      });
      toast.success("Profile updated successfully");
      setInitial({ ...form });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  // ── add a new skill ───────────────────────────────────────────────────────
  const handleAddSkill = async () => {
    if (!newSkill.name.trim()) return toast.error("Skill name is required");
    setAddingSkill(true);
    try {
      const res  = await apiClient.post("/skills", {
        name:        newSkill.name.trim(),
        description: newSkill.description.trim(),
      });
      const created = res?.data?.data || res?.data || res;
      setSkills((prev) => [...prev, created]);
      setNewSkill({ name: "", description: "" });
      setShowAddRow(false);
      toast.success("Skill added");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add skill");
    } finally {
      setAddingSkill(false);
    }
  };

  // ── delete a skill ────────────────────────────────────────────────────────
  const handleDeleteSkill = async (id) => {
    if (!window.confirm("Delete this skill?")) return;
    try {
      await apiClient.delete(`/skills/${id}`);
      setSkills((prev) => prev.filter((s) => s.id !== id));
      toast.success("Skill deleted");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete skill");
    }
  };

  if (loading) return <LoadingSkeleton rows={6} columns={6} />;

  return (
    <div className="space-y-4">

      {/* ── page title ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-600">
          Manage your company information
        </p>
      </div>

      {/* ── left info card + right edit form ── */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[320px,1fr]">

        {/* ── left: company info card ── */}
        <aside className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col items-center gap-3">
            {/* show logo if available, otherwise use Avatar initials */}
            {form.logo_url ? (
              <img
                src={form.logo_url}
                alt="company logo"
                className="h-20 w-20 rounded-xl object-cover border border-orange-100"
              />
            ) : (
              <Avatar name={form.name || "Company"} size="xl" />
            )}
            <p className="m-0 text-lg font-semibold text-gray-900">
              {form.name || "Company"}
            </p>
            {form.website_url && (
              <a
                href={form.website_url}
                target="_blank"
                rel="noreferrer"
                className="m-0 text-sm text-orange-500 hover:underline"
              >
                {form.website_url}
              </a>
            )}
          </div>

          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <p className="m-0">Location: {form.location || "—"}</p>
            <p className="m-0">
              Website:{" "}
              {form.website_url ? (
                <a
                  href={form.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-orange-500 hover:underline"
                >
                  {form.website_url}
                </a>
              ) : (
                "—"
              )}
            </p>
            <p className="m-0">
              Logo URL: {form.logo_url ? (
                <span className="break-all">{form.logo_url}</span>
              ) : "—"}
            </p>
          </div>
        </aside>

        {/* ── right: edit form ── */}
        <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm">
          <div className="space-y-3">

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Company Name"
                className="h-10 rounded-lg border border-orange-100 px-3 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
              />
              <input
                value={form.location}
                onChange={(e) =>
                  setForm((p) => ({ ...p, location: e.target.value }))
                }
                placeholder="Location"
                className="h-10 rounded-lg border border-orange-100 px-3 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
              />
              <input
                value={form.website_url}
                onChange={(e) =>
                  setForm((p) => ({ ...p, website_url: e.target.value }))
                }
                placeholder="Website URL"
                className="h-10 rounded-lg border border-orange-100 px-3 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
              />
              <input
                value={form.logo_url}
                onChange={(e) =>
                  setForm((p) => ({ ...p, logo_url: e.target.value }))
                }
                placeholder="Logo URL"
                className="h-10 rounded-lg border border-orange-100 px-3 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>

              {hasUnsaved && (
                <span className="text-sm text-orange-600">
                  You have unsaved changes
                </span>
              )}
            </div>

          </div>
        </div>

      </section>

      {/* ── skills library table ── */}
      <section className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm">

        {/* skills header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Skills Library
            </h2>
            <p className="text-sm text-gray-500">
              Skills available across all your job listings
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddRow((v) => !v)}
            className="flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700"
          >
            <Plus size={15} />
            Add Skill
          </button>
        </div>

        {/* inline add row */}
        {showAddRow && (
          <div className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-orange-100 bg-orange-50/40 p-3 md:grid-cols-[1fr,2fr,auto]">
            <input
              value={newSkill.name}
              onChange={(e) =>
                setNewSkill((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="Skill name"
              className="h-9 rounded-lg border border-orange-100 px-3 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
            />
            <input
              value={newSkill.description}
              onChange={(e) =>
                setNewSkill((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Description (optional)"
              className="h-9 rounded-lg border border-orange-100 px-3 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddSkill}
                disabled={addingSkill}
                className="rounded-lg bg-orange-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
              >
                {addingSkill ? "Adding..." : "Add"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddRow(false);
                  setNewSkill({ name: "", description: "" });
                }}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* skills table */}
        {skillsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-10 w-full animate-pulse rounded-lg bg-orange-50"
              />
            ))}
          </div>
        ) : skills.length === 0 ? (
          <p className="text-sm text-gray-500">
            No skills yet. Click Add Skill to create one.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-orange-50 bg-orange-50/60">
                  {["#", "Skill Name", "Description", "Action"].map((h) => (
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
                  <tr
                    key={skill.id}
                    className="hover:bg-orange-50/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {skill.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {skill.description || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleDeleteSkill(skill.id)}
                        className="flex items-center gap-1 rounded-lg border border-red-100 px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </section>

    </div>
  );
}