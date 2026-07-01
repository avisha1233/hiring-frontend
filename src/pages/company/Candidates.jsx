// src/pages/company/Candidates.jsx

import { useState, useEffect } from "react";
import { MapPin, Briefcase, Clock, X, ChevronDown, Send, Sparkles } from "lucide-react";
import { toast } from "react-toastify";
import SearchInput from "../../components/shared/SearchInput";
import FilterTabs from "../../components/shared/FilterTabs";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import ErrorState from "../../components/shared/ErrorState";
import EmptyState from "../../components/shared/EmptyState";
import Pagination from "../../components/shared/Pagination";
import { useDebounce, usePagination } from "../../hooks";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/axios";
import { createProposal } from "../../apis/company";
import InterviewScheduleModal from "../../components/company/InterviewScheduleModal";
import {
  getApplicationStatusActions,
  normalizeApplicationStatus,
} from "../../utils/applicationStatus";

const EXPERIENCE_TABS = [
  { value: "all",  label: "All"      },
  { value: "0-1",  label: "0–1 yrs"  },
  { value: "1-3",  label: "1–3 yrs"  },
  { value: "3-5",  label: "3–5 yrs"  },
  { value: "5+",   label: "5+ yrs"   },
];

const NOTICE_OPTIONS = [
  { value: "all", label: "Any notice period" },
  { value: "0",   label: "Immediate"          },
  { value: "30",  label: "≤ 30 days"          },
  { value: "60",  label: "≤ 60 days"          },
  { value: "90",  label: "≤ 90 days"          },
];

const STATUS_BADGE = {
  applied: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  interviewing: "bg-blue-100 text-blue-800 border border-blue-200",
  hired: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  rejected: "bg-rose-100 text-rose-800 border border-rose-200",
};

function resolveName(c, userMap = {}) {
  const fromUser =
    c?.user?.full_name || c?.user?.name ||
    c?.full_name       || c?.name       ||
    c?.candidate?.full_name || c?.candidate?.name;
  if (fromUser) return fromUser;
  const user = userMap[c?.user_id];
  return user?.full_name || user?.name || null;
}

function resolveEmail(c, userMap = {}) {
  const fromUser = c?.user?.email || c?.email || c?.candidate?.email;
  if (fromUser) return fromUser;
  const user = userMap[c?.user_id];
  return user?.email || "";
}

function resolveSkills(c) {
  const raw =
    c?.CandidateSkills ||
    c?.candidate_skills ||
    c?.skills ||
    c?.user?.skills ||
    [];
  return raw
    .slice(0, 4)
    .map((s) => {
      if (typeof s === "string") return s;
      if (s?.Skill?.name) return s.Skill.name;
      if (s?.skill?.name) return s.skill.name;
      if (s?.name) return s.name;
      return null;
    })
    .filter(Boolean);
}

function InitialsAvatar({ name }) {
  const letters = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700">
      {letters}
    </div>
  );
}

function formatSalary(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return "Salary open";
  }

  return `NPR ${numericValue.toLocaleString("en-NP")}`;
}

