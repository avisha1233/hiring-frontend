import { useState, useEffect } from "react";
import { Eye, Trash2, X, ChevronRight } from "lucide-react";
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
import * as applicationService from "../../services/applicationService";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "shortlisted", label: "Shortlisted" },
];

const STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "shortlisted", label: "Shortlisted" },
];

function getStatusMeta(status) {
  const normalized = String(status || "").toLowerCase();
  const meta = {
    pending: {
      label: "Pending",
      className: "border border-orange-200 bg-orange-50 text-orange-700",
    },
    accepted: {
      label: "Accepted",
      className: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    rejected: {
      label: "Rejected",
      className: "border border-red-200 bg-red-50 text-red-700",
    },
    shortlisted: {
      label: "Shortlisted",
      className: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    },
  };
  return meta[normalized] || meta.pending;
}

function normalizeRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [totalApplications, setTotalApplications] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const { page, pageSize, goToPage } = usePagination();
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    application: null,
  });
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [selectedApplicationDetail, setSelectedApplicationDetail] =
    useState(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = {
        search: debouncedSearch,
        status: statusFilter !== "all" ? statusFilter : undefined,
        page,
        limit: pageSize,
      };
      const res = await applicationService.getApplications(params);
      const payload = res.data || {};
      const rows = normalizeRows(payload);
      setApplications(rows);
      setTotalApplications(payload.total ?? rows.length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [debouncedSearch, statusFilter, page]);

  const handleViewDetails = async (application) => {
    try {
      setDetailError(null);
      setDetailLoading(true);
      setSelectedApplicationId(application.id);
      const res = await applicationService.getApplicationById(application.id);
      setSelectedApplicationDetail(res.data || res);
    } catch (err) {
      setDetailError(err.message || "Failed to load application details");
      toast.error("Failed to load application details");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedApplicationId(null);
    setSelectedApplicationDetail(null);
    setDetailError(null);
  };

  const handleStatusChange = async (application, newStatus) => {
    try {
      setStatusUpdating(application.id);
      await applicationService.updateApplication(application.id, {
        status: newStatus,
      });
      toast.success("Application status updated");
      fetchApplications();
    } catch (err) {
      toast.error("Failed to update application status");
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleDelete = async () => {
    try {
      await applicationService.deleteApplication(deleteConfirm.application.id);
      toast.success("Application deleted successfully");
      setDeleteConfirm({ open: false, application: null });
      fetchApplications();
    } catch (err) {
      toast.error("Failed to delete application");
    }
  };

  if (error) {
    return (
      <ErrorState
        title="Failed to load applications"
        message={error}
        onRetry={fetchApplications}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <p className="text-sm text-gray-600">
          Manage job applications and track candidate progress
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-orange-100 bg-white p-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by candidate or job title..."
          disabled={loading}
        />
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
      ) : applications.length === 0 ? (
        <EmptyState
          title="No applications found"
          message="Try adjusting your search filters"
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-orange-100 bg-white shadow-sm">
          <table className="w-full">
            <thead className="border-b border-orange-100 bg-orange-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Candidate
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Job Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Applied
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Change Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr
                  key={app.id}
                  className="border-b border-orange-50 hover:bg-orange-50"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">
                      {app.candidate_name || app.candidate?.name || "N/A"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {app.candidate_email || app.candidate?.email || "N/A"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-600">
                      {app.job_title || app.jobTitle || app.job?.title || "N/A"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(
                      app.applied_at || app.appliedDate || app.created_at,
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={app.status}>{app.status}</StatusBadge>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app, e.target.value)}
                      disabled={statusUpdating === app.id}
                      className="rounded-lg border border-orange-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      {STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleViewDetails(app)}
                        className="text-gray-400 hover:text-orange-600 transition"
                        title="View details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirm({ open: true, application: app })
                        }
                        className="text-gray-400 hover:text-red-600 transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && applications.length > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={totalApplications}
          onPageChange={goToPage}
        />
      )}

      {/* Application Details Drawer */}
      {selectedApplicationId && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50">
          <div className="w-full animate-in slide-in-from-right-full bg-white shadow-xl sm:max-w-md">
            {/* Header */}
            <div className="border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Application Details
              </h2>
              <button
                onClick={handleCloseDetail}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(100vh-120px)] p-4">
              {detailLoading ? (
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                </div>
              ) : detailError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {detailError}
                </div>
              ) : selectedApplicationDetail ? (
                <div className="space-y-4">
                  {/* Main Info */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      Job Position
                    </h3>
                    <p className="text-base font-medium text-gray-900">
                      {selectedApplicationDetail.job_title ||
                        selectedApplicationDetail.jobTitle ||
                        selectedApplicationDetail.job?.title ||
                        "N/A"}
                    </p>
                  </div>

                  {/* Candidate Info */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      Candidate
                    </h3>
                    <p className="font-medium text-gray-900">
                      {selectedApplicationDetail.candidate_name ||
                        selectedApplicationDetail.candidate?.name ||
                        "N/A"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedApplicationDetail.candidate_email ||
                        selectedApplicationDetail.candidate?.email ||
                        "N/A"}
                    </p>
                  </div>

                  {/* Company */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      Company
                    </h3>
                    <p className="text-sm text-gray-700">
                      {selectedApplicationDetail.company_name ||
                        selectedApplicationDetail.companyName ||
                        selectedApplicationDetail.job?.company?.name ||
                        "N/A"}
                    </p>
                  </div>

                  {/* Status */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      Status
                    </h3>
                    <span
                      className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${getStatusMeta(selectedApplicationDetail.status).className}`}
                    >
                      {getStatusMeta(selectedApplicationDetail.status).label}
                    </span>
                  </div>

                  {/* Application ID */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      Application ID
                    </h3>
                    <p className="text-sm text-gray-700">
                      {selectedApplicationDetail.id || "N/A"}
                    </p>
                  </div>

                  {/* Dates */}
                  <div className="pt-2 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      Dates
                    </h3>
                    <div className="space-y-2 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">Applied:</span>{" "}
                        {formatDate(
                          selectedApplicationDetail.applied_at ||
                            selectedApplicationDetail.appliedDate ||
                            selectedApplicationDetail.created_at,
                        ) || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Updated:</span>{" "}
                        {formatDate(selectedApplicationDetail.updated_at) ||
                          "N/A"}
                      </div>
                    </div>
                  </div>

                  {/* Additional Fields */}
                  {(selectedApplicationDetail.experience_required ||
                    selectedApplicationDetail.salary_range) && (
                    <div className="pt-2 border-t border-gray-200">
                      {selectedApplicationDetail.experience_required && (
                        <div className="mb-2">
                          <h3 className="text-xs font-semibold text-gray-900 mb-1">
                            Experience Required
                          </h3>
                          <p className="text-sm text-gray-700">
                            {selectedApplicationDetail.experience_required}
                          </p>
                        </div>
                      )}
                      {selectedApplicationDetail.salary_range && (
                        <div>
                          <h3 className="text-xs font-semibold text-gray-900 mb-1">
                            Salary Range
                          </h3>
                          <p className="text-sm text-gray-700">
                            {selectedApplicationDetail.salary_range}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, application: null })}
        onConfirm={handleDelete}
        title="Delete Application"
        message={`Are you sure you want to delete this application? This cannot be undone.`}
        confirmLabel="Delete"
        confirmStyle="danger"
      />
    </div>
  );
}
