import { useEffect, useState } from "react";
import { Briefcase, MapPin, Building2, Plus, X, Loader2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import SearchInput from "../../components/shared/SearchInput";
import EmptyState from "../../components/shared/EmptyState";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import StatusBadge from "../../components/shared/StatusBadge";
import { getCompanyJobs, getCompanyProfile } from "@/apis/company";
import { api } from "../../services/api";
import { getAuthUser } from "../../lib/auth";

// helper to unwrap API response
function unwrap(res) {
  return res?.data?.data || res?.data || res || [];
}

export default function Jobs() {
  const location = useLocation();
  const authUser = getAuthUser();

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

      {/* ── job list ── */}
      {loading ? (
        <LoadingSkeleton rows={5} columns={4} />
      ) : error ? (
        <EmptyState title="Failed to load jobs" message={error} />
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No jobs found"
          message={search ? "Try a different search term" : "Click 'Post a Job' to add your first job."}
        />
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Briefcase size={18} className="text-orange-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      {job.title || `Job #${job.id}`}
                    </h2>
                  </div>
                  <p className="text-sm text-gray-600">
                    {job.description || "No description available"}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={14} />
                      {job.location || "Remote"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Building2 size={14} />
                      {job.company_name || "Company"}
                    </span>
                    {(job.salary_min || job.salary_max) && (
                      <span className="inline-flex items-center gap-1 text-orange-600 font-medium">
                        ${job.salary_min?.toLocaleString()} – ${job.salary_max?.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={job.status || "open"} />
                </div>
              </div>
            </div>
          ))}
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