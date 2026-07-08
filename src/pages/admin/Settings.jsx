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
  const [systemSettings, setSystemSettings] = useState([]);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [changingPassword, setChangingPassword] = useState(false);
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
        promise.then((v) => ({ ok: true, value: v })).catch((e) => ({ ok: false, error: e }));


      const [settingsRes, profileRes, logsRes] = await Promise.all([
        settle(settingService.getSettings()),
        settle(userService.getCurrentUser()),
        settle(settingService.getAuditLog({ page, limit: pageSize })),
      ]);

      const fetchedSettings = settingsRes.ok ? (settingsRes.value.data || []) : [];
      setSystemSettings(Array.isArray(fetchedSettings) ? fetchedSettings : []);

      setAdminProfile(profileRes.ok ? (profileRes.value.data?.data || profileRes.value.data || {}) : {});
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

  const handleSettingChange = (index, newValue) => {
    const updated = [...systemSettings];
    updated[index] = { ...updated[index], value: String(newValue) };
    setSystemSettings(updated);
  };

  const handleImageChange = (index, file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleSettingChange(index, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }
    try {
      setChangingPassword(true);
      const res = await userService.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
        confirmPassword: passwords.confirmPassword,
      });
      if (res.ok) {
        toast.success("Password changed successfully");
        setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        toast.error(res.error || "Failed to change password");
      }
    } catch (error) {
      toast.error("An error occurred while changing password");
    } finally {
      setChangingPassword(false);
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

        {/* Change Password */}
        <div className="rounded-lg border border-orange-100 bg-white p-6 shadow-sm col-span-1 lg:col-span-1">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Change Password
          </h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                disabled={changingPassword}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                disabled={changingPassword}
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                disabled={changingPassword}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-orange-500 bg-orange-50 text-orange-600 px-4 py-2 text-sm font-medium hover:bg-orange-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300"
            >
              Update Password
            </button>
          </form>
        </div>

        {/* System Settings */}
        <div className="rounded-lg border border-orange-100 bg-white p-6 shadow-sm col-span-1 lg:col-span-2">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            System Settings
          </h3>
          <form onSubmit={handleUpdateSettings} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.isArray(systemSettings) && systemSettings.map((setting, idx) => (
                <div key={setting.id || setting.key}>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 capitalize">
                    {setting.key.replace(/_/g, ' ')}
                  </label>
                  {setting.type.toLowerCase() === 'boolean' ? (
                    <label className="flex items-center gap-2 cursor-pointer py-2">
                      <input
                        type="checkbox"
                        checked={setting.value === 'true'}
                        onChange={(e) => handleSettingChange(idx, e.target.checked)}
                        disabled={updating}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-600">Enabled</span>
                    </label>
                  ) : setting.type.toLowerCase() === 'number' ? (
                    <input
                      type="number"
                      value={setting.value}
                      onChange={(e) => handleSettingChange(idx, e.target.value)}
                      className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      disabled={updating}
                    />
                  ) : setting.type.toLowerCase() === 'image' ? (
                    <div className="flex items-center gap-4 py-1">
                      {setting.value && setting.value !== "#" && (
                        <img src={setting.value} alt={setting.key} className="h-12 w-12 object-contain rounded border border-gray-200" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(idx, e.target.files[0])}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                        disabled={updating}
                      />
                    </div>
                  ) : setting.type.toLowerCase() === 'text' ? (
                    <textarea
                      value={setting.value}
                      onChange={(e) => handleSettingChange(idx, e.target.value)}
                      className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      disabled={updating}
                      rows={2}
                    />
                  ) : (
                    <input
                      type="text"
                      value={setting.value}
                      onChange={(e) => handleSettingChange(idx, e.target.value)}
                      className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      disabled={updating}
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={updating}
              className="mt-4 w-full md:w-auto flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-6 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:bg-gray-300"
            >
              <Save size={18} />
              Save Settings
            </button>
          </form>
        </div>
      </div>


    </div>
  );
}
