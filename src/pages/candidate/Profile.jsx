import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import Avatar from "../../components/shared/Avatar";
import { getAuthUser } from "../../lib/auth";
import { candidateApi, userSettingsApi } from "@/apis/candidate";
import { api } from "@/services/api";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    qualification: "",
    experience: 0,
    notice_period_days: 0,
  });

  const [initial, setInitial] = useState(null);

  const user = getAuthUser();
  const userId = user?.id;

  const fetch = async () => {
    setLoading(true);
    try {
      const [candRes, userRes] = await Promise.all([
        candidateApi.getProfile(),
        userSettingsApi.getProfile(),
      ]);

      const cand = candRes?.data || candRes || {};
      const usr = userRes?.data || userRes || {};

      const merged = {
        full_name: usr.full_name || cand.full_name || "",
        email: usr.email || "",
        phone: cand.phone || "",
        location: cand.location || "",
        bio: cand.bio || "",
        qualification: cand.qualification || "",
        experience: cand.experience || 0,
        notice_period_days: cand.notice_period_days || 0,
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
    if (!userId) return;
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const initials = useMemo(() => {
    const src = String(form.full_name || form.email || "C").trim();
    const parts = src.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }, [form.full_name, form.email]);

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

  const handleSave = async () => {
    if (!userId) return toast.error("No user id");
    setSaving(true);
    try {
      const candidatePayload = {
        qualification: form.qualification,
        experience: form.experience,
        notice_period_days: form.notice_period_days,
        bio: form.bio,
        location: form.location,
        phone: form.phone,
      };

      const userPayload = {
        full_name: form.full_name,
        email: form.email,
      };

      await Promise.all([
        api.put(`/candidates/${userId}`, candidatePayload),
        api.patch(`/users/${userId}`, userPayload),
      ]);

      toast.success("Profile updated successfully");
      setInitial({ ...form });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSkeleton rows={6} columns={6} />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-600">
          Manage your personal information
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[320px,1fr]">
        <aside className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <Avatar
              name={form.full_name || form.email || "Candidate"}
              size="xl"
            />
            <p className="m-0 text-lg font-semibold text-gray-900">
              {form.full_name || "Candidate"}
            </p>
            <p className="m-0 text-sm text-gray-500">
              {form.email || "candidate@example.com"}
            </p>
          </div>

          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <p className="m-0">Location: {form.location || "-"}</p>
            <p className="m-0">Phone: {form.phone || "-"}</p>
            <p className="m-0">Qualification: {form.qualification || "-"}</p>
            <p className="m-0">Experience: {form.experience ?? "-"} years</p>
            <p className="m-0">
              Notice period: {form.notice_period_days ?? "-"} days
            </p>
          </div>
        </aside>

        <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm">
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                value={form.full_name || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, full_name: e.target.value }))
                }
                placeholder="Full Name"
                className="h-10 rounded-lg border border-orange-100 px-3 text-sm"
              />
              <input
                value={form.email || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
                placeholder="Email"
                className="h-10 rounded-lg border border-orange-100 px-3 text-sm"
              />
              <input
                value={form.location || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, location: e.target.value }))
                }
                placeholder="Location"
                className="h-10 rounded-lg border border-orange-100 px-3 text-sm"
              />
              <input
                value={form.qualification || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, qualification: e.target.value }))
                }
                placeholder="Qualification"
                className="h-10 rounded-lg border border-orange-100 px-3 text-sm"
              />
              <input
                type="number"
                value={String(form.experience || "")}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    experience: Number(e.target.value) || 0,
                  }))
                }
                placeholder="Experience (years)"
                className="h-10 rounded-lg border border-orange-100 px-3 text-sm"
              />
              <input
                type="number"
                value={String(form.notice_period_days || "")}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    notice_period_days: Number(e.target.value) || 0,
                  }))
                }
                placeholder="Notice period (days)"
                className="h-10 rounded-lg border border-orange-100 px-3 text-sm"
              />
            </div>

            <textarea
              value={form.bio || ""}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Bio"
              className="min-h-24 w-full rounded-lg border border-orange-100 px-3 py-2 text-sm"
            />

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
      </section>
    </div>
  );
}