// ── Proposal Modal ──────────────────────────────────────────────────────────
function ProposalModal({ candidate, candidateName, jobs, initialJobId, onClose, onSent }) {
  const [jobId, setJobId]       = useState("");
  const [message, setMessage]   = useState("");
  const [salary, setSalary]     = useState("");
  const [sending, setSending]   = useState(false);

  useEffect(() => {
    if (!candidate) return;
    setJobId(initialJobId ? String(initialJobId) : "");
    setMessage("");
    setSalary("");
  }, [candidate, initialJobId]);

  const selectedJob = jobs.find((job) => String(job.id) === String(jobId));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!jobId) { toast.error("Please select a job."); return; }
    if (!salary) { toast.error("Please enter a salary."); return; }
    setSending(true);
    try {
      await createProposal({
        job_id: Number(jobId),
        candidate_id: Number(candidate.id),
        message: message.trim() || undefined,
        salary: Number(salary),
      });
      toast.success(`Proposal sent to ${candidateName}!`);
      onSent(candidate.id, Number(jobId));
      onClose();
    } catch (err) {
      toast.error(err?.payload?.error || err?.message || "Failed to send proposal.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Send Proposal</h2>
            <p className="text-sm text-gray-500">to <span className="font-medium text-orange-600">{candidateName}</span></p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* job select */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Select Job *</label>
            <div className="relative">
              <select
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                required
                className="w-full appearance-none rounded-lg border border-orange-200 bg-white py-2.5 pl-3 pr-10 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
              >
                <option value="">— Choose a job —</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            {selectedJob && (
              <p className="mt-1 text-xs text-gray-500">
                {selectedJob.location || (selectedJob.is_remote ? "Remote" : "On site")} · {formatSalary(selectedJob.min_salary || selectedJob.max_salary)}
              </p>
            )}
          </div>

          {/* salary */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Salary *</label>
            <input
              type="number"
              min="1"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="Enter proposed salary"
              className="w-full rounded-lg border border-orange-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
          </div>

          {/* message */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Message <span className="text-gray-400">(optional)</span></label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Write a personalised note to the candidate…"
              className="w-full rounded-lg border border-orange-200 p-3 text-sm placeholder-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
          </div>

          {/* actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={sending}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60">
              <Send size={15} />
              {sending ? "Sending…" : "Send Proposal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function Candidates() {
  const location  = useLocation();
  const navigate  = useNavigate();

  const [candidates, setCandidates]   = useState([]);
  const [userMap, setUserMap]         = useState({});
  const [jobs, setJobs]               = useState([]);
  const [suggestedCandidates, setSuggestedCandidates] = useState([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [suggestionsError, setSuggestionsError] = useState(null);
  const [error, setError]             = useState(null);
  const [expFilter, setExpFilter]     = useState("all");
  const [noticeFilter, setNoticeFilter] = useState("all");
  const [proposalTarget, setProposalTarget] = useState(null);

  // Interview scheduling state
  const [scheduleTarget, setScheduleTarget]   = useState(null);
  const [scheduling, setScheduling]           = useState(false);
  const [scheduleError, setScheduleError]     = useState("");

  const [search, setSearch] = useState(
    new URLSearchParams(location.search).get("search") || ""
  );
  const debouncedSearch = useDebounce(search, 300);
  const { page, pageSize, goToPage } = usePagination();

  useEffect(() => {
    const q = new URLSearchParams(location.search).get("search") || "";
    setSearch(q);
  }, [location.search]);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/company/candidates", {
        params: { search: debouncedSearch || undefined, page, limit: pageSize },
      });
      const body  = res?.data?.data || res?.data || {};
      const rows  = Array.isArray(body?.data) ? body.data : Array.isArray(body?.rows) ? body.rows : Array.isArray(body) ? body : [];
      const count = Number(body?.total || body?.totalCount || rows.length || 0);
      setCandidates(rows);
      setTotal(count);

      try {
        const usersRes = await api.get("/users", { params: { limit: 500 } });
        const userRows = usersRes?.data?.data?.data || usersRes?.data?.data || usersRes?.data || [];
        const map = {};
        if (Array.isArray(userRows)) userRows.forEach((u) => { map[u.id] = u; });
        setUserMap(map);
      } catch { /* non-fatal */ }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load candidates");
    } finally {
      setLoading(false);
    }
  }

  async function fetchJobs() {
    try {
      const res = await api.get("/company/jobs", { params: { page: 1, limit: 100 } });
      const body = res?.data?.data || res?.data || {};
      const rows = Array.isArray(body?.data) ? body.data : Array.isArray(body?.rows) ? body.rows : Array.isArray(body) ? body : [];
      setJobs(rows);
    } catch {
      setJobs([]);
    }
  }

  async function fetchSuggestedCandidates() {
    try {
      setSuggestionsLoading(true);
      setSuggestionsError(null);
      const res = await api.get("/company/suggested-candidates", { params: { page: 1, limit: 6 } });
      const body = res?.data?.data || res?.data || {};
      const rows = Array.isArray(body?.data) ? body.data : Array.isArray(body?.rows) ? body.rows : Array.isArray(body) ? body : [];
      setSuggestedCandidates(rows);
    } catch (err) {
      setSuggestionsError(err?.response?.data?.message || err.message || "Failed to load suggested candidates");
      setSuggestedCandidates([]);
    } finally {
      setSuggestionsLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, [debouncedSearch, page]);
  useEffect(() => {
    fetchJobs();
    fetchSuggestedCandidates();
  }, []);

  const handleProposalOpen = (candidate, initialJobId = "") => {
    setProposalTarget({
      candidate,
      candidateName: resolveName(candidate, userMap) ?? `Candidate #${candidate.id}`,
      initialJobId,
    });
  };

  const handleProposalSent = async () => {
    await fetchSuggestedCandidates();
    await fetchData();
  };

  const handleStatusUpdate = async (applicationId, nextStatus) => {
    try {
      await api.patch(`/applications/${applicationId}`, { status: nextStatus });
      toast.success(`Application marked as ${nextStatus}`);
      await fetchData();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || error?.message || "Failed to update application",
      );
    }
  };

  const handleScheduleSubmit = async (payload) => {
    setScheduling(true);
    setScheduleError("");
    try {
      await api.post("/interviews", payload);
      toast.success("Interview scheduled");
      setScheduleTarget(null);
      await fetchData();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to schedule interview";
      setScheduleError(message);
      toast.error(message);
      throw error;
    } finally {
      setScheduling(false);
    }
  };

  const shown = candidates.filter((c) => {
    if (expFilter !== "all") {
      const exp = Number(c.experience ?? 0);
      if (expFilter === "0-1" && !(exp >= 0 && exp < 1))  return false;
      if (expFilter === "1-3" && !(exp >= 1 && exp < 3))  return false;
      if (expFilter === "3-5" && !(exp >= 3 && exp < 5))  return false;
      if (expFilter === "5+"  && !(exp >= 5))              return false;
    }
    if (noticeFilter !== "all") {
      const np = Number(c.notice_period_days ?? 999);
      if (noticeFilter === "0"  && np !== 0)  return false;
      if (noticeFilter === "30" && np > 30)   return false;
      if (noticeFilter === "60" && np > 60)   return false;
      if (noticeFilter === "90" && np > 90)   return false;
    }
    return true;
  });

  if (error) {
    return <ErrorState title="Failed to load candidates" message={error} onRetry={fetchData} />;
  }

  return (
    <>
      {proposalTarget && (
        <ProposalModal
          candidate={proposalTarget.candidate}
          candidateName={proposalTarget.candidateName}
          jobs={jobs}
          initialJobId={proposalTarget.initialJobId}
          onClose={() => setProposalTarget(null)}
          onSent={handleProposalSent}
        />
      )}

      {scheduleTarget && (
        <InterviewScheduleModal
          open={Boolean(scheduleTarget)}
          application={scheduleTarget}
          interviewerId={location?.state?.interviewerId}
          onClose={() => {
            setScheduleTarget(null);
            setScheduleError("");
          }}
          onSubmit={handleScheduleSubmit}
          submitting={scheduling}
          error={scheduleError}
        />
      )}

      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
          <p className="text-sm text-gray-600">Browse and discover available candidates</p>
        </div>

        <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-orange-500" />
                <h2 className="text-lg font-bold text-gray-900">Suggested Candidates</h2>
              </div>
              <p className="mt-1 text-sm text-gray-600">Skill-matched candidates who have not applied to your jobs yet</p>
            </div>
            <div className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
              {suggestedCandidates.length} matches
            </div>
          </div>

          {suggestionsLoading ? (
            <LoadingSkeleton rows={2} columns={1} />
          ) : suggestionsError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {suggestionsError}
            </div>
          ) : suggestedCandidates.length === 0 ? (
            <EmptyState
              title="No suggested candidates yet"
              message="Once you have open jobs with skills attached, matching candidates will appear here."
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {suggestedCandidates.map((candidate) => {
                const name = resolveName(candidate, userMap) ?? `Candidate #${candidate.id}`;
                const email = resolveEmail(candidate, userMap);
                const skills = Array.isArray(candidate.skills) ? candidate.skills : resolveSkills(candidate);
                const bestJobTitle = candidate.best_job_title || candidate.best_job?.title || "Best matched job";

                return (
                  <article key={candidate.id} className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 shadow-sm transition hover:border-orange-200 hover:bg-orange-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <InitialsAvatar name={name} />
                        <div>
                          <p className="font-semibold text-gray-900">{name}</p>
                          {email && <p className="text-xs text-gray-500">{email}</p>}
                        </div>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-orange-700 shadow-sm">
                        {candidate.match_score || 0}% match
                      </span>
                    </div>

                    <div className="mt-4 rounded-xl bg-white p-3 text-sm text-gray-700">
                      <p className="font-medium text-gray-900">Best fit</p>
                      <p className="mt-1 text-gray-600">{bestJobTitle}</p>
                      {candidate.best_job?.location && (
                        <p className="mt-1 text-xs text-gray-500">{candidate.best_job.location}</p>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {skills.slice(0, 4).map((skill) => (
                        <span key={skill} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-orange-700 shadow-sm">
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-xs text-gray-500">
                        {candidate.location || "Location not specified"}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleProposalOpen(candidate, candidate.best_job_id || candidate.best_job?.id || "")}
                        className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
                      >
                        <Send size={14} />
                        Send Proposal
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <div className="flex flex-wrap gap-4 rounded-lg border border-orange-100 bg-white p-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or location…" disabled={loading} />
          <select
            value={noticeFilter}
            onChange={(e) => setNoticeFilter(e.target.value)}
            className="rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            {NOTICE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <FilterTabs tabs={EXPERIENCE_TABS} active={expFilter} onChange={setExpFilter} />

        {loading ? (
          <LoadingSkeleton rows={5} columns={8} />
        ) : shown.length === 0 ? (
          <EmptyState title="No candidates found" message="Try adjusting your search or filters" />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-orange-100 bg-white shadow-sm">
            <table className="w-full">
              <thead className="border-b border-orange-100 bg-orange-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Match Score</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Experience</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Skills</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Notice Period</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((c) => {
                  const name   = resolveName(c, userMap) ?? `Candidate #${c.id}`;
                  const email  = resolveEmail(c, userMap);
                  const skills = resolveSkills(c);
                  const exp    = Number(c.experience ?? 0);
                  const loc    = c.location || "Not specified";
                  const notice = c.notice_period_days != null
                    ? c.notice_period_days === 0 ? "Immediate" : `${c.notice_period_days} days`
                    : "–";
                  const applicationStatus = normalizeApplicationStatus(
                    c.application_status || c.status,
                  );
                  const actions = getApplicationStatusActions(applicationStatus);
                  const applicationId = c.application_id || c.id;

                  return (
                    <tr key={c.id} className="border-b border-orange-50 hover:bg-orange-50/50">
                      {/* name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <InitialsAvatar name={name} />
                          <div>
                            <p className="font-medium text-gray-900">{name}</p>
                            {email && <p className="text-xs text-gray-500">{email}</p>}
                          </div>
                        </div>
                      </td>

                      {/* match score */}
                      <td className="px-4 py-3 text-sm">
                        {c.match_score !== undefined && c.match_score !== null ? (
                          <div className="group relative inline-flex items-center">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              c.match_score >= 85 ? 'bg-emerald-100 text-emerald-800' :
                              c.match_score >= 70 ? 'bg-blue-100 text-blue-800' :
                              c.match_score >= 50 ? 'bg-orange-100 text-orange-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {c.match_score}% Match
                            </span>
                            {c.match_breakdown && (
                              <div className="invisible absolute bottom-full left-1/2 z-10 mb-2 w-48 -translate-x-1/2 rounded bg-gray-900 p-3 text-xs text-white opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
                                <p className="font-semibold border-b border-gray-700 pb-1 mb-2">Score Breakdown</p>
                                <div className="space-y-1">
                                  <div className="flex justify-between"><span className="text-gray-400">Skills Fit:</span><span className="font-medium">{c.match_breakdown.skillScore}%</span></div>
                                  <div className="flex justify-between"><span className="text-gray-400">Experience:</span><span className="font-medium">{c.match_breakdown.experienceScore}%</span></div>
                                  <div className="flex justify-between"><span className="text-gray-400">Location:</span><span className="font-medium">{c.match_breakdown.locationScore}%</span></div>
                                  <div className="flex justify-between"><span className="text-gray-400">Notice Period:</span><span className="font-medium">{c.match_breakdown.noticePeriodScore}%</span></div>
                                </div>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      {/* experience */}
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Briefcase size={14} className="text-gray-400" />
                          {exp} {exp === 1 ? "yr" : "yrs"}
                        </div>
                      </td>

                      {/* skills */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {skills.length === 0 ? (
                            <span className="text-xs text-gray-400">—</span>
                          ) : (
                            skills.map((skill) => (
                              <span key={skill} className="inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                                {skill}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      {/* location */}
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin size={14} className="text-gray-400" />
                          {loc}
                        </div>
                      </td>

                      {/* notice period */}
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock size={14} className="text-gray-400" />
                          {notice}
                        </div>
                      </td>

                      {/* status */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_BADGE[applicationStatus] || STATUS_BADGE.applied}`}>
                          {actions.statusLabel}
                        </span>
                      </td>

                      {/* actions */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {actions.primaryAction ? (
                            <button
                              onClick={() => {
                                if (actions.primaryAction.type === "schedule") {
                                  setScheduleTarget({
                                    ...c,
                                    id: applicationId,
                                    candidate_name: name,
                                  });
                                  setScheduleError("");
                                  return;
                                }

                                handleStatusUpdate(applicationId, actions.primaryAction.nextStatus);
                              }}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                actions.primaryAction.tone === "emerald"
                                  ? "border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                                  : "border-amber-500 text-amber-600 hover:bg-amber-50"
                              }`}
                            >
                              {actions.primaryAction.label}
                            </button>
                          ) : null}
                          {actions.secondaryAction ? (
                            <button
                              onClick={() => handleStatusUpdate(applicationId, actions.secondaryAction.nextStatus)}
                              className="rounded-lg border border-rose-400 px-3 py-1.5 text-xs font-semibold text-rose-500 transition-colors hover:bg-rose-50"
                            >
                              {actions.secondaryAction.label}
                            </button>
                          ) : null}
                          <button
                            onClick={() => navigate(`/company/candidates/${c.id}`, { state: { candidate: c } })}
                            className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-600"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && shown.length > 0 && (
          <Pagination page={page} pageSize={pageSize} total={total || shown.length} onPageChange={goToPage} />
        )}
      </div>
    </>
  );
}