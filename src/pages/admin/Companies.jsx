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
import * as companyService from "../../services/companyService";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "blocked", label: "Blocked" },
];

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const { page, pageSize, goToPage } = usePagination();
  const [selected, setSelected] = useState([]);
  const [blockModal, setBlockModal] = useState({ open: false, company: null });
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    company: null,
  });
  const [blockingCompany, setBlockingCompany] = useState(null);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const params = {
        search: debouncedSearch,
        status: statusFilter !== "all" ? statusFilter : undefined,
        page,
        limit: pageSize,
      };
      const res = await companyService.getCompanies(params);
      setCompanies(res.data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [debouncedSearch, statusFilter, page]);

  const handleBlock = async (reason) => {
    try {
      setBlockingCompany(blockModal.company.id);
      await companyService.blockCompany(blockModal.company.id, reason);
      toast.success(`Company ${blockModal.company.name} has been blocked`);
      setBlockModal({ open: false, company: null });
      fetchCompanies();
    } catch (err) {
      toast.error("Failed to block company");
    } finally {
      setBlockingCompany(null);
    }
  };

  const handleUnblock = async (company) => {
    try {
      await companyService.unblockCompany(company.id);
      toast.success(`Company ${company.name} has been unblocked`);
      fetchCompanies();
    } catch (err) {
      toast.error("Failed to unblock company");
    }
  };

  const handleDelete = async () => {
    try {
      await companyService.deleteCompany(deleteConfirm.company.id);
      toast.success("Company deleted successfully");
      setDeleteConfirm({ open: false, company: null });
      fetchCompanies();
    } catch (err) {
      toast.error("Failed to delete company");
    }
  };

  if (error) {
    return (
      <ErrorState
        title="Failed to load companies"
        message={error}
        onRetry={fetchCompanies}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-sm text-gray-600">
            Manage registered companies and their status
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600">
          <Plus size={18} />
          Add Company
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-orange-100 bg-white p-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by company name or location..."
          disabled={loading}
        />
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
        <LoadingSkeleton rows={5} columns={5} />
      ) : companies.length === 0 ? (
        <EmptyState
          title="No companies found"
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
                  Company
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
              {companies.map((company) => (
                <tr
                  key={company.id}
                  className="border-b border-orange-50 hover:bg-orange-50"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(company.id)}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? [...selected, company.id]
                            : selected.filter((id) => id !== company.id),
                        )
                      }
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={company.name} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {company.name}
                        </p>
                        <p className="text-xs text-gray-500">{company.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {company.location || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={company.status}>
                      {company.status}
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
                      {company.status !== "blocked" ? (
                        <button
                          onClick={() => setBlockModal({ open: true, company })}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <ShieldX size={18} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnblock(company)}
                          className="text-gray-400 hover:text-green-600"
                        >
                          <ShieldCheck size={18} />
                        </button>
                      )}
                      <button
                        onClick={() =>
                          setDeleteConfirm({ open: true, company })
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
      {!loading && companies.length > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={companies.length * 2}
          onPageChange={goToPage}
        />
      )}

      {/* Modals */}
      <BlockConfirmModal
        isOpen={blockModal.open}
        onClose={() => setBlockModal({ open: false, company: null })}
        onConfirm={handleBlock}
        name={blockModal.company?.name}
        type="company"
        impact="This company will not be able to post new jobs or message candidates."
        loading={blockingCompany === blockModal.company?.id}
      />

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, company: null })}
        onConfirm={handleDelete}
        title="Delete Company"
        message={`Are you sure you want to delete ${deleteConfirm.company?.name}? This cannot be undone.`}
        confirmLabel="Delete"
        confirmStyle="danger"
      />
    </div>
  );
}
