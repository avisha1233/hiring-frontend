/* eslint-disable react-refresh/only-export-components */

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { CandidateLayout } from "@/components/candidate/CandidateLayout";
import { candidateApi } from "@/apis/candidate";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

const TABS = ["personal", "experience", "education", "skills", "resume"];

function ProfilePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("personal");
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

  const profileQuery = useQuery({
    queryKey: ["candidate", "profile"],
    queryFn: candidateApi.getProfile,
    retry: false,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!profileQuery.data) return;
    setForm((prev) => ({ ...prev, ...profileQuery.data }));
  }, [profileQuery.data]);

  const updateMutation = useMutation({
    mutationFn: () => candidateApi.updateProfile(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate", "profile"] });
      queryClient.invalidateQueries({ queryKey: ["candidate", "settings"] });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file) => candidateApi.uploadResume(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate", "profile"] });
    },
  });

  const initial = useMemo(() => {
    const source = String(form.full_name || form.email || "C").trim();
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }, [form.full_name, form.email]);

  return (
    <CandidateLayout
      title="Profile"
      subtitle="Manage your personal information"
    >
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[320px,1fr]">
        <aside className="rounded-xl border border-(--dash-border) bg-(--dash-surface) p-4 shadow-(--dash-shadow)">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-(--dash-accent-soft) text-2xl font-semibold text-(--dash-accent)">
              {initial}
            </div>
            <p className="m-0 text-lg font-semibold text-(--dash-text)">
              {form.full_name || "Candidate"}
            </p>
            <p className="m-0 text-sm text-(--dash-muted)">
              {form.email || "candidate@example.com"}
            </p>
          </div>

          <div className="mt-4 space-y-2 text-sm text-(--dash-muted)">
            <p className="m-0">Location: {form.location || "-"}</p>
            <p className="m-0">Phone: {form.phone || "-"}</p>
          </div>
        </aside>

        <div className="rounded-xl border border-(--dash-border) bg-(--dash-surface) p-4 shadow-(--dash-shadow)">
          <div className="mb-4 flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold ${activeTab === tab ? "bg-(--dash-accent-soft) text-(--dash-accent)" : "text-(--dash-muted) hover:bg-(--dash-accent-soft)"}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                value={form.full_name || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, full_name: e.target.value }))
                }
                placeholder="Full Name"
                className="h-10 rounded-lg border border-(--dash-border) bg-white px-3 text-sm"
              />
              <input
                value={form.email || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
                placeholder="Email"
                className="h-10 rounded-lg border border-(--dash-border) bg-white px-3 text-sm"
              />
              <input
                value={form.phone || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="Phone"
                className="h-10 rounded-lg border border-(--dash-border) bg-white px-3 text-sm"
              />
              <input
                value={form.location || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, location: e.target.value }))
                }
                placeholder="Location"
                className="h-10 rounded-lg border border-(--dash-border) bg-white px-3 text-sm"
              />
              <input
                value={String(form.experience || "")}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    experience: Number(e.target.value) || 0,
                  }))
                }
                placeholder="Experience"
                className="h-10 rounded-lg border border-(--dash-border) bg-white px-3 text-sm"
              />
              <input
                value={String(form.notice_period_days || "")}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    notice_period_days: Number(e.target.value) || 0,
                  }))
                }
                placeholder="Notice Period Days"
                className="h-10 rounded-lg border border-(--dash-border) bg-white px-3 text-sm"
              />
            </div>

            <textarea
              value={form.bio || ""}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              placeholder="About"
              className="min-h-24 w-full rounded-lg border border-(--dash-border) bg-white px-3 py-2 text-sm"
            />
            <textarea
              value={form.qualification || ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, qualification: e.target.value }))
              }
              placeholder="Qualification"
              className="min-h-20 w-full rounded-lg border border-(--dash-border) bg-white px-3 py-2 text-sm"
            />

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => updateMutation.mutate()}
                className="rounded-lg bg-(--dash-accent) px-4 py-2 text-sm font-semibold text-white"
              >
                {updateMutation.isPending ? "Saving..." : "Edit Profile"}
              </button>

              <label className="cursor-pointer rounded-lg border border-(--dash-border) px-3 py-2 text-sm text-(--dash-muted)">
                Upload Resume
                <input
                  type="file"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) uploadMutation.mutate(file);
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      </section>
    </CandidateLayout>
  );
}
