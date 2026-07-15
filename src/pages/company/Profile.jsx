// src/pages/company/Profile.jsx

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Eye, EyeOff } from "lucide-react";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import Avatar from "../../components/shared/Avatar";
import { getCompanyProfile, updateCompanyProfile } from "@/apis/company";
import { apiClient } from "@/apis/api";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    location: "",
    website_url: "",
    logo_url: "",
  });
  const [initial, setInitial] = useState(null);

  // ── password change state ──────────────────────────────────────────────────
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── load company profile ──────────────────────────────────────────────────
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await getCompanyProfile();
      const data = res?.data || res || {};

      const merged = {
        name: data.name || "",
        location: data.location || "",
        website_url: data.website_url || "",
        logo_url: data.logo_url || "",
      };

      setForm(merged);
      setInitial(merged);
    } catch (err) {
      toast.error(err?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // ── unsaved-changes detection (identical to candidate Profile) ────────────
  const hasUnsaved = useMemo(() => {
    if (!initial) return false;
    return JSON.stringify(initial) !== JSON.stringify(form);
  }, [initial, form]);

  useEffect(() => {
    const beforeUnload = (e) => {
      if (!hasUnsaved) return;
      e.preventDefault();
      e.returnValue = "You have unsaved changes.";
      return "You have unsaved changes.";
    };

    const origPush = window.history.pushState;
    const origReplace = window.history.replaceState;

    function confirmAndRun(fn) {
      return function (...args) {
        if (hasUnsaved) {
          const ok = window.confirm(
            "You have unsaved changes. Leave without saving?",
          );
          if (!ok) return;
        }
        return fn.apply(this, args);
      };
    }

    window.addEventListener("beforeunload", beforeUnload);
    window.history.pushState = confirmAndRun(origPush);
    window.history.replaceState = confirmAndRun(origReplace);

    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.history.pushState = origPush;
      window.history.replaceState = origReplace;
    };
  }, [hasUnsaved]);

  // ── save company profile ──────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCompanyProfile({
        name: form.name,
        location: form.location,
        website_url: form.website_url,
        logo_url: form.logo_url,
      });
      toast.success("Profile updated successfully");
      setInitial({ ...form });
    } catch (err) {
      const errorMessage =
        err?.payload?.errors?.[0]?.msg ||
        err?.payload?.message ||
        err?.message ||
        "Failed to save profile";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // ── handle change password ───────────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      toast.error("All password fields are required");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    setUpdatingPassword(true);
    try {
      await apiClient.patch("/user/password", passwordForm);
      toast.success("Password updated successfully");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      const errorMessage =
        err?.payload?.message ||
        err?.message ||
        "Failed to update password";
      toast.error(errorMessage);
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) return <LoadingSkeleton rows={6} columns={6} />;

  return (
    <div className="space-y-4">
      {/* ── page title ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-600">Manage your company information</p>
      </div>

      {/* ── left info card + right edit form ── */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[320px,1fr]">
        {/* ── left: company info card ── */}
        <aside className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm h-fit">
          <div className="flex flex-col items-center gap-3">
            {/* show logo if available, otherwise use Avatar initials */}
            {form.logo_url ? (
              <img
                src={form.logo_url}
                alt="company logo"
                className="h-20 w-20 rounded-xl object-cover border border-orange-100"
              />
            ) : (
              <Avatar name={form.name || "Company"} size="xl" />
            )}
            <p className="m-0 text-lg font-semibold text-gray-900">
              {form.name || "Company"}
            </p>
            {form.website_url && (
              <a
                href={form.website_url}
                target="_blank"
                rel="noreferrer"
                className="m-0 text-sm text-orange-500 hover:underline"
              >
                {form.website_url}
              </a>
            )}
          </div>

          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <p className="m-0">Location: {form.location || "—"}</p>
            <p className="m-0">
              Website:{" "}
              {form.website_url ? (
                <a
                  href={form.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-orange-500 hover:underline"
                >
                  {form.website_url}
                </a>
              ) : (
                "—"
              )}
            </p>
            <p className="m-0">
              Logo URL:{" "}
              {form.logo_url ? (
                <span className="break-all">{form.logo_url}</span>
              ) : (
                "—"
              )}
            </p>
          </div>
        </aside>

        {/* ── right: forms ── */}
        <div className="space-y-4">
          {/* edit details form */}
          <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm">
            <h2 className="text-md font-bold text-gray-900 mb-3">Company Details</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Company Name"
                  className="h-10 rounded-lg border border-orange-100 px-3 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
                />
                <input
                  value={form.location}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, location: e.target.value }))
                  }
                  placeholder="Location"
                  className="h-10 rounded-lg border border-orange-100 px-3 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
                />
                <input
                  value={form.website_url}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, website_url: e.target.value }))
                  }
                  placeholder="Website URL"
                  className="h-10 rounded-lg border border-orange-100 px-3 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
                />
                <input
                  value={form.logo_url}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, logo_url: e.target.value }))
                  }
                  placeholder="Logo URL (Optional)"
                  className="h-10 rounded-lg border border-orange-100 px-3 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save"}
                </button>

                {hasUnsaved && (
                  <span className="text-sm text-orange-600">
                    You have unsaved changes
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Change Password Form */}
          <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm">
            <h2 className="text-md font-bold text-gray-900 mb-3">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({
                        ...p,
                        currentPassword: e.target.value,
                      }))
                    }
                    placeholder="Current Password"
                    className="h-10 w-full rounded-lg border border-orange-100 pl-3 pr-10 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({
                        ...p,
                        newPassword: e.target.value,
                      }))
                    }
                    placeholder="New Password"
                    className="h-10 w-full rounded-lg border border-orange-100 pl-3 pr-10 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({
                        ...p,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder="Confirm New Password"
                    className="h-10 w-full rounded-lg border border-orange-100 pl-3 pr-10 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
                >
                  {updatingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

    </div>
  );
}
