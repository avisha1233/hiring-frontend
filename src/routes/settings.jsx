/* eslint-disable react-refresh/only-export-components */

/* eslint-disable react-refresh/only-export-components */

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CandidateLayout } from "@/components/candidate/CandidateLayout";
import { userSettingsApi } from "@/apis/candidate";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-(--dash-border) bg-white px-3 py-3">
      <span>
        <p className="m-0 text-sm font-medium text-(--dash-text)">{label}</p>
        {description ? (
          <p className="m-0 mt-0.5 text-xs text-(--dash-muted)">{description}</p>
        ) : null}
      </span>
      <button
        type="button"
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-(--dash-accent)" : "bg-gray-300"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${checked ? "left-5" : "left-0.5"}`}
        />
      </button>
    </label>
  );
}

function Toast({ item, onClose }) {
  const toneClass =
    item.type === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";
  return (
    <article className={`w-[320px] rounded-lg border px-4 py-3 shadow ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="m-0 text-sm font-medium">{item.message}</p>
        <button type="button" onClick={() => onClose(item.id)} className="text-xs font-semibold">
          Close
        </button>
      </div>
    </article>
  );
}

function SettingsPage() {
  const queryClient = useQueryClient();
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [preferencesForm, setPreferencesForm] = useState({
    notifications: {
      email: true,
      sms: false,
      jobAlerts: true,
      interviewUpdates: true,
    },
    privacy: {
      profileVisibility: "public",
      showContactInfo: true,
    },
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [toasts, setToasts] = useState([]);

  const pushToast = (type, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 2600);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  };

  const profileQuery = useQuery({
    queryKey: ["user", "settings", "profile"],
    queryFn: userSettingsApi.getProfile,
    retry: false,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!profileQuery.data) return;

    setProfileForm({
      fullName: profileQuery.data.fullName || "",
      email: profileQuery.data.email || "",
      phone: profileQuery.data.phone || "",
      location: profileQuery.data.location || "",
    });

    setPreferencesForm({
      notifications: {
        email: Boolean(profileQuery.data.notifications?.email),
        sms: Boolean(profileQuery.data.notifications?.sms),
        jobAlerts: Boolean(profileQuery.data.notifications?.jobAlerts),
        interviewUpdates: Boolean(profileQuery.data.notifications?.interviewUpdates),
      },
      privacy: {
        profileVisibility: profileQuery.data.privacy?.profileVisibility || "public",
        showContactInfo: Boolean(profileQuery.data.privacy?.showContactInfo),
      },
    });
  }, [profileQuery.data]);

  const profileErrors = useMemo(() => {
    const errors = {};
    if (!profileForm.fullName.trim()) {
      errors.fullName = "Full name is required";
    }

    if (!profileForm.email.trim()) {
      errors.email = "Email is required";
    } else if (!EMAIL_RE.test(profileForm.email.trim())) {
      errors.email = "Invalid email format";
    }

    if (profileForm.phone && !/^[+\d\s()-]{7,20}$/.test(profileForm.phone)) {
      errors.phone = "Phone format looks invalid";
    }

    return errors;
  }, [profileForm]);

  const passwordErrors = useMemo(() => {
    const errors = {};
    if (passwordForm.newPassword && passwordForm.newPassword.length < 6) {
      errors.newPassword = "Minimum 6 characters";
    }

    if (
      passwordForm.confirmPassword &&
      passwordForm.newPassword !== passwordForm.confirmPassword
    ) {
      errors.confirmPassword = "Passwords do not match";
    }

    return errors;
  }, [passwordForm]);

  const updateProfileMutation = useMutation({
    mutationFn: () => userSettingsApi.updateProfile(profileForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "settings", "profile"] });
      queryClient.invalidateQueries({ queryKey: ["candidate", "profile"] });
      queryClient.invalidateQueries({ queryKey: ["candidate", "settings"] });
      pushToast("success", "Account information updated");
    },
    onError: (error) => {
      pushToast("error", error?.response?.data?.message || "Failed to update account information");
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: () => userSettingsApi.updatePassword(passwordForm),
    onSuccess: () => {
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      pushToast("success", "Password updated successfully");
    },
    onError: (error) => {
      pushToast("error", error?.response?.data?.message || "Failed to update password");
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: () => userSettingsApi.updateSettings(preferencesForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "settings", "profile"] });
      pushToast("success", "Preferences updated successfully");
    },
    onError: (error) => {
      pushToast("error", error?.response?.data?.message || "Failed to update preferences");
    },
  });

  const passwordDisabled =
    updatePasswordMutation.isPending ||
    !passwordForm.currentPassword ||
    !passwordForm.newPassword ||
    !passwordForm.confirmPassword ||
    Object.keys(passwordErrors).length > 0;

  const profileDisabled =
    updateProfileMutation.isPending || Object.keys(profileErrors).length > 0;

  return (
    <CandidateLayout title="Settings" subtitle="Manage your account settings">
      <div className="fixed right-4 top-4 z-[60] space-y-2">
        {toasts.map((item) => (
          <Toast key={item.id} item={item} onClose={removeToast} />
        ))}
      </div>

      <section className="space-y-4">
        <div className="rounded-xl border border-(--dash-border) bg-(--dash-surface) px-4 py-3 shadow-(--dash-shadow)">
          <p className="m-0 text-xs font-semibold uppercase tracking-[0.12em] text-(--dash-muted)">
            Dashboard / Settings
          </p>
        </div>

        {profileQuery.isPending ? (
          <div className="space-y-3">
            <div className="h-28 animate-pulse rounded-xl bg-(--dash-accent-soft)" />
            <div className="h-28 animate-pulse rounded-xl bg-(--dash-accent-soft)" />
            <div className="h-28 animate-pulse rounded-xl bg-(--dash-accent-soft)" />
          </div>
        ) : null}

        {profileQuery.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Unable to load settings at the moment.
          </div>
        ) : null}

        {!profileQuery.isPending ? (
          <>
            <section className="rounded-xl border border-(--dash-border) bg-(--dash-surface) p-5 shadow-(--dash-shadow)">
              <h3 className="m-0 text-base font-semibold text-(--dash-text)">Account Information</h3>
              <p className="m-0 mt-1 text-sm text-(--dash-muted)">Update your personal account details.</p>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="text-sm text-(--dash-muted)">
                  Full Name
                  <input
                    value={profileForm.fullName}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, fullName: event.target.value }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-(--dash-border) bg-white px-3 text-sm text-(--dash-text) outline-none focus:border-(--dash-accent)"
                  />
                  {profileErrors.fullName ? (
                    <p className="m-0 mt-1 text-xs text-red-600">{profileErrors.fullName}</p>
                  ) : null}
                </label>

                <label className="text-sm text-(--dash-muted)">
                  Email
                  <input
                    value={profileForm.email}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-(--dash-border) bg-white px-3 text-sm text-(--dash-text) outline-none focus:border-(--dash-accent)"
                  />
                  {profileErrors.email ? (
                    <p className="m-0 mt-1 text-xs text-red-600">{profileErrors.email}</p>
                  ) : null}
                </label>

                <label className="text-sm text-(--dash-muted)">
                  Phone Number
                  <input
                    value={profileForm.phone}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, phone: event.target.value }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-(--dash-border) bg-white px-3 text-sm text-(--dash-text) outline-none focus:border-(--dash-accent)"
                  />
                  {profileErrors.phone ? (
                    <p className="m-0 mt-1 text-xs text-red-600">{profileErrors.phone}</p>
                  ) : null}
                </label>

                <label className="text-sm text-(--dash-muted)">
                  Location
                  <input
                    value={profileForm.location}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, location: event.target.value }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-(--dash-border) bg-white px-3 text-sm text-(--dash-text) outline-none focus:border-(--dash-accent)"
                  />
                </label>
              </div>

              <button
                type="button"
                disabled={profileDisabled}
                onClick={() => updateProfileMutation.mutate()}
                className="mt-4 rounded-lg bg-(--dash-accent) px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </section>

            <section className="rounded-xl border border-(--dash-border) bg-(--dash-surface) p-5 shadow-(--dash-shadow)">
              <h3 className="m-0 text-base font-semibold text-(--dash-text)">Password &amp; Security</h3>
              <p className="m-0 mt-1 text-sm text-(--dash-muted)">Keep your account secure with a strong password.</p>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                {[
                  { key: "currentPassword", label: "Current Password", flag: "current" },
                  { key: "newPassword", label: "New Password", flag: "next" },
                  { key: "confirmPassword", label: "Confirm Password", flag: "confirm" },
                ].map((item) => (
                  <label key={item.key} className="text-sm text-(--dash-muted)">
                    {item.label}
                    <div className="mt-1 flex items-center rounded-lg border border-(--dash-border) bg-white px-3">
                      <input
                        type={showPasswords[item.flag] ? "text" : "password"}
                        value={passwordForm[item.key]}
                        onChange={(event) =>
                          setPasswordForm((prev) => ({ ...prev, [item.key]: event.target.value }))
                        }
                        className="h-10 w-full bg-transparent text-sm text-(--dash-text) outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((prev) => ({ ...prev, [item.flag]: !prev[item.flag] }))
                        }
                        className="text-(--dash-muted)"
                      >
                        {showPasswords[item.flag] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {passwordErrors[item.key] ? (
                      <p className="m-0 mt-1 text-xs text-red-600">{passwordErrors[item.key]}</p>
                    ) : null}
                  </label>
                ))}
              </div>

              <button
                type="button"
                disabled={passwordDisabled}
                onClick={() => updatePasswordMutation.mutate()}
                className="mt-4 rounded-lg bg-(--dash-accent) px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updatePasswordMutation.isPending ? "Updating..." : "Update Password"}
              </button>
            </section>

            <section className="rounded-xl border border-(--dash-border) bg-(--dash-surface) p-5 shadow-(--dash-shadow)">
              <h3 className="m-0 text-base font-semibold text-(--dash-text)">Notifications Preferences</h3>
              <p className="m-0 mt-1 text-sm text-(--dash-muted)">Choose how you want to receive updates.</p>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <Toggle
                  checked={preferencesForm.notifications.email}
                  onChange={(value) =>
                    setPreferencesForm((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, email: value },
                    }))
                  }
                  label="Email Notifications"
                />
                <Toggle
                  checked={preferencesForm.notifications.sms}
                  onChange={(value) =>
                    setPreferencesForm((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, sms: value },
                    }))
                  }
                  label="SMS Notifications"
                />
                <Toggle
                  checked={preferencesForm.notifications.jobAlerts}
                  onChange={(value) =>
                    setPreferencesForm((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, jobAlerts: value },
                    }))
                  }
                  label="Job Alerts"
                />
                <Toggle
                  checked={preferencesForm.notifications.interviewUpdates}
                  onChange={(value) =>
                    setPreferencesForm((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, interviewUpdates: value },
                    }))
                  }
                  label="Interview Updates"
                />
              </div>
            </section>

            <section className="rounded-xl border border-(--dash-border) bg-(--dash-surface) p-5 shadow-(--dash-shadow)">
              <h3 className="m-0 text-base font-semibold text-(--dash-text)">Privacy Settings</h3>
              <p className="m-0 mt-1 text-sm text-(--dash-muted)">Control visibility and contact sharing.</p>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="rounded-lg border border-(--dash-border) bg-white px-3 py-3 text-sm text-(--dash-muted)">
                  Profile Visibility
                  <select
                    value={preferencesForm.privacy.profileVisibility}
                    onChange={(event) =>
                      setPreferencesForm((prev) => ({
                        ...prev,
                        privacy: {
                          ...prev.privacy,
                          profileVisibility: event.target.value,
                        },
                      }))
                    }
                    className="mt-2 h-10 w-full rounded-lg border border-(--dash-border) bg-white px-3 text-sm text-(--dash-text) outline-none focus:border-(--dash-accent)"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </label>

                <Toggle
                  checked={preferencesForm.privacy.showContactInfo}
                  onChange={(value) =>
                    setPreferencesForm((prev) => ({
                      ...prev,
                      privacy: { ...prev.privacy, showContactInfo: value },
                    }))
                  }
                  label="Show Contact Info"
                  description="Allow companies to view your phone and location."
                />
              </div>

              <button
                type="button"
                disabled={updatePreferencesMutation.isPending}
                onClick={() => updatePreferencesMutation.mutate()}
                className="mt-4 rounded-lg bg-(--dash-accent) px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updatePreferencesMutation.isPending ? "Saving..." : "Save Preferences"}
              </button>
            </section>
          </>
        ) : null}
      </section>
    </CandidateLayout>
  );
}
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-(--dash-border) bg-white px-3 py-3">
      <span>
        <p className="m-0 text-sm font-medium text-(--dash-text)">{label}</p>
        {description ? (
          <p className="m-0 mt-0.5 text-xs text-(--dash-muted)">{description}</p>
        ) : null}
      </span>
      <button
        type="button"
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-(--dash-accent)" : "bg-gray-300"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${checked ? "left-5" : "left-0.5"}`}
        />
      </button>
    </label>
  );
}

