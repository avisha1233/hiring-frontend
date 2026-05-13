import { useState, useEffect } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
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
import { formatDate, formatDateTime } from "../../utils/formatters";
import * as interviewService from "../../services/interviewService";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function Interviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const { page, pageSize, goToPage } = usePagination();
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    interview: null,
  });

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const params = {
        search: debouncedSearch,
        status: statusFilter !== "all" ? statusFilter : undefined,
        page,
        limit: pageSize,
      };
      const res = await interviewService.getInterviews(params);
      setInterviews(res.data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [debouncedSearch, statusFilter, page]);

  const handleDelete = async () => {
    try {
      await interviewService.deleteInterview(deleteConfirm.interview.id);
      toast.success("Interview deleted successfully");
      setDeleteConfirm({ open: false, interview: null });
      fetchInterviews();
    } catch (err) {
      toast.error("Failed to delete interview");
    }
  };

  if (error) {
    return (
      <ErrorState
        title="Failed to load interviews"
        message={error}
        onRetry={fetchInterviews}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
        <p className="text-sm text-gray-600">
          Manage scheduled interviews and feedback
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-orange-100 bg-white p-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by candidate name..."
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
      ) : interviews.length === 0 ? (
        <EmptyState
          title="No interviews found"
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
                  Interview Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {interviews.map((interview) => (
                <tr
                  key={interview.id}
                  className="border-b border-orange-50 hover:bg-orange-50"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">
                      {interview.candidate_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {interview.candidate_email}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-600">
                      {interview.job_title}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDateTime(
                      interview.scheduled_at || interview.created_at,
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                      {interview.type || "Phone"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={interview.status}>
                      {interview.status}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="text-gray-400 hover:text-orange-600">
                        <Eye size={18} />
                      </button>
                      <button className="text-gray-400 hover:text-orange-600">
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirm({ open: true, interview })
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
      {!loading && interviews.length > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={interviews.length * 2}
          onPageChange={goToPage}
        />
      )}

      {/* Modals */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, interview: null })}
        onConfirm={handleDelete}
        title="Delete Interview"
        message={`Are you sure you want to delete this interview? This cannot be undone.`}
        confirmLabel="Delete"
        confirmStyle="danger"
      />
    </div>
  );
}
