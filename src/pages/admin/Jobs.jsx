import { useState, useEffect } from "react";
import { Eye, Pencil, Trash2, Plus, ChevronDown, X } from "lucide-react";
import { toast } from "react-toastify";
import SearchInput from "../../components/shared/SearchInput";
import FilterTabs from "../../components/shared/FilterTabs";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import ErrorState from "../../components/shared/ErrorState";
import EmptyState from "../../components/shared/EmptyState";
import Pagination from "../../components/shared/Pagination";
import StatusBadge from "../../components/shared/StatusBadge";
import { useDebounce, usePagination } from "../../hooks";
import { formatDate } from "../../utils/formatters";
import * as jobService from "../../services/jobService";
import * as companyService from "../../services/companyService";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

const LEVELS = [
  { value: "all", label: "All Levels" },
  { value: "entry", label: "Entry Level" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior" },
];

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const { page, pageSize, goToPage } = usePagination();
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    job: null,
  });
  const [viewJob, setViewJob] = useState(null);
  const [editJob, setEditJob] = useState(null);
  const [editForm, setEditForm] = useState({});

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await jobService.updateJob(editJob.id, {
        title: editForm.title,
        location: editForm.location,
        experience_level: editForm.experience_level,
        status: editForm.status,
      });
      toast.success("Job updated successfully");
      setEditJob(null);
      fetchJobs();
    } catch (err) {
      toast.error("Failed to update job");
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = {
        search: debouncedSearch,
        status: statusFilter !== "all" ? statusFilter : undefined,
        page,
        limit: pageSize,
      };
      const [jobsRes, companiesRes] = await Promise.all([
        jobService.getJobs(params),
        companyService.getCompanies(),
      ]);

      setJobs(jobsRes.data.data || []);

      const companyMap = {};
      (companiesRes.data.data || []).forEach((c) => {
        companyMap[c.id] = c;
      });
      setCompanies(companyMap);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [debouncedSearch, statusFilter, page]);

  const handleToggleStatus = async (job) => {
    try {
      const newStatus = job.status === "open" ? "closed" : "open";
      await jobService.updateJob(job.id, { status: newStatus });
      toast.success(
        `Job ${newStatus === "open" ? "opened" : "closed"} successfully`,
      );
      fetchJobs();
    } catch (err) {
      toast.error("Failed to update job status");
    }
  };

  const handleDelete = async () => {
    try {
      await jobService.deleteJob(deleteConfirm.job.id);
      toast.success("Job deleted successfully");
      setDeleteConfirm({ open: false, job: null });
      fetchJobs();
    } catch (err) {
      toast.error("Failed to delete job");
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (levelFilter !== "all" && job.experience_level !== levelFilter) return false;
    if (companyFilter !== "all" && job.company_id !== parseInt(companyFilter))
      return false;
    return true;
  });

  const companyList = Object.values(companies).map((c) => ({
    value: c.id.toString(),
    label: c.name,
  }));

  if (error) {
    return (
      <ErrorState
        title="Failed to load jobs"
        message={error}
        onRetry={fetchJobs}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
          <p className="text-sm text-gray-600">
            Manage job postings and listings
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600">
          <Plus size={18} />
          Post Job
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 rounded-lg border border-orange-100 bg-white p-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by job title..."
          disabled={loading}
        />
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          {LEVELS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="all">All Companies</option>
          {companyList.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Status Tabs */}
      <FilterTabs
        tabs={STATUS_TABS}
        active={statusFilter}
        onChange={setStatusFilter}
      />

      {/* Table */}
      {loading ? (
        <LoadingSkeleton rows={5} columns={6} />
      ) : filteredJobs.length === 0 ? (
        <EmptyState
          title="No jobs found"
          message="Try adjusting your search filters"
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-orange-100 bg-white shadow-sm">
          <table className="w-full">
            <thead className="border-b border-orange-100 bg-orange-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Job Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Company
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Level
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Posted
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => {
                const company = companies[job.company_id];
                return (
                  <tr
                    key={job.id}
                    className="border-b border-orange-50 hover:bg-orange-50"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{job.title}</p>
                      <p className="text-xs text-gray-500">
                        {job.location || "-"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {company?.name || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <span className="inline-block rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
                        {job.experience_level || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={job.status}>
                        {job.status}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(job.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setViewJob(job)}
                          className="text-gray-400 hover:text-orange-600"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => {
                            setEditJob(job);
                            setEditForm({
                              title: job.title || "",
                              location: job.location || "",
                              experience_level: job.experience_level || "",
                              status: job.status || "open",
                            });
                          }}
                          className="text-gray-400 hover:text-orange-600"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(job)}
                          className="text-gray-400 hover:text-orange-600"
                          title={`${job.status === "open" ? "Close" : "Open"} job`}
                        >
                          <ChevronDown size={18} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ open: true, job })}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredJobs.length > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={filteredJobs.length * 2}
          onPageChange={goToPage}
        />
      )}

      {/* Modals */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, job: null })}
        onConfirm={handleDelete}
        title="Delete Job"
        message={`Are you sure you want to delete "${deleteConfirm.job?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmStyle="danger"
      />

      {/* View Job Modal */}
      {viewJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">Job Details</h2>
              <button onClick={() => setViewJob(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-500">Title</h3>
                <p className="mt-1 text-gray-900">{viewJob.title}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500">Company</h3>
                <p className="mt-1 text-gray-900">{companies[viewJob.company_id]?.name || "—"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Location</h3>
                  <p className="mt-1 text-gray-900">{viewJob.location || "—"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Level</h3>
                  <p className="mt-1 text-gray-900 capitalize">{viewJob.experience_level || "—"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Status</h3>
                  <div className="mt-1"><StatusBadge status={viewJob.status}>{viewJob.status}</StatusBadge></div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Job Type</h3>
                  <p className="mt-1 text-gray-900 capitalize">{String(viewJob.job_type || "").replace("_", " ") || "—"}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500">Description</h3>
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{viewJob.description || "No description provided."}</p>
              </div>
            </div>
            <div className="border-t px-6 py-4 flex justify-end">
              <button
                onClick={() => setViewJob(null)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Job Modal */}
      {editJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Job</h2>
              <button onClick={() => setEditJob(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Job Title</label>
                  <input
                    name="title"
                    value={editForm.title}
                    onChange={handleEditChange}
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:border-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Location</label>
                  <input
                    name="location"
                    value={editForm.location}
                    onChange={handleEditChange}
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:border-orange-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Experience Level</label>
                    <select
                      name="experience_level"
                      value={editForm.experience_level}
                      onChange={handleEditChange}
                      className="w-full rounded-lg border px-3 py-2 outline-none focus:border-orange-500"
                    >
                      <option value="">Select Level</option>
                      <option value="junior">Junior</option>
                      <option value="mid">Mid</option>
                      <option value="senior">Senior</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                    <select
                      name="status"
                      value={editForm.status}
                      onChange={handleEditChange}
                      className="w-full rounded-lg border px-3 py-2 outline-none focus:border-orange-500"
                    >
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="border-t px-6 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditJob(null)}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