function Toast({ item, onClose }) {
  const toneClass = item.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700";
  return (
    <article className={`w-[320px] rounded-lg border px-4 py-3 shadow ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="m-0 text-sm font-medium">{item.message}</p>
        <button type="button" onClick={() => onClose(item.id)} className="text-xs font-semibold">Close</button>
      </div>
    </article>
  );
}

function SettingsPage() {
  const queryClient = useQueryClient();
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [preferencesForm, setPreferencesForm] = useState({
    notifications: {
      email: true,
      sms: false,
      jobAlerts: true,
      interviewUpdates: true,
    },
    privacy: {
      profileVisibility: "public",
      showContactInfo: true,
    },
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [toasts, setToasts] = useState([]);

  const pushToast = (type, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 2600);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  };

  const profileQuery = useQuery({
    queryKey: ["user", "settings", "profile"],
    queryFn: userSettingsApi.getProfile,
    retry: false,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!profileQuery.data) return;

    setProfileForm({
      fullName: profileQuery.data.fullName || "",
      email: profileQuery.data.email || "",
      phone: profileQuery.data.phone || "",
      location: profileQuery.data.location || "",
    });

    setPreferencesForm({
      notifications: {
        email: Boolean(profileQuery.data.notifications?.email),
        sms: Boolean(profileQuery.data.notifications?.sms),
        jobAlerts: Boolean(profileQuery.data.notifications?.jobAlerts),
        interviewUpdates: Boolean(profileQuery.data.notifications?.interviewUpdates),
      },
      privacy: {
        profileVisibility: profileQuery.data.privacy?.profileVisibility || "public",
        showContactInfo: Boolean(profileQuery.data.privacy?.showContactInfo),
      },
    });
  }, [profileQuery.data]);

  const profileErrors = useMemo(() => {
    const errors = {};
    if (!profileForm.fullName.trim()) {
      errors.fullName = "Full name is required";
    }

    if (!profileForm.email.trim()) {
      errors.email = "Email is required";
    } else if (!EMAIL_RE.test(profileForm.email.trim())) {
      errors.email = "Invalid email format";
    }

    if (profileForm.phone && !/^[+\d\s()-]{7,20}$/.test(profileForm.phone)) {
      errors.phone = "Phone format looks invalid";
    }

    return errors;
  }, [profileForm]);

  const passwordErrors = useMemo(() => {
    const errors = {};
    if (passwordForm.newPassword && passwordForm.newPassword.length < 6) {
      errors.newPassword = "Minimum 6 characters";
    }

    if (
      passwordForm.confirmPassword &&
      passwordForm.newPassword !== passwordForm.confirmPassword
    ) {
      errors.confirmPassword = "Passwords do not match";
    }

    return errors;
  }, [passwordForm]);

  const updateProfileMutation = useMutation({
    mutationFn: () => userSettingsApi.updateProfile(profileForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "settings", "profile"] });
      queryClient.invalidateQueries({ queryKey: ["candidate", "profile"] });
      queryClient.invalidateQueries({ queryKey: ["candidate", "settings"] });
      pushToast("success", "Account information updated");
    },
    onError: (error) => {
      pushToast("error", error?.response?.data?.message || "Failed to update account information");
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: () => userSettingsApi.updatePassword(passwordForm),
    onSuccess: () => {
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      pushToast("success", "Password updated successfully");
    },
    onError: (error) => {
      pushToast("error", error?.response?.data?.message || "Failed to update password");
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: () => userSettingsApi.updateSettings(preferencesForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "settings", "profile"] });
      pushToast("success", "Preferences updated successfully");
    },
    onError: (error) => {
      pushToast("error", error?.response?.data?.message || "Failed to update preferences");
    },
  });

  const passwordDisabled =
    updatePasswordMutation.isPending ||
    !passwordForm.currentPassword ||
    !passwordForm.newPassword ||
    !passwordForm.confirmPassword ||
    Object.keys(passwordErrors).length > 0;

  const profileDisabled =
    updateProfileMutation.isPending || Object.keys(profileErrors).length > 0;

  return (
    <CandidateLayout title="Settings" subtitle="Manage your account settings">
      <div className="fixed right-4 top-4 z-[60] space-y-2">
        {toasts.map((item) => (
          <Toast key={item.id} item={item} onClose={removeToast} />
        ))}
      </div>

      <section className="space-y-4">
        <div className="rounded-xl border border-(--dash-border) bg-(--dash-surface) px-4 py-3 shadow-(--dash-shadow)">
          <p className="m-0 text-xs font-semibold uppercase tracking-[0.12em] text-(--dash-muted)">
            Dashboard / Settings
          </p>
        </div>

        {profileQuery.isPending ? (
          <div className="space-y-3">
            <div className="h-28 animate-pulse rounded-xl bg-(--dash-accent-soft)" />
            <div className="h-28 animate-pulse rounded-xl bg-(--dash-accent-soft)" />
            <div className="h-28 animate-pulse rounded-xl bg-(--dash-accent-soft)" />
          </div>
        ) : null}

        {profileQuery.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Unable to load settings at the moment.
          </div>
        ) : null}

        {!profileQuery.isPending ? (
          <>
            <section className="rounded-xl border border-(--dash-border) bg-(--dash-surface) p-5 shadow-(--dash-shadow)">
              <h3 className="m-0 text-base font-semibold text-(--dash-text)">Account Information</h3>
              <p className="m-0 mt-1 text-sm text-(--dash-muted)">Update your personal account details.</p>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="text-sm text-(--dash-muted)">
                  Full Name
                  <input
                    value={profileForm.fullName}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, fullName: event.target.value }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-(--dash-border) bg-white px-3 text-sm text-(--dash-text) outline-none focus:border-(--dash-accent)"
                  />
                  {profileErrors.fullName ? (
                    <p className="m-0 mt-1 text-xs text-red-600">{profileErrors.fullName}</p>
                  ) : null}
                </label>

                <label className="text-sm text-(--dash-muted)">
                  Email
                  <input
                    value={profileForm.email}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-(--dash-border) bg-white px-3 text-sm text-(--dash-text) outline-none focus:border-(--dash-accent)"
                  />
                  {profileErrors.email ? (
                    <p className="m-0 mt-1 text-xs text-red-600">{profileErrors.email}</p>
                  ) : null}
                </label>

                <label className="text-sm text-(--dash-muted)">
                  Phone Number
                  <input
                    value={profileForm.phone}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, phone: event.target.value }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-(--dash-border) bg-white px-3 text-sm text-(--dash-text) outline-none focus:border-(--dash-accent)"
                  />
                  {profileErrors.phone ? (
                    <p className="m-0 mt-1 text-xs text-red-600">{profileErrors.phone}</p>
                  ) : null}
                </label>

                <label className="text-sm text-(--dash-muted)">
                  Location
                  <input
                    value={profileForm.location}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, location: event.target.value }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-(--dash-border) bg-white px-3 text-sm text-(--dash-text) outline-none focus:border-(--dash-accent)"
                  />
                </label>
              </div>

              <button
                type="button"
                disabled={profileDisabled}
                onClick={() => updateProfileMutation.mutate()}
                className="mt-4 rounded-lg bg-(--dash-accent) px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </section>

            <section className="rounded-xl border border-(--dash-border) bg-(--dash-surface) p-5 shadow-(--dash-shadow)">
              <h3 className="m-0 text-base font-semibold text-(--dash-text)">Password &amp; Security</h3>
              <p className="m-0 mt-1 text-sm text-(--dash-muted)">Keep your account secure with a strong password.</p>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                {[
                  { key: "currentPassword", label: "Current Password", flag: "current" },
                  { key: "newPassword", label: "New Password", flag: "next" },
                  { key: "confirmPassword", label: "Confirm Password", flag: "confirm" },
                ].map((item) => (
                  <label key={item.key} className="text-sm text-(--dash-muted)">
                    {item.label}
                    <div className="mt-1 flex items-center rounded-lg border border-(--dash-border) bg-white px-3">
                      <input
                        type={showPasswords[item.flag] ? "text" : "password"}
                        value={passwordForm[item.key]}
                        onChange={(event) =>
                          setPasswordForm((prev) => ({ ...prev, [item.key]: event.target.value }))
                        }
                        className="h-10 w-full bg-transparent text-sm text-(--dash-text) outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((prev) => ({ ...prev, [item.flag]: !prev[item.flag] }))
                        }
                        className="text-(--dash-muted)"
                      >
                        {showPasswords[item.flag] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {passwordErrors[item.key] ? (
                      <p className="m-0 mt-1 text-xs text-red-600">{passwordErrors[item.key]}</p>
                    ) : null}
                  </label>
                ))}
              </div>

              <button
                type="button"
                disabled={passwordDisabled}
                onClick={() => updatePasswordMutation.mutate()}
                className="mt-4 rounded-lg bg-(--dash-accent) px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updatePasswordMutation.isPending ? "Updating..." : "Update Password"}
              </button>
            </section>

            <section className="rounded-xl border border-(--dash-border) bg-(--dash-surface) p-5 shadow-(--dash-shadow)">
              <h3 className="m-0 text-base font-semibold text-(--dash-text)">Notifications Preferences</h3>
              <p className="m-0 mt-1 text-sm text-(--dash-muted)">Choose how you want to receive updates.</p>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <Toggle
                  checked={preferencesForm.notifications.email}
                  onChange={(value) =>
                    setPreferencesForm((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, email: value },
                    }))
                  }
                  label="Email Notifications"
                />
                <Toggle
                  checked={preferencesForm.notifications.sms}
                  onChange={(value) =>
                    setPreferencesForm((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, sms: value },
                    }))
                  }
                  label="SMS Notifications"
                />
                <Toggle
                  checked={preferencesForm.notifications.jobAlerts}
                  onChange={(value) =>
                    setPreferencesForm((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, jobAlerts: value },
                    }))
                  }
                  label="Job Alerts"
                />
                <Toggle
                  checked={preferencesForm.notifications.interviewUpdates}
                  onChange={(value) =>
                    setPreferencesForm((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, interviewUpdates: value },
                    }))
                  }
                  label="Interview Updates"
                />
              </div>
            </section>

            <section className="rounded-xl border border-(--dash-border) bg-(--dash-surface) p-5 shadow-(--dash-shadow)">
              <h3 className="m-0 text-base font-semibold text-(--dash-text)">Privacy Settings</h3>
              <p className="m-0 mt-1 text-sm text-(--dash-muted)">Control visibility and contact sharing.</p>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="rounded-lg border border-(--dash-border) bg-white px-3 py-3 text-sm text-(--dash-muted)">
                  Profile Visibility
                  <select
                    value={preferencesForm.privacy.profileVisibility}
                    onChange={(event) =>
                      setPreferencesForm((prev) => ({
                        ...prev,
                        privacy: {
                          ...prev.privacy,
                          profileVisibility: event.target.value,
                        },
                      }))
                    }
                    className="mt-2 h-10 w-full rounded-lg border border-(--dash-border) bg-white px-3 text-sm text-(--dash-text) outline-none focus:border-(--dash-accent)"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </label>

                <Toggle
                  checked={preferencesForm.privacy.showContactInfo}
                  onChange={(value) =>
                    setPreferencesForm((prev) => ({
                      ...prev,
                      privacy: { ...prev.privacy, showContactInfo: value },
                    }))
                  }
                  label="Show Contact Info"
                  description="Allow companies to view your phone and location."
                />
              </div>

              <button
                type="button"
                disabled={updatePreferencesMutation.isPending}
                onClick={() => updatePreferencesMutation.mutate()}
                className="mt-4 rounded-lg bg-(--dash-accent) px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updatePreferencesMutation.isPending ? "Saving..." : "Save Preferences"}
              </button>
            </section>
          </>
        ) : null}
      </section>
    </CandidateLayout>
  );
}
