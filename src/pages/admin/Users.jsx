import { useState, useEffect } from "react";
import { Eye, Pencil, ShieldX, ShieldCheck, Trash2, Plus } from "lucide-react";
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
import { ROLE_COLORS } from "../../utils/constants";
import * as userService from "../../services/userService";

const ROLES = [
  { value: "all", label: "All Roles" },
  { value: "admin", label: "Admin" },
  { value: "company", label: "Company" },
  { value: "candidate", label: "Candidate" },
];

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "blocked", label: "Blocked" },
];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { page, pageSize, goToPage } = usePagination();
  const [selected, setSelected] = useState([]);
  const [blockModal, setBlockModal] = useState({ open: false, user: null });
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    user: null,
  });
  const [blockingUser, setBlockingUser] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        search: debouncedSearch,
        role: roleFilter !== "all" ? roleFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        page,
        limit: pageSize,
      };
      const res = await userService.getUsers(params);
      setUsers(res.data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [debouncedSearch, roleFilter, statusFilter, page]);

  const handleBlock = async (reason) => {
    try {
      setBlockingUser(blockModal.user.id);
      await userService.blockUser(blockModal.user.id, reason);
      toast.success(`User ${blockModal.user.full_name} has been blocked`);
      setBlockModal({ open: false, user: null });
      fetchUsers();
    } catch (err) {
      toast.error("Failed to block user");
    } finally {
      setBlockingUser(null);
    }
  };

  const handleUnblock = async (user) => {
    try {
      await userService.unblockUser(user.id);
      toast.success(`User ${user.full_name} has been unblocked`);
      fetchUsers();
    } catch (err) {
      toast.error("Failed to unblock user");
    }
  };

  const handleDelete = async () => {
    try {
      await userService.deleteUser(deleteConfirm.user.id);
      toast.success("User deleted successfully");
      setDeleteConfirm({ open: false, user: null });
      fetchUsers();
    } catch (err) {
      toast.error("Failed to delete user");
    }
  };

  const handleBulkBlock = () => {
    if (selected.length > 0) {
      toast.info("Bulk block feature coming soon");
    }
  };

  const handleBulkDelete = () => {
    if (selected.length > 0) {
      toast.info("Bulk delete feature coming soon");
    }
  };

  if (error) {
    return (
      <ErrorState
        title="Failed to load users"
        message={error}
        onRetry={fetchUsers}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-600">
            Manage platform users and their permissions
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600">
          <Plus size={18} />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-orange-100 bg-white p-4">
        <div className="flex flex-wrap items-center gap-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name or email..."
            disabled={loading}
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
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
        onBlock={handleBulkBlock}
        onDelete={handleBulkDelete}
        onClear={() => setSelected([])}
      />

      {/* Table */}
      {loading ? (
        <LoadingSkeleton rows={5} columns={6} />
      ) : users.length === 0 ? (
        <EmptyState
          title="No users found"
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
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Joined
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-orange-50 hover:bg-orange-50"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(user.id)}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? [...selected, user.id]
                            : selected.filter((id) => id !== user.id),
                        )
                      }
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.full_name} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.full_name}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${ROLE_COLORS[user.role] || "bg-gray-100 text-gray-700"}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={user.status}>
                      {user.status}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="text-gray-400 hover:text-orange-600">
                        <Eye size={18} />
                      </button>
                      <button className="text-gray-400 hover:text-orange-600">
                        <Pencil size={18} />
                      </button>
                      {user.status !== "blocked" ? (
                        <button
                          onClick={() => setBlockModal({ open: true, user })}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <ShieldX size={18} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnblock(user)}
                          className="text-gray-400 hover:text-green-600"
                        >
                          <ShieldCheck size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteConfirm({ open: true, user })}
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
      {!loading && users.length > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={users.length * 2}
          onPageChange={goToPage}
        />
      )}

      {/* Modals */}
      <BlockConfirmModal
        isOpen={blockModal.open}
        onClose={() => setBlockModal({ open: false, user: null })}
        onConfirm={handleBlock}
        name={blockModal.user?.full_name}
        type="user"
        loading={blockingUser === blockModal.user?.id}
      />

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, user: null })}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${deleteConfirm.user?.full_name}? This cannot be undone.`}
        confirmLabel="Delete"
        confirmStyle="danger"
      />
    </div>
  );
}
