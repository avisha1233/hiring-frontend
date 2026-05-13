import { useState, useEffect } from "react";
import { Eye, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import SearchInput from "../../components/shared/SearchInput";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import ErrorState from "../../components/shared/ErrorState";
import EmptyState from "../../components/shared/EmptyState";
import Pagination from "../../components/shared/Pagination";
import Avatar from "../../components/shared/Avatar";
import { useDebounce, usePagination } from "../../hooks";
import { formatDate, timeAgo } from "../../utils/formatters";
import * as messageService from "../../services/messageService";

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const { page, pageSize, goToPage } = usePagination();
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    conversation: null,
  });

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const params = {
        search: debouncedSearch,
        page,
        limit: pageSize,
      };
      const res = await messageService.getConversations(params);
      setConversations(res.data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [debouncedSearch, page]);

  const handleDelete = async () => {
    try {
      await messageService.deleteConversation(deleteConfirm.conversation.id);
      toast.success("Conversation deleted successfully");
      setDeleteConfirm({ open: false, conversation: null });
      fetchConversations();
    } catch (err) {
      toast.error("Failed to delete conversation");
    }
  };

  if (error) {
    return (
      <ErrorState
        title="Failed to load conversations"
        message={error}
        onRetry={fetchConversations}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-sm text-gray-600">
          Monitor conversations between candidates and companies
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-orange-100 bg-white p-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by participant name..."
          disabled={loading}
        />
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSkeleton rows={5} columns={6} />
      ) : conversations.length === 0 ? (
        <EmptyState
          title="No conversations found"
          message="Try adjusting your search filters"
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-orange-100 bg-white shadow-sm">
          <table className="w-full">
            <thead className="border-b border-orange-100 bg-orange-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Participants
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Job Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Messages
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Last Activity
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Started
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {conversations.map((conv) => (
                <tr
                  key={conv.id}
                  className="border-b border-orange-50 hover:bg-orange-50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        <Avatar name={conv.candidate_name} size="sm" />
                        <Avatar name={conv.company_name} size="sm" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900">
                          {conv.candidate_name} • {conv.company_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {conv.candidate_email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-600">
                      {conv.job_title || "-"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <span className="inline-block rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700">
                      {conv.message_count || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {conv.last_message_at ? timeAgo(conv.last_message_at) : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(conv.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="text-gray-400 hover:text-orange-600">
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirm({ open: true, conversation: conv })
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
      {!loading && conversations.length > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={conversations.length * 2}
          onPageChange={goToPage}
        />
      )}

      {/* Modals */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, conversation: null })}
        onConfirm={handleDelete}
        title="Delete Conversation"
        message="Are you sure you want to delete this conversation? This cannot be undone."
        confirmLabel="Delete"
        confirmStyle="danger"
      />
    </div>
  );
}
