import { useEffect, useRef, useState, useCallback } from "react";
import { Plus, X, Loader2, Users, ChevronDown, Check, RefreshCw } from "lucide-react";
import { useDebounce } from "../../hooks";
import { useLocation, useNavigate } from "react-router-dom";
import SearchInput from "../../components/shared/SearchInput";
import EmptyState from "../../components/shared/EmptyState";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import { getCompanyJobs, getCompanyProfile } from "@/apis/company";
import { api } from "../../services/api";
import { apiClient } from "@/apis/api";
import { getAuthUser } from "../../lib/auth";

// ── level pill ────────────────────────────────────────────────────────────────
const LEVEL_STYLE = {
  junior: "bg-blue-100 text-blue-700",
  mid: "bg-orange-100 text-orange-700",
  senior: "bg-purple-100 text-purple-700",
};

function LevelPill({ level }) {
  if (!level) return <span className="text-xs text-gray-400">—</span>;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${LEVEL_STYLE[level] ?? "bg-gray-100 text-gray-600"}`}>
      {level}
    </span>
  );
}

// ── salary formatter ──────────────────────────────────────────────────────────
function fmtSalary(min, max) {
  const fmt = (n) => Number(n).toLocaleString("en-NP");
  if (min && max) return `NPR ${fmt(min)} – ${fmt(max)}`;
  if (min) return `NPR ${fmt(min)}+`;
  if (max) return `Up to NPR ${fmt(max)}`;
  return "—";
}

// ── deadline cell ─────────────────────────────────────────────────────────────
function DeadlineCell({ deadline }) {
  if (!deadline) return <span className="text-xs text-gray-400">—</span>;
  const d = new Date(deadline);
  const days = Math.ceil((d - Date.now()) / 86_400_000);
  const label = d.toLocaleDateString("en-NP", { day: "numeric", month: "short", year: "numeric" });
  const urgent = days >= 0 && days <= 7;
  return (
    <div>
      <span className={`text-xs font-medium ${urgent ? "text-rose-600" : "text-gray-700"}`}>{label}</span>
      {urgent && days >= 0 && (
        <span className="ml-1 text-xs text-rose-500">({days}d left)</span>
      )}
      {days < 0 && <span className="ml-1 text-xs text-gray-400">(expired)</span>}
    </div>
  );
}

// ── status dot cell ───────────────────────────────────────────────────────────
function StatusDot({ status }) {
  const s = String(status || "").toLowerCase();
  const isOpen = s === "open";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <span className={`h-2 w-2 rounded-full ${isOpen ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`} />
      {isOpen ? "Open" : "Closing"}
    </span>
  );
}

// helper to unwrap API response
function unwrap(res) {
  return res?.data?.data || res?.data || res || [];
}

export default function Jobs() {
  const location = useLocation();
  const navigate = useNavigate();
  const authUser = getAuthUser();

  const [search, setSearch] = useState(
    new URLSearchParams(location.search).get("search") || "",
  );
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [companyId, setCompanyId] = useState(null);

  // ── modal state ──────────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    min_salary: "",
    max_salary: "",
    currency: "NPR",
    job_type: "full_time",
    status: "open",
    experience_level: "",
    required_experience: "",
    project_duration_days: "",
    is_remote: false,
    deadline: "",
  });

  // ── skills for multi-select ───────────────────────────────────────────────
  const [allSkills, setAllSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]); // [{id, name}]
  const [skillDropOpen, setSkillDropOpen] = useState(false);
  const [skillSearch, setSkillSearch] = useState("");
  const debouncedSkillSearch = useDebounce(skillSearch, 300);
  const [creatingSkill, setCreatingSkill] = useState(false);
  const skillDropRef = useRef(null);
  // ─────────────────────────────────────────────────────────────────────────

  // ── sync search from URL ─────────────────────────────────────────────────
  useEffect(() => {
    const q = new URLSearchParams(location.search).get("search") || "";
    setSearch(q);
  }, [location.search]);

  // ── fetch company id once on mount ───────────────────────────────────────
  useEffect(() => {
    async function loadCompanyId() {
      try {
        const profile = await getCompanyProfile();
        const company = profile?.data?.data || profile?.data || profile || {};
        const id = Number(company?.id || company?.company_id);
        if (id) setCompanyId(id);
      } catch {
        // Leave companyId null if company profile fetch fails. 
        // Backend will resolve it securely via user_id.
      }
    }
    loadCompanyId();
  }, [authUser?.id]);

  // ── load jobs ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadJobs() {
      setLoading(true);
      setError("");
      try {
        // pass company_id so the API returns only THIS company's jobs
        const res = await getCompanyJobs({
          search,
          limit: 50,
          company_id: companyId || authUser?.company_id || authUser?.id,
        });
        const data = unwrap(res);
        if (!cancelled) setJobs(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setError(err?.message || "Failed to load jobs");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadJobs();
    return () => { cancelled = true; };
  }, [search, companyId]);

  // ── load company skills for the dropdown ─────────────────────────────────
  const refreshSkills = useCallback(async () => {
    try {
      const res = await apiClient.get("/skills", { 
        params: { limit: 50, search: debouncedSkillSearch } 
      });
      const data = res?.data?.data || res?.data || [];
      setAllSkills(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }, [debouncedSkillSearch]);

  useEffect(() => {
    if (!showModal) return;
    refreshSkills();
  }, [showModal, refreshSkills]);

  // ── close skills dropdown on outside click ────────────────────────────────
  useEffect(() => {
    function handleClick(e) {
      if (skillDropRef.current && !skillDropRef.current.contains(e.target)) {
        setSkillDropOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── form helpers ──────────────────────────────────────────────────────────
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.find((s) => s.id === skill.id)
        ? prev.filter((s) => s.id !== skill.id)
        : [...prev, { id: skill.id, name: skill.name, required_level: "intermediate" }]
    );
  };

  const updateSkillLevel = (skillId, level) => {
    setSelectedSkills((prev) =>
      prev.map((s) => s.id === skillId ? { ...s, required_level: level } : s)
    );
  };

  const resetForm = () => {
    setForm({
      title: "", description: "", location: "",
      min_salary: "", max_salary: "", currency: "NPR",
      job_type: "full_time", status: "open",
      experience_level: "", required_experience: "",
      project_duration_days: "", is_remote: false, deadline: "",
    });
    setSelectedSkills([]);
    setSkillSearch("");
    setSkillDropOpen(false);
    setFormError("");
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  // ── submit new job ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.title.trim()) { setFormError("Job title is required."); return; }
    if (!form.description.trim()) { setFormError("Description is required."); return; }
    if (!form.location.trim()) { setFormError("Location is required."); return; }

    setSubmitting(true);
    setFormError("");

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        min_salary: form.min_salary ? Number(form.min_salary) : undefined,
        max_salary: form.max_salary ? Number(form.max_salary) : undefined,
        currency: form.currency || "NPR",
        job_type: form.job_type || "full_time",
        status: form.status || "open",
        experience_level: form.experience_level || undefined,
        required_experience: form.required_experience ? Number(form.required_experience) : undefined,
        project_duration_days: form.project_duration_days ? Number(form.project_duration_days) : undefined,
        is_remote: form.is_remote,
        deadline: form.deadline || undefined,
        company_id: companyId || undefined,
      };

      const res = await api.post("/jobs", payload);
      const newJob = res?.data?.data || res?.data || res;
      const jobId = newJob?.id;

      // Link selected skills to the new job (with required_level)
      if (jobId && selectedSkills.length > 0) {
        await Promise.allSettled(
          selectedSkills.map((skill) =>
            apiClient.post("/job-skills", {
              job_id: jobId,
              skill_id: skill.id,
              required_level: skill.required_level || "intermediate",
            })
          )
        );
        // attach skills to the job object for the table
        newJob.JobSkills = selectedSkills.map((s) => ({ Skill: s }));
      }

      setJobs((prev) => [newJob, ...prev]);
      handleCloseModal();
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || "Failed to create job.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── header ── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Postings</h1>
          <p className="text-sm text-gray-600">
            Review active and draft company job postings
          </p>
        </div>

        {/* ── Post a Job button ── */}
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
        >
          <Plus size={16} /> Post a Job
        </button>
      </div>

      {/* ── search ── */}
      <div className="rounded-lg border border-orange-100 bg-white p-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search jobs..."
          disabled={loading}
        />
      </div>

      {/* ── ACTIVE JOB POSTINGS table ── */}
      {loading ? (
        <LoadingSkeleton rows={5} columns={8} />
      ) : error ? (
        <EmptyState title="Failed to load jobs" message={error} />
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No jobs found"
          message={search ? "Try a different search term" : "Click 'Post a Job' to add your first job."}
        />
      ) : (
        <div className="rounded-xl border border-orange-100 bg-white shadow-sm overflow-hidden">
          {/* table title */}
          <div className="px-5 py-3 border-b border-orange-50 bg-orange-50/40">
            <h2 className="text-xs font-bold tracking-widest text-orange-700 uppercase">
              Active Job Postings
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-orange-50 bg-gray-50/60 text-left">
                  {["Title", "Location", "Salary (NPR)", "Level", "Deadline", "Applicants", "Status", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-50">
                {jobs.map((job) => {
                  const appCount = job.applications?.length ?? job.applicant_count ?? job.applications_count ?? 0;
                  return (
                    <tr key={job.id} className="hover:bg-orange-50/30 transition-colors">
                      {/* Title */}
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-900">
                          {job.title || `Job #${job.id}`}
                        </span>
                        {job.job_type && (
                          <span className="ml-2 text-xs text-gray-400 capitalize">
                            {String(job.job_type).replace("_", " ")}
                          </span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {job.location || (job.is_remote ? "Remote" : "—")}
                      </td>

                      {/* Salary */}
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {fmtSalary(
                          job.min_salary ?? job.salary_min,
                          job.max_salary ?? job.salary_max,
                        )}
                      </td>

                      {/* Level */}
                      <td className="px-4 py-3">
                        <LevelPill level={job.experience_level} />
                      </td>

                      {/* Deadline */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <DeadlineCell deadline={job.deadline} />
                      </td>

                      {/* Applicants */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-gray-700">
                          <Users size={13} className="text-gray-400" />
                          {appCount}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusDot status={job.status} />
                      </td>

                      {/* View Matches */}
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/company/candidates?job_id=${job.id}`)}
                          className="rounded-lg border border-orange-300 px-3 py-1 text-xs font-semibold text-orange-600 hover:bg-orange-50 transition-colors whitespace-nowrap"
                        >
                          View Matches
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Post a Job Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">

            {/* modal header */}
            <div className="flex items-center justify-between border-b border-orange-50 px-6 py-4 shrink-0">
              <h2 className="text-lg font-bold text-gray-900">Post a New Job</h2>
              <button type="button" onClick={handleCloseModal}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-orange-50 hover:text-orange-600 transition">
                <X size={20} />
              </button>
            </div>

            {/* scrollable form body */}
            <div className="overflow-y-auto px-6 py-5 space-y-4">

              {/* ── Row 1: Title ── */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input name="title" value={form.title} onChange={handleFormChange}
                  placeholder="e.g. Frontend Developer"
                  className="w-full rounded-xl border border-orange-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
              </div>

              {/* ── Row 2: Description ── */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea name="description" value={form.description} onChange={handleFormChange}
                  placeholder="Describe the role, responsibilities, requirements…"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-orange-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
              </div>

              {/* ── Row 3: Location + Remote ── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input name="location" value={form.location} onChange={handleFormChange}
                    placeholder="e.g. Kathmandu"
                    className="w-full rounded-xl border border-orange-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Remote</label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-orange-200 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 transition">
                    <input type="checkbox" name="is_remote" checked={form.is_remote} onChange={handleFormChange}
                      className="h-4 w-4 rounded accent-orange-500" />
                    Remote / Work from home
                  </label>
                </div>
              </div>

              {/* ── Row 4: Salary range + Currency ── */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Min Salary</label>
                  <input name="min_salary" type="number" value={form.min_salary} onChange={handleFormChange}
                    placeholder="e.g. 30000"
                    className="w-full rounded-xl border border-orange-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Max Salary</label>
                  <input name="max_salary" type="number" value={form.max_salary} onChange={handleFormChange}
                    placeholder="e.g. 80000"
                    className="w-full rounded-xl border border-orange-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Currency</label>
                  <select name="currency" value={form.currency} onChange={handleFormChange}
                    className="w-full rounded-xl border border-orange-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100">
                    <option value="NPR">NPR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="INR">INR</option>
                  </select>
                </div>
              </div>

              {/* ── Row 5: Job Type + Status ── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Job Type</label>
                  <select name="job_type" value={form.job_type} onChange={handleFormChange}
                    className="w-full rounded-xl border border-orange-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100">
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                    <option value="freelance">Freelance</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                  <select name="status" value={form.status} onChange={handleFormChange}
                    className="w-full rounded-xl border border-orange-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100">
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              {/* ── Row 6: Experience Level + Required Experience ── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Experience Level</label>
                  <select name="experience_level" value={form.experience_level} onChange={handleFormChange}
                    className="w-full rounded-xl border border-orange-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100">
                    <option value="">Select level</option>
                    <option value="junior">Junior</option>
                    <option value="mid">Mid</option>
                    <option value="senior">Senior</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Required Experience (years)</label>
                  <input name="required_experience" type="number" min="0" max="30"
                    value={form.required_experience} onChange={handleFormChange}
                    placeholder="e.g. 2"
                    className="w-full rounded-xl border border-orange-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                </div>
              </div>

              {/* ── Row 7: Project Duration + Deadline ── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Project Duration (days)</label>
                  <input name="project_duration_days" type="number" min="1"
                    value={form.project_duration_days} onChange={handleFormChange}
                    placeholder="e.g. 90"
                    className="w-full rounded-xl border border-orange-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Application Deadline</label>
                  <input name="deadline" type="date"
                    value={form.deadline} onChange={handleFormChange}
                    className="w-full rounded-xl border border-orange-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                </div>
              </div>

              {/* ── Row 8: Skills Multi-select ── */}
              <div ref={skillDropRef}>
                <label className="mb-1 block text-sm font-medium text-gray-700">Required Skills</label>

                {/* selected pills with required_level selector */}
                {selectedSkills.length > 0 && (
                  <div className="mb-2 space-y-2">
                    {selectedSkills.map((s) => (
                      <div key={s.id}
                        className="flex items-center gap-2 rounded-xl border border-orange-100 bg-orange-50 px-3 py-2">
                        <span className="flex-1 text-sm font-medium text-orange-800">{s.name}</span>
                        <select
                          value={s.required_level}
                          onChange={(e) => updateSkillLevel(s.id, e.target.value)}
                          className="rounded-lg border border-orange-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
                        >
                          <option value="basic">Basic</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                        <button type="button" onClick={() => toggleSkill(s)}
                          className="text-orange-400 hover:text-orange-700">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* trigger */}
                <button type="button"
                  onClick={() => setSkillDropOpen((v) => !v)}
                  className="flex w-full items-center justify-between rounded-xl border border-orange-200 px-4 py-2.5 text-sm text-gray-600 outline-none hover:border-orange-400 transition">
                  <span>{selectedSkills.length === 0 ? "Select skills…" : `${selectedSkills.length} skill(s) selected`}</span>
                  <ChevronDown size={16} className={`transition-transform ${skillDropOpen ? "rotate-180" : ""}`} />
                </button>

                {/* dropdown */}
                {skillDropOpen && (
                  <div className="mt-1 max-h-44 overflow-y-auto rounded-xl border border-orange-100 bg-white shadow-lg">
                    {/* search */}
                    <div className="sticky top-0 border-b border-orange-50 bg-white px-3 py-2">
                      <input
                        autoFocus
                        value={skillSearch}
                        onChange={(e) => setSkillSearch(e.target.value)}
                        placeholder="Search skills…"
                        className="w-full rounded-lg border border-orange-100 px-3 py-1.5 text-sm outline-none focus:border-orange-300"
                      />
                    </div>
                    {/* matching skills */}
                    {allSkills.map((skill) => {
                      const isSelected = selectedSkills.some((s) => s.id === skill.id);
                      return (
                        <button key={skill.id} type="button"
                          onClick={() => toggleSkill(skill)}
                          className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition hover:bg-orange-50 ${isSelected ? "text-orange-600 font-medium" : "text-gray-700"
                            }`}>
                          <span>{skill.name}</span>
                          {isSelected && <Check size={14} className="text-orange-500" />}
                        </button>
                      );
                    })}

                    {/* ── inline create: shown when search text doesn't exactly match any skill ── */}
                    {skillSearch.trim() !== "" &&
                      !allSkills.some((s) => s.name.toLowerCase() === skillSearch.trim().toLowerCase()) && (
                        <button
                          type="button"
                          disabled={creatingSkill}
                          onClick={async () => {
                            const name = skillSearch.trim();
                            if (!name) return;
                            setCreatingSkill(true);
                            try {
                              const res = await apiClient.post("/skills", { name });
                              const created = res?.data?.data || res?.data || res;
                              if (created?.id) {
                                setAllSkills((prev) => [created, ...prev]);
                                setSelectedSkills((prev) => [
                                  ...prev,
                                  { id: created.id, name: created.name, required_level: "intermediate" },
                                ]);
                                setSkillSearch("");
                              }
                            } catch {
                              // error logic
                            } finally {
                              setCreatingSkill(false);
                            }
                          }}
                          className="flex w-full items-center gap-2 border-t border-orange-50 px-4 py-2.5 text-sm font-medium text-orange-600 hover:bg-orange-50 transition disabled:opacity-50"
                        >
                          {creatingSkill
                            ? <><Loader2 size={13} className="animate-spin" /> Creating…</>
                            : <><Plus size={13} /> Create &ldquo;{skillSearch.trim()}&rdquo;</>}
                        </button>
                      )}

                    {/* empty state when no match AND search is blank */}
                    {skillSearch.trim() === "" && allSkills.length === 0 && (
                      <p className="px-4 py-3 text-sm text-gray-400">No skills found. Type a name to search or create.</p>
                    )}
                  </div>
                )}
              </div>

              {/* error */}
              {formError && (
                <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{formError}</p>
              )}
            </div>

            {/* footer */}
            <div className="flex gap-3 border-t border-orange-50 px-6 py-4 shrink-0">
              <button type="button" onClick={handleCloseModal}
                className="flex-1 rounded-xl border border-orange-200 py-2.5 text-sm text-gray-600 transition hover:bg-orange-50">
                Cancel
              </button>
              <button type="button" onClick={handleSubmit} disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed">
                {submitting
                  ? <><Loader2 size={15} className="animate-spin" /> Posting…</>
                  : <><Plus size={15} /> Post Job</>}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}