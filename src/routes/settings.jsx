/* eslint-disable react-refresh/only-export-components */

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { getSettings, updateSettings } from "@/apis/settings";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { ToastStack } from "@/components/jobs/ToastStack";
import { SettingsButton } from "@/components/settings/SettingsButton";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { SettingsInput } from "@/components/settings/SettingsInput";
import { SettingsToggle } from "@/components/settings/SettingsToggle";
import { clearAuthSession, getAuthUser } from "@/lib/auth";

const EMPTY_ERRORS = {
  platform_name: "",
  support_email: "",
  backend_api_url: "",
};

const DEFAULT_FORM = {
  platform_name: "",
  support_email: "",
  backend_api_url: "",
  notifications_new_users: true,
  notifications_new_companies: true,
  notifications_job_posting_alerts: false,
  notifications_weekly_reports: true,
  security_two_factor_auth: false,
  security_auto_logout_inactive: true,
  security_login_activity_logging: true,
};

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState("");
  const [form, setForm] = useState(DEFAULT_FORM);
  const [fieldErrors, setFieldErrors] = useState(EMPTY_ERRORS);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "success") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  };

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
    staleTime: 30_000,
    retry: false,
  });

  useEffect(() => {
    if (!settingsQuery.data) return;
    setForm((prev) => ({
      ...prev,
      ...settingsQuery.data,
    }));
  }, [settingsQuery.data]);

  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: (data) => {
      setForm((prev) => ({ ...prev, ...data }));
      setFieldErrors(EMPTY_ERRORS);
      addToast("Settings saved successfully.");
    },
    onError: (error) => {
      console.error("Failed to update settings", error);

      const serverErrors = error?.payload?.errors;
      if (Array.isArray(serverErrors)) {
        const nextErrors = { ...EMPTY_ERRORS };
        serverErrors.forEach((item) => {
          if (item?.field && Object.hasOwn(nextErrors, item.field)) {
            nextErrors[item.field] = item.message || "Invalid value";
          }
        });
        setFieldErrors(nextErrors);
      }

      addToast(error?.message || "Failed to save settings.", "error");
    },
  });

  const validateForm = () => {
    const nextErrors = { ...EMPTY_ERRORS };

    if (!String(form.platform_name || "").trim()) {
      nextErrors.platform_name = "Platform name is required";
    }

    const emailValue = String(form.support_email || "").trim();
    if (!emailValue) {
      nextErrors.support_email = "Support email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailValue)) {
        nextErrors.support_email = "Support email must be valid";
      }
    }

    const urlValue = String(form.backend_api_url || "").trim();
    if (!urlValue) {
      nextErrors.backend_api_url = "Backend API URL is required";
    } else {
      try {
        const url = new URL(urlValue);
        if (!["http:", "https:"].includes(url.protocol)) {
          nextErrors.backend_api_url =
            "Backend API URL must start with http:// or https://";
        }
      } catch {
        nextErrors.backend_api_url = "Backend API URL must be valid";
      }
    }

    setFieldErrors(nextErrors);
    return Object.values(nextErrors).every((value) => !value);
  };

  const handleSave = () => {
    if (!validateForm()) {
      addToast("Please fix validation errors before saving.", "error");
      return;
    }

    updateMutation.mutate({
      platform_name: String(form.platform_name || "").trim(),
      support_email: String(form.support_email || "").trim(),
      backend_api_url: String(form.backend_api_url || "").trim(),
      notifications_new_users: Boolean(form.notifications_new_users),
      notifications_new_companies: Boolean(form.notifications_new_companies),
      notifications_job_posting_alerts: Boolean(
        form.notifications_job_posting_alerts,
      ),
      notifications_weekly_reports: Boolean(form.notifications_weekly_reports),
      security_two_factor_auth: Boolean(form.security_two_factor_auth),
      security_auto_logout_inactive: Boolean(
        form.security_auto_logout_inactive,
      ),
      security_login_activity_logging: Boolean(
        form.security_login_activity_logging,
      ),
    });
  };

  const isBusy = settingsQuery.isPending || updateMutation.isPending;

  const sectionVisible = useMemo(() => {
    const value = headerSearch.trim().toLowerCase();
    if (!value) {
      return {
        general: true,
        notifications: true,
        security: true,
      };
    }

    return {
      general: "general settings platform name support email backend api url"
        .toLowerCase()
        .includes(value),
      notifications:
        "notifications new user notifications new company notifications job posting alerts weekly reports"
          .toLowerCase()
          .includes(value),
      security:
        "security two-factor authentication auto-logout inactive sessions login activity logging"
          .toLowerCase()
          .includes(value),
    };
  }, [headerSearch]);

  const currentUser = getAuthUser();

  return (
    <div className="bg-(--dash-bg) text-(--dash-text)">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        user={currentUser}
        onLogout={() => {
          clearAuthSession();
          window.location.assign("/login");
        }}
      />

      <div
        className={`h-screen transition-all duration-300 ${
          collapsed ? "lg:ml-23" : "lg:ml-80"
        }`}
      >
        <div className="flex h-full flex-col">
          <SettingsHeader
            onMenuClick={() => setMobileOpen(true)}
            searchValue={headerSearch}
            onSearchChange={setHeaderSearch}
          />

          <main className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-8">
            {settingsQuery.isError ? (
              <section className="rounded-2xl border border-[#fed7aa] bg-[#fff7ed] p-6">
                <h3 className="m-0 text-lg font-semibold text-[#9a3412]">
                  Failed to load settings
                </h3>
                <p className="m-0 mt-2 text-sm text-[#c2410c]">
                  {settingsQuery.error?.message ||
                    "Unable to load settings right now."}
                </p>
                <button
                  type="button"
                  onClick={() => settingsQuery.refetch()}
                  className="mt-4 rounded-xl bg-(--dash-accent) px-4 py-2 text-sm font-semibold text-white transition hover:bg-(--dash-accent-strong)"
                >
                  Retry
                </button>
              </section>
            ) : null}

            {sectionVisible.general ? (
              <SettingsCard
                title="General Settings"
                subtitle="Configure basic platform settings"
              >
                {settingsQuery.isPending ? (
                  <p className="m-0 text-sm text-(--dash-muted)">
                    Loading settings...
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <SettingsInput
                        label="Platform Name"
                        value={form.platform_name}
                        onChange={(value) =>
                          setForm((prev) => ({ ...prev, platform_name: value }))
                        }
                        error={fieldErrors.platform_name}
                      />

                      <SettingsInput
                        label="Support Email"
                        type="email"
                        value={form.support_email}
                        onChange={(value) =>
                          setForm((prev) => ({ ...prev, support_email: value }))
                        }
                        error={fieldErrors.support_email}
                      />
                    </div>

                    <SettingsInput
                      label="Backend API URL"
                      value={form.backend_api_url}
                      onChange={(value) =>
                        setForm((prev) => ({ ...prev, backend_api_url: value }))
                      }
                      helperText="The base URL for your backend API server"
                      error={fieldErrors.backend_api_url}
                    />
                  </>
                )}
              </SettingsCard>
            ) : null}

            {sectionVisible.notifications ? (
              <SettingsCard
                title="Notifications"
                subtitle="Configure email and system notifications"
              >
                <SettingsToggle
                  label="New User Notifications"
                  description="Receive alerts when new users register"
                  checked={Boolean(form.notifications_new_users)}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      notifications_new_users: value,
                    }))
                  }
                />
                <SettingsToggle
                  label="New Company Notifications"
                  description="Receive alerts when new companies register"
                  checked={Boolean(form.notifications_new_companies)}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      notifications_new_companies: value,
                    }))
                  }
                />
                <SettingsToggle
                  label="Job Posting Alerts"
                  description="Get notified about new job postings"
                  checked={Boolean(form.notifications_job_posting_alerts)}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      notifications_job_posting_alerts: value,
                    }))
                  }
                />
                <SettingsToggle
                  label="Weekly Reports"
                  description="Receive weekly platform activity reports"
                  checked={Boolean(form.notifications_weekly_reports)}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      notifications_weekly_reports: value,
                    }))
                  }
                />
              </SettingsCard>
            ) : null}

            {sectionVisible.security ? (
              <SettingsCard
                title="Security"
                subtitle="Configure security and authentication settings"
              >
                <SettingsToggle
                  label="Two-Factor Authentication"
                  description="Require 2FA for admin accounts"
                  checked={Boolean(form.security_two_factor_auth)}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      security_two_factor_auth: value,
                    }))
                  }
                />
                <SettingsToggle
                  label="Auto-logout Inactive Sessions"
                  description="Automatically logout after 30 minutes of inactivity"
                  checked={Boolean(form.security_auto_logout_inactive)}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      security_auto_logout_inactive: value,
                    }))
                  }
                />
                <SettingsToggle
                  label="Login Activity Logging"
                  description="Track and log all login attempts"
                  checked={Boolean(form.security_login_activity_logging)}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      security_login_activity_logging: value,
                    }))
                  }
                />
              </SettingsCard>
            ) : null}

            <div className="flex justify-end pb-4">
              <SettingsButton disabled={isBusy} onClick={handleSave}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </SettingsButton>
            </div>
          </main>
        </div>
      </div>

      <ToastStack
        toasts={toasts}
        onDismiss={(toastId) =>
          setToasts((prev) => prev.filter((toast) => toast.id !== toastId))
        }
      />
    </div>
  );
}
