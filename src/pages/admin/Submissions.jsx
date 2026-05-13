import { useState, useEffect } from "react";
import { Eye, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { Upload, CheckCircle, XCircle, Clock } from "lucide-react";
import SearchInput from "../../components/shared/SearchInput";
import FilterTabs from "../../components/shared/FilterTabs";
import MetricCard from "../../components/shared/MetricCard";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import ErrorState from "../../components/shared/ErrorState";
import EmptyState from "../../components/shared/EmptyState";
import Pagination from "../../components/shared/Pagination";
import { useDebounce, usePagination } from "../../hooks";
import { formatDate } from "../../utils/formatters";
import * as submissionService from "../../services/submissionService";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "evaluated", label: "Evaluated" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const getScoreColor = (score) => {
  if (score >= 80) return "bg-orange-100 text-orange-700";
  if (score >= 60) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
};

export default function Submissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const { page, pageSize, goToPage } = usePagination();
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    submission: null,
  });

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const params = {
        search: debouncedSearch,
        status: statusFilter !== "all" ? statusFilter : undefined,
        page,
        limit: pageSize,
      };
      const res = await submissionService.getSubmissions(params);
      setSubmissions(res.data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [debouncedSearch, statusFilter, page]);

  const handleDelete = async () => {
    try {
      await submissionService.deleteSubmission(deleteConfirm.submission.id);
      toast.success("Submission deleted successfully");
      setDeleteConfirm({ open: false, submission: null });
      fetchSubmissions();
    } catch (err) {
      toast.error("Failed to delete submission");
    }
  };

  const stats = {
    total: submissions.length,
    evaluated: submissions.filter(
      (s) => s.score !== null && s.score !== undefined,
    ).length,
    approved: submissions.filter((s) => s.status === "approved").length,
    rejected: submissions.filter((s) => s.status === "rejected").length,
  };

  if (error) {
    return (
      <ErrorState
        title="Failed to load submissions"
        message={error}
        onRetry={fetchSubmissions}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Submissions</h1>
        <p className="text-sm text-gray-600">
          Track and evaluate submission scores
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Submissions"
          value={stats.total}
          icon={Upload}
        />
        <MetricCard
          title="Evaluated"
          value={stats.evaluated}
          icon={CheckCircle}
        />
        <MetricCard
          title="Approved"
          value={stats.approved}
          icon={CheckCircle}
          color="green"
        />
        <MetricCard
          title="Rejected"
          value={stats.rejected}
          icon={XCircle}
          color="red"
        />
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
      ) : submissions.length === 0 ? (
        <EmptyState
          title="No submissions found"
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
                  Assignment
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Submitted
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => (
                <tr
                  key={submission.id}
                  className="border-b border-orange-50 hover:bg-orange-50"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">
                      {submission.candidate_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {submission.candidate_email}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-600">
                      {submission.assignment_title || "Submission"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                        submission.score !== null &&
                        submission.score !== undefined
                          ? getScoreColor(submission.score)
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {submission.score !== null &&
                      submission.score !== undefined
                        ? `${submission.score}%`
                        : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                        submission.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : submission.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : submission.status === "evaluated"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {submission.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(submission.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="text-gray-400 hover:text-orange-600">
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirm({ open: true, submission })
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
      {!loading && submissions.length > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={submissions.length * 2}
          onPageChange={goToPage}
        />
      )}

      {/* Modals */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, submission: null })}
        onConfirm={handleDelete}
        title="Delete Submission"
        message={`Are you sure you want to delete this submission? This cannot be undone.`}
        confirmLabel="Delete"
        confirmStyle="danger"
      />
    </div>
  );
}
