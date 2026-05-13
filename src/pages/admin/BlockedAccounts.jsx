import { useState, useEffect } from "react";
import { ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { Users, Building2, UserX } from "lucide-react";
import SearchInput from "../../components/shared/SearchInput";
import FilterTabs from "../../components/shared/FilterTabs";
import MetricCard from "../../components/shared/MetricCard";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import ErrorState from "../../components/shared/ErrorState";
import EmptyState from "../../components/shared/EmptyState";
import Pagination from "../../components/shared/Pagination";
import Avatar from "../../components/shared/Avatar";
import { useDebounce, usePagination } from "../../hooks";
import { formatDate } from "../../utils/formatters";
import * as userService from "../../services/userService";
import * as companyService from "../../services/companyService";

const TYPE_TABS = [
  { value: "all", label: "All" },
  { value: "user", label: "Users" },
  { value: "company", label: "Companies" },
];

export default function BlockedAccounts() {
  const [blockedAccounts, setBlockedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [typeFilter, setTypeFilter] = useState("all");
  const { page, pageSize, goToPage } = usePagination();
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    account: null,
  });

  const fetchBlockedAccounts = async () => {
    try {
      setLoading(true);
      const [usersRes, companiesRes] = await Promise.all([
        userService.getUsers({ status: "blocked" }),
        companyService.getCompanies({ status: "blocked" }),
      ]);

      const accounts = [
        ...(usersRes.data.data || []).map((u) => ({ ...u, type: "user" })),
        ...(companiesRes.data.data || []).map((c) => ({
          ...c,
          type: "company",
        })),
      ];

      setBlockedAccounts(accounts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedAccounts();
  }, []);

  const handleUnblock = async (account) => {
    try {
      if (account.type === "user") {
        await userService.unblockUser(account.id);
        toast.success(`User ${account.full_name} has been unblocked`);
      } else {
        await companyService.unblockCompany(account.id);
        toast.success(`Company ${account.name} has been unblocked`);
      }
      fetchBlockedAccounts();
    } catch (err) {
      toast.error("Failed to unblock account");
    }
  };

  const handleDelete = async () => {
    try {
      const account = deleteConfirm.account;
      if (account.type === "user") {
        await userService.deleteUser(account.id);
      } else {
        await companyService.deleteCompany(account.id);
      }
      toast.success("Account deleted successfully");
      setDeleteConfirm({ open: false, account: null });
      fetchBlockedAccounts();
    } catch (err) {
      toast.error("Failed to delete account");
    }
  };

  const filteredAccounts = blockedAccounts.filter((acc) => {
    if (typeFilter !== "all" && acc.type !== typeFilter) return false;
    const searchTerm = debouncedSearch.toLowerCase();
    const name = (acc.full_name || acc.name || "").toLowerCase();
    const email = (acc.email || "").toLowerCase();
    return name.includes(searchTerm) || email.includes(searchTerm);
  });

  const totalBlocked = blockedAccounts.length;
  const blockedCompanies = blockedAccounts.filter(
    (a) => a.type === "company",
  ).length;
  const blockedCandidates = blockedAccounts.filter(
    (a) => a.type === "user",
  ).length;

  if (error) {
    return (
      <ErrorState
        title="Failed to load blocked accounts"
        message={error}
        onRetry={fetchBlockedAccounts}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Blocked Accounts</h1>
        <p className="text-sm text-gray-600">
          Manage blocked users and companies
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard title="Total Blocked" value={totalBlocked} icon={UserX} />
        <MetricCard
          title="Blocked Companies"
          value={blockedCompanies}
          icon={Building2}
        />
        <MetricCard
          title="Blocked Users"
          value={blockedCandidates}
          icon={Users}
        />
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-orange-100 bg-white p-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or email..."
          disabled={loading}
        />
      </div>

      {/* Type Tabs */}
      <FilterTabs
        tabs={TYPE_TABS}
        active={typeFilter}
        onChange={setTypeFilter}
      />

      {/* Table */}
      {loading ? (
        <LoadingSkeleton rows={5} columns={5} />
      ) : filteredAccounts.length === 0 ? (
        <EmptyState
          title={
            typeFilter === "all"
              ? "No blocked accounts"
              : `No blocked ${typeFilter}s`
          }
          message="Try adjusting your search filters"
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-orange-100 bg-white shadow-sm">
          <table className="w-full">
            <thead className="border-b border-orange-100 bg-orange-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Account
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Block Reason
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Blocked Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account) => (
                <tr
                  key={`${account.type}-${account.id}`}
                  className="border-b border-orange-50 hover:bg-orange-50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={account.full_name || account.name}
                        size="sm"
                      />
                      <div>
                        <p className="font-medium text-gray-900">
                          {account.full_name || account.name}
                        </p>
                        <p className="text-xs text-gray-500">{account.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                        account.type === "user"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {account.type === "user" ? "User" : "Company"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {account.block_reason || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(account.blocked_at || account.updated_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleUnblock(account)}
                        className="text-gray-400 hover:text-green-600"
                        title="Unblock"
                      >
                        <ShieldCheck size={18} />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirm({ open: true, account })
                        }
                        className="text-gray-400 hover:text-red-600"
                        title="Delete"
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
      {!loading && filteredAccounts.length > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={filteredAccounts.length * 2}
          onPageChange={goToPage}
        />
      )}

      {/* Modals */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, account: null })}
        onConfirm={handleDelete}
        title="Delete Blocked Account"
        message={`Are you sure you want to permanently delete this ${deleteConfirm.account?.type}? This cannot be undone.`}
        confirmLabel="Delete"
        confirmStyle="danger"
      />
    </div>
  );
}
