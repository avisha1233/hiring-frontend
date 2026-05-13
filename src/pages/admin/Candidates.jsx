import { useState, useEffect } from "react";
import { Eye, ShieldX, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import SearchInput from "../../components/shared/SearchInput";
import FilterTabs from "../../components/shared/FilterTabs";
import BulkActionBar from "../../components/shared/BulkActionBar";
import BlockConfirmModal from "../../components/shared/BlockConfirmModal";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import ErrorState from "../../components/shared/ErrorState";
import EmptyState from "../../components/shared/EmptyState";
import Pagination from "../../components/shared/Pagination";
import Avatar from "../../components/shared/Avatar";
import StatusBadge from "../../components/shared/StatusBadge";
import { useDebounce, usePagination } from "../../hooks";
import { formatDate } from "../../utils/formatters";
import * as candidateService from "../../services/candidateService";
import * as userService from "../../services/userService";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "blocked", label: "Blocked" },
];

const EXPERIENCE_LEVELS = [
  { value: "any", label: "Any Experience" },
  { value: "0-2", label: "0-2 years" },
  { value: "3-5", label: "3-5 years" },
  { value: "5+", label: "5+ years" },
];

export default function Candidates() {
  const [candidates, setcandidates] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expFilter, setExpFilter] = useState("any");
  const { page, pageSize, goToPage } = usePagination();
  const [selected, setSelected] = useState([]);
  const [blockModal, setBlockModal] = useState({
    open: false,
    candidate: null,
  });
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    candidate: null,
  });
  const [blockingCandidate, setBlockingCandidate] = useState(null);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const params = {
        search: debouncedSearch,
        page,
        limit: pageSize,
      };
      const res = await candidateService.getCandidates(params);
      setcandidates(res.data.data || []);

      const usersRes = await userService.getUsers();
      const userMap = {};
      usersRes.data.data.forEach((u) => {
        userMap[u.id] = u;
      });
      setUsers(userMap);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [debouncedSearch, page]);

  const handleBlock = async (reason) => {
    try {
      setBlockingCandidate(blockModal.candidate.user_id);
      await candidateService.blockCandidate(
        blockModal.candidate.user_id,
        reason,
      );
      toast.success(`Candidate has been blocked`);
      setBlockModal({ open: false, candidate: null });
      fetchCandidates();
    } catch (err) {
      toast.error("Failed to block candidate");
    } finally {
      setBlockingCandidate(null);
    }
  };

  const handleUnblock = async (candidate) => {
    try {
      await candidateService.unblockCandidate(candidate.user_id);
      toast.success("Candidate has been unblocked");
      fetchCandidates();
    } catch (err) {
      toast.error("Failed to unblock candidate");
    }
  };

  const handleDelete = async () => {
    try {
      await candidateService.deleteCandidate(deleteConfirm.candidate.id);
      toast.success("Candidate deleted successfully");
      setDeleteConfirm({ open: false, candidate: null });
      fetchCandidates();
    } catch (err) {
      toast.error("Failed to delete candidate");
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    if (statusFilter !== "all" && users[c.user_id]?.status !== statusFilter)
      return false;
    if (expFilter !== "any") {
      const exp = c.experience || 0;
      if (expFilter === "0-2" && exp > 2) return false;
      if (expFilter === "3-5" && (exp < 3 || exp > 5)) return false;
      if (expFilter === "5+" && exp < 5) return false;
    }
    return true;
  });

  if (error) {
    return (
      <ErrorState
        title="Failed to load candidates"
        message={error}
        onRetry={fetchCandidates}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
        <p className="text-sm text-gray-600">Manage platform candidates</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 rounded-lg border border-orange-100 bg-white p-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or email..."
          disabled={loading}
        />
        <select
          value={expFilter}
          onChange={(e) => setExpFilter(e.target.value)}
          className="rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          {EXPERIENCE_LEVELS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
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

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selected.length}
        onBlock={() => toast.info("Bulk block feature coming soon")}
        onDelete={() => toast.info("Bulk delete feature coming soon")}
        onClear={() => setSelected([])}
      />

      {/* Table */}
      {loading ? (
        <LoadingSkeleton rows={5} columns={6} />
      ) : filteredCandidates.length === 0 ? (
        <EmptyState
          title="No candidates found"
          message="Try adjusting your search filters"
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-orange-100 bg-white shadow-sm">
          <table className="w-full">
            <thead className="border-b border-orange-100 bg-orange-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Candidate
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Experience
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Location
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
              {filteredCandidates.map((candidate) => {
                const user = users[candidate.user_id];
                if (!user) return null;
                return (
                  <tr
                    key={candidate.id}
                    className="border-b border-orange-50 hover:bg-orange-50"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(candidate.id)}
                        onChange={(e) =>
                          setSelected(
                            e.target.checked
                              ? [...selected, candidate.id]
                              : selected.filter((id) => id !== candidate.id),
                          )
                        }
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={candidate.full_name} size="sm" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {candidate.full_name}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {candidate.experience || 0} years
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {candidate.location || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={user.status}>
                        {user.status}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="text-gray-400 hover:text-orange-600">
                          <Eye size={18} />
                        </button>
                        {user.status !== "blocked" ? (
                          <button
                            onClick={() =>
                              setBlockModal({ open: true, candidate })
                            }
                            className="text-gray-400 hover:text-red-600"
                          >
                            <ShieldX size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnblock(candidate)}
                            className="text-gray-400 hover:text-green-600"
                          >
                            <ShieldCheck size={18} />
                          </button>
                        )}
                        <button
                          onClick={() =>
                            setDeleteConfirm({ open: true, candidate })
                          }
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
      {!loading && filteredCandidates.length > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={filteredCandidates.length * 2}
          onPageChange={goToPage}
        />
      )}

      {/* Modals */}
      <BlockConfirmModal
        isOpen={blockModal.open}
        onClose={() => setBlockModal({ open: false, candidate: null })}
        onConfirm={handleBlock}
        name={blockModal.candidate?.full_name}
        type="candidate"
        impact="This candidate will not be able to apply to jobs or message companies."
        loading={blockingCandidate === blockModal.candidate?.user_id}
      />

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, candidate: null })}
        onConfirm={handleDelete}
        title="Delete Candidate"
        message={`Are you sure you want to delete this candidate? This cannot be undone.`}
        confirmLabel="Delete"
        confirmStyle="danger"
      />
    </div>
  );
}
