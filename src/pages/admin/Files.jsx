import { useState, useEffect } from "react";
import { Download, Eye, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { FileText, File, Image } from "lucide-react";
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
import * as fileService from "../../services/fileService";

const TYPE_TABS = [
  { value: "all", label: "All" },
  { value: "resume", label: "Resume" },
  { value: "portfolio", label: "Portfolio" },
  { value: "other", label: "Other" },
];

const getFileIcon = (fileType) => {
  if (fileType === "resume") return FileText;
  if (fileType === "portfolio") return Image;
  return File;
};

export default function Files() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [typeFilter, setTypeFilter] = useState("all");
  const { page, pageSize, goToPage } = usePagination();
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    file: null,
  });

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const params = {
        search: debouncedSearch,
        type: typeFilter !== "all" ? typeFilter : undefined,
        page,
        limit: pageSize,
      };
      const res = await fileService.getFiles(params);
      setFiles(res.data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [debouncedSearch, typeFilter, page]);

  const handleDownload = async (file) => {
    try {
      await fileService.downloadFile(file.id);
      toast.success("File download started");
    } catch (err) {
      toast.error("Failed to download file");
    }
  };

  const handleDelete = async () => {
    try {
      await fileService.deleteFile(deleteConfirm.file.id);
      toast.success("File deleted successfully");
      setDeleteConfirm({ open: false, file: null });
      fetchFiles();
    } catch (err) {
      toast.error("Failed to delete file");
    }
  };

  const stats = {
    total: files.length,
    resumes: files.filter((f) => f.type === "resume").length,
    portfolios: files.filter((f) => f.type === "portfolio").length,
  };

  if (error) {
    return (
      <ErrorState
        title="Failed to load files"
        message={error}
        onRetry={fetchFiles}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Files</h1>
        <p className="text-sm text-gray-600">
          Manage uploaded resumes and portfolios
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard title="Total Files" value={stats.total} icon={File} />
        <MetricCard title="Resumes" value={stats.resumes} icon={FileText} />
        <MetricCard title="Portfolios" value={stats.portfolios} icon={Image} />
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-orange-100 bg-white p-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by file name or candidate..."
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
      ) : files.length === 0 ? (
        <EmptyState
          title="No files found"
          message="Try adjusting your search filters"
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-orange-100 bg-white shadow-sm">
          <table className="w-full">
            <thead className="border-b border-orange-100 bg-orange-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  File Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Uploaded By
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Size
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Uploaded Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr
                  key={file.id}
                  className="border-b border-orange-50 hover:bg-orange-50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {file.type === "resume" ? (
                        <FileText size={18} className="text-blue-600" />
                      ) : file.type === "portfolio" ? (
                        <Image size={18} className="text-green-600" />
                      ) : (
                        <File size={18} className="text-gray-600" />
                      )}
                      <p className="font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-600">
                      {file.uploaded_by || "-"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                        file.type === "resume"
                          ? "bg-blue-100 text-blue-700"
                          : file.type === "portfolio"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {file.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {file.size ? `${(file.size / 1024).toFixed(2)} KB` : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(file.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleDownload(file)}
                        className="text-gray-400 hover:text-orange-600"
                        title="Download"
                      >
                        <Download size={18} />
                      </button>
                      <button
                        className="text-gray-400 hover:text-orange-600"
                        title="Preview"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ open: true, file })}
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
      {!loading && files.length > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={files.length * 2}
          onPageChange={goToPage}
        />
      )}

      {/* Modals */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, file: null })}
        onConfirm={handleDelete}
        title="Delete File"
        message={`Are you sure you want to delete "${deleteConfirm.file?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmStyle="danger"
      />
    </div>
  );
}
