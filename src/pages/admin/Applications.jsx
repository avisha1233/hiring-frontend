import { useState, useEffect } from "react";
import { Eye, Trash2 } from "lucide-react";
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

export default function Applications() {
  const [applications, setApplications] = useState([]);
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
      setApplications(res.data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [debouncedSearch, statusFilter, page]);

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
                      {app.candidate_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {app.candidate_email}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-600">{app.job_title}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(app.created_at)}
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
                      <button className="text-gray-400 hover:text-orange-600">
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirm({ open: true, application: app })
                        }
                        className="text-gray-400 hover:text-red-600"
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
          total={applications.length * 2}
          onPageChange={goToPage}
        />
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
