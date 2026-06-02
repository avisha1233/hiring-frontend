import { useState, useEffect } from "react";
import { Save, AlertTriangle, Eye, EyeOff, LogOut, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import ErrorState from "../../components/shared/ErrorState";
import EmptyState from "../../components/shared/EmptyState";
import Pagination from "../../components/shared/Pagination";
import { usePagination } from "../../hooks";
import { formatDate, formatDateTime } from "../../utils/formatters";
import * as settingService from "../../services/settingService";
import * as userService from "../../services/userService";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminProfile, setAdminProfile] = useState({});
  const [systemSettings, setSystemSettings] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false });
  const { page, pageSize, goToPage } = usePagination();

  useEffect(() => {
    fetchSettings();
  }, [page]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const settle = (promise) =>
        promise.then((v) => ({ok: true, value: v})).catch((e) => ({ok: false, error:  e}));


      const [settingsRes, profileRes, logsRes] = await Promise.all([
        settingService.getSettings(),
        userService.getCurrentUser(),
        settingService.getAuditLog({ page, limit: pageSize }),
      ]);

      setSystemSettings(settingsRes.ok ? (settingsRes.value.data || {}) : {});
      setAdminProfile(profileRes.ok ? (profileRes.value.data || {}) : {});
      setAuditLogs(
        logsRes.ok
          ? (logsRes.value.data?.data || logsRes.value.data || [])
          : [],
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      await userService.updateUser(adminProfile.id, {
        full_name: adminProfile.full_name,
        email: adminProfile.email,
        phone: adminProfile.phone,
      });
      toast.success("Profile updated successfully");
      fetchSettings();
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      await settingService.updateSettings(systemSettings);
      toast.success("Settings updated successfully");
      fetchSettings();
    } catch (err) {
      toast.error("Failed to update settings");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await userService.deleteUser(adminProfile.id);
      toast.success("Account deleted successfully");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("authUser");
      localStorage.removeItem("token");
      window.location.href = "/login";
    } catch (err) {
      toast.error("Failed to delete account");
    }
  };

  if (error) {
    return (
      <ErrorState
        title="Failed to load settings"
        message={error}
        onRetry={fetchSettings}
      />
    );
  }

  if (loading) {
    return <LoadingSkeleton rows={6} columns={1} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-600">
          Manage your account and system configuration
        </p>
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Admin Profile */}
        <div className="rounded-lg border border-orange-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Admin Profile
          </h3>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={adminProfile.full_name || ""}
                onChange={(e) =>
                  setAdminProfile({
                    ...adminProfile,
                    full_name: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                disabled={updating}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={adminProfile.email || ""}
                onChange={(e) =>
                  setAdminProfile({ ...adminProfile, email: e.target.value })
                }
                className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                disabled={updating}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={adminProfile.phone || ""}
                onChange={(e) =>
                  setAdminProfile({ ...adminProfile, phone: e.target.value })
                }
                className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                disabled={updating}
              />
            </div>

            <button
              type="submit"
              disabled={updating}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:bg-gray-300"
            >
              <Save size={18} />
              Save Changes
            </button>
          </form>
        </div>

        {/* System Settings */}
        <div className="rounded-lg border border-orange-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            System Settings
          </h3>
          <form onSubmit={handleUpdateSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Max Upload Size (MB)
              </label>
              <input
                type="number"
                value={systemSettings.max_upload_size || 10}
                onChange={(e) =>
                  setSystemSettings({
                    ...systemSettings,
                    max_upload_size: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                disabled={updating}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Notifications
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={systemSettings.email_notifications || false}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      email_notifications: e.target.checked,
                    })
                  }
                  disabled={updating}
                  className="rounded"
                />
                <span className="text-sm text-gray-600">
                  Email Notifications
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={systemSettings.sms_notifications || false}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      sms_notifications: e.target.checked,
                    })
                  }
                  disabled={updating}
                  className="rounded"
                />
                <span className="text-sm text-gray-600">SMS Notifications</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={updating}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:bg-gray-300"
            >
              <Save size={18} />
              Save Settings
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="rounded-lg border border-red-100 bg-red-50 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={20} className="text-red-600" />
            <h3 className="text-lg font-semibold text-red-900">Danger Zone</h3>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-red-900 mb-2">
                Change Password
              </h4>
              <button
                onClick={() =>
                  toast.info("Password change feature coming soon")
                }
                className="w-full rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                Reset Password
              </button>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-red-900 mb-2">
                End All Sessions
              </h4>
              <button
                onClick={() =>
                  toast.info("Logout all sessions feature coming soon")
                }
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                <LogOut size={16} />
                Logout All Sessions
              </button>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-red-900 mb-2">
                Delete Account
              </h4>
              <button
                onClick={() => setDeleteConfirm({ open: true })}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-600 bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                <Trash2 size={16} />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-lg border border-orange-100 bg-white shadow-sm">
        <div className="border-b border-orange-100 bg-orange-50 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Audit Log</h3>
          <p className="text-xs text-gray-500">
            System activity and security events
          </p>
        </div>

        {auditLogs.length === 0 ? (
          <EmptyState
            title="No audit logs"
            message="System events will appear here"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-orange-100 bg-orange-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-orange-50 hover:bg-orange-50"
                  >
                    <td className="px-6 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                          log.action === "create"
                            ? "bg-green-100 text-green-700"
                            : log.action === "update"
                              ? "bg-blue-100 text-blue-700"
                              : log.action === "delete"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {log.resource || "-"}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {log.user_name || "-"}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {log.ip_address || "-"}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {formatDateTime(log.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && auditLogs.length > 0 && (
          <div className="border-t border-orange-100 px-6 py-4">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={auditLogs.length * 2}
              onPageChange={goToPage}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false })}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to permanently delete your admin account? This action cannot be undone and all your data will be lost."
        confirmLabel="Delete My Account"
        confirmStyle="danger"
      />
    </div>
  );
}
