import { useEffect, useState } from "react";
import { Plus, X, Loader2, Users } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import SearchInput from "../../components/shared/SearchInput";
import EmptyState from "../../components/shared/EmptyState";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import { getCompanyJobs, getCompanyProfile } from "@/apis/company";
import { api } from "../../services/api";
import { getAuthUser } from "../../lib/auth";

// ── level pill ────────────────────────────────────────────────────────────────
const LEVEL_STYLE = {
  junior: "bg-blue-100 text-blue-700",
  mid:    "bg-orange-100 text-orange-700",
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
  if (min)        return `NPR ${fmt(min)}+`;
  if (max)        return `Up to NPR ${fmt(max)}`;
  return "—";
}

// ── deadline cell ─────────────────────────────────────────────────────────────
function DeadlineCell({ deadline }) {
  if (!deadline) return <span className="text-xs text-gray-400">—</span>;
  const d    = new Date(deadline);
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
  const location  = useLocation();
  const navigate  = useNavigate();
  const authUser  = getAuthUser();

  const [search, setSearch] = useState(
    new URLSearchParams(location.search).get("search") || "",
  );
  const [jobs, setJobs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [companyId, setCompanyId] = useState(null);

  // ── modal state ──────────────────────────────────────────────────────────
  const [showModal, setShowModal]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState("");
  const [form, setForm] = useState({
    title:        "",
    description:  "",
    location:     "",
    salary_min:   "",
    salary_max:   "",
    job_type:     "full_time",
    status:       "open",
  });
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
        const profile  = await getCompanyProfile();
        const company  = profile?.data?.data || profile?.data || profile || {};
        const id       = Number(company?.id || company?.company_id || authUser?.company_id);
        if (id) setCompanyId(id);
      } catch {
        // fallback: try authUser directly
        if (authUser?.company_id) setCompanyId(Number(authUser.company_id));
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
        const res  = await getCompanyJobs({
          search,
          limit:      50,
          company_id: companyId || authUser?.company_id,
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

  // ── form helpers ──────────────────────────────────────────────────────────
  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetForm = () => {
    setForm({
      title: "", description: "", location: "",
      salary_min: "", salary_max: "", job_type: "full_time", status: "open",
    });
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
        ...form,
        company_id: companyId || authUser?.company_id,
        salary_min: form.salary_min ? Number(form.salary_min) : undefined,
        salary_max: form.salary_max ? Number(form.salary_max) : undefined,
      };

      const res     = await api.post("/jobs", payload);
      const newJob  = res?.data?.data || res?.data || res;

      // add new job to top of list immediately
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
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">

            {/* modal header */}
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Post a New Job</h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-lg p-1 text-gray-400 hover:bg-orange-50 hover:text-orange-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* form */}
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">

              {/* title */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  placeholder="e.g. Frontend Developer"
                  className="w-full rounded-xl border border-orange-200 px-4 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              {/* description */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  placeholder="Describe the role, responsibilities, requirements..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-orange-200 px-4 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              {/* location */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  name="location"
                  value={form.location}
                  onChange={handleFormChange}
                  placeholder="e.g. Kathmandu or Remote"
                  className="w-full rounded-xl border border-orange-200 px-4 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              {/* salary */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Min Salary</label>
                  <input
                    name="salary_min"
                    type="number"
                    value={form.salary_min}
                    onChange={handleFormChange}
                    placeholder="e.g. 50000"
                    className="w-full rounded-xl border border-orange-200 px-4 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Max Salary</label>
                  <input
                    name="salary_max"
                    type="number"
                    value={form.salary_max}
                    onChange={handleFormChange}
                    placeholder="e.g. 80000"
                    className="w-full rounded-xl border border-orange-200 px-4 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>

              {/* job type + status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Job Type</label>
                  <select
                    name="job_type"
                    value={form.job_type}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-orange-200 px-4 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                    <option value="remote">Remote</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-orange-200 px-4 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              {/* error */}
              {formError && (
                <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
                  {formError}
                </p>
              )}
            </div>

            {/* footer buttons */}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 rounded-xl border border-orange-200 py-2 text-sm text-gray-600 transition hover:bg-orange-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <><Loader2 size={15} className="animate-spin" /> Posting...</>
                ) : (
                  <><Plus size={15} /> Post Job</>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}