import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { candidateApi, userSettingsApi } from "@/apis/candidate";
import { api } from "@/services/api";
import { getAuthUser } from "@/lib/auth";

export function useCandidateProfile() {
  const user = getAuthUser();
  const userId = user?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [workItems, setWorkItems] = useState([]);
  const [eduItems, setEduItems] = useState([]);
  const [certItems, setCertItems] = useState([]);

  useEffect(() => {
    if (!userId) return;
    loadAll();
  }, [userId]);

  async function loadAll() {
    setLoading(true);
    try {
      const [candRes, userRes, workRes, eduRes, certRes] = await Promise.all([
        candidateApi.getProfile(),
        userSettingsApi.getProfile(),
        candidateApi.getWork(),
        candidateApi.getEdu(),
        candidateApi.getCerts(),
      ]);

      const cand = candRes?.data || candRes || {};
      const usr = userRes?.data || userRes || {};

      setProfile({
        full_name: usr.full_name || cand.full_name || "",
        email: usr.email || "",
        phone: cand.phone || "",
        location: cand.location || "",
        bio: cand.bio || "",
        qualification: cand.qualification || "",
        experience: cand.experience || 0,
        notice_period_days: cand.notice_period_days || 0,
        is_open_to_work: cand.is_open_to_work ?? true,
        linkedin_url: cand.linkedin_url || "",
        github_url: cand.github_url || "",
        portfolio_url: cand.portfolio_url || "",
        twitter_url: cand.twitter_url || "",
        resume_url: cand.resume_url || "",
      });

      setWorkItems(workRes?.data || []);
      setEduItems(eduRes?.data || []);
      setCertItems(certRes?.data || []);
    } catch (err) {
      toast.error(err?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile(data, resumeFile) {
    if (!userId) return;
    setSaving(true);
    try {
      await Promise.all([
        api.put(`/candidates/${userId}`, {
          phone: data.phone,
          location: data.location,
          bio: data.bio,
          qualification: data.qualification,
          experience: data.experience,
          notice_period_days: data.notice_period_days,
          is_open_to_work: data.is_open_to_work,
          linkedin_url: data.linkedin_url,
          github_url: data.github_url,
          portfolio_url: data.portfolio_url,
          twitter_url: data.twitter_url,
        }),
        api.patch(`/users/${userId}`, {
          full_name: data.full_name,
          email: data.email,
        }),
      ]);

      if (resumeFile) {
        const fd = new FormData();
        fd.append("file", resumeFile);
        await api.post(`/candidates/${userId}/resume`, fd);
      }

      setProfile((current) => ({ ...current, ...data }));
      toast.success("Profile saved");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  return {
    loading,
    saving,
    profile,
    workItems,
    eduItems,
    certItems,
    setWorkItems,
    setEduItems,
    setCertItems,
    saveProfile,
  };
}
