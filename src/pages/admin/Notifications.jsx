import { useState, useEffect } from "react";
import { Eye, Trash2, Plus, X } from "lucide-react";
import { toast } from "react-toastify";
import SearchInput from "../../components/shared/SearchInput";
import FilterTabs from "../../components/shared/FilterTabs";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import Modal from "../../components/shared/Modal";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import ErrorState from "../../components/shared/ErrorState";
import EmptyState from "../../components/shared/EmptyState";
import Pagination from "../../components/shared/Pagination";
import { useDebounce, usePagination } from "../../hooks";
import { formatDate, timeAgo } from "../../utils/formatters";
import * as notificationService from "../../services/notificationService";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
];

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const { page, pageSize, goToPage } = usePagination();
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    notification: null,
  });
  const [sendModal, setSendModal] = useState(false);
  const [sendFormData, setSendFormData] = useState({
    title: "",
    message: "",
    recipient_type: "all",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = {
        search: debouncedSearch,
        page,
        limit: pageSize,
      };
      const res = await notificationService.getNotifications(params);
      setNotifications(res.data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [debouncedSearch, page]);

  const filteredNotifications = notifications.filter((n) => {
    if (statusFilter === "unread") return !n.read;
    if (statusFilter === "read") return n.read;
    return true;
  });

  const handleMarkAsRead = async (notification) => {
    try {
      await notificationService.markNotificationAsRead(notification.id);
      fetchNotifications();
    } catch (err) {
      toast.error("Failed to update notification");
    }
  };

  const handleDelete = async () => {
    try {
      await notificationService.deleteNotification(
        deleteConfirm.notification.id,
      );
      toast.success("Notification deleted successfully");
      setDeleteConfirm({ open: false, notification: null });
      fetchNotifications();
    } catch (err) {
      toast.error("Failed to delete notification");
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!sendFormData.title.trim() || !sendFormData.message.trim()) {
      toast.error("Title and message are required");
      return;
    }

    try {
      setSubmitting(true);
      await notificationService.sendNotification(sendFormData);
      toast.success("Notification sent successfully");
      setSendFormData({ title: "", message: "", recipient_type: "all" });
      setSendModal(false);
      fetchNotifications();
    } catch (err) {
      toast.error("Failed to send notification");
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <ErrorState
        title="Failed to load notifications"
        message={error}
        onRetry={fetchNotifications}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-600">
            Send and manage platform notifications
          </p>
        </div>
        <button
          onClick={() => setSendModal(true)}
          className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          <Plus size={18} />
          Send Notification
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-orange-100 bg-white p-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search notifications..."
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
        <LoadingSkeleton rows={5} columns={5} />
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          title="No notifications found"
          message="Try adjusting your search filters"
        />
      ) : (
        <div className="space-y-3 rounded-lg border border-orange-100 bg-white shadow-sm">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`border-b border-orange-50 p-4 hover:bg-orange-50 ${!notification.read ? "bg-orange-50" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-sm font-semibold ${!notification.read ? "text-gray-900" : "text-gray-700"}`}
                    >
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <span className="h-2 w-2 rounded-full bg-orange-500" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {notification.message}
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    {timeAgo(notification.created_at)}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  {!notification.read && (
                    <button
                      onClick={() => handleMarkAsRead(notification)}
                      className="text-gray-400 hover:text-orange-600"
                      title="Mark as read"
                    >
                      <Eye size={18} />
                    </button>
                  )}
                  <button
                    onClick={() =>
                      setDeleteConfirm({ open: true, notification })
                    }
                    className="text-gray-400 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredNotifications.length > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={filteredNotifications.length * 2}
          onPageChange={goToPage}
        />
      )}

      {/* Send Notification Modal */}
      <Modal
        isOpen={sendModal}
        onClose={() => {
          setSendModal(false);
          setSendFormData({ title: "", message: "", recipient_type: "all" });
        }}
        title="Send Notification"
      >
        <form onSubmit={handleSendNotification} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={sendFormData.title}
              onChange={(e) =>
                setSendFormData({ ...sendFormData, title: e.target.value })
              }
              placeholder="Notification title"
              className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Message *
            </label>
            <textarea
              value={sendFormData.message}
              onChange={(e) =>
                setSendFormData({ ...sendFormData, message: e.target.value })
              }
              placeholder="Notification message"
              rows={4}
              className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Send To
            </label>
            <select
              value={sendFormData.recipient_type}
              onChange={(e) =>
                setSendFormData({
                  ...sendFormData,
                  recipient_type: e.target.value,
                })
              }
              className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              disabled={submitting}
            >
              <option value="all">All Users</option>
              <option value="candidates">All Candidates</option>
              <option value="companies">All Companies</option>
              <option value="admins">All Admins</option>
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:bg-gray-300"
            >
              {submitting ? "Sending..." : "Send"}
            </button>
            <button
              type="button"
              onClick={() => setSendModal(false)}
              disabled={submitting}
              className="flex-1 rounded-lg border border-orange-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-orange-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, notification: null })}
        onConfirm={handleDelete}
        title="Delete Notification"
        message="Are you sure you want to delete this notification?"
        confirmLabel="Delete"
        confirmStyle="danger"
      />
    </div>
  );
}
