// src/pages/company/Candidates.jsx

import { useState, useEffect, useCallback } from "react";
import { MapPin, Briefcase, Clock, Send, X, ChevronDown } from "lucide-react";
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
import { createProposal, getCompanyProposals } from "../../apis/company";

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
  pending:  "bg-yellow-100 text-yellow-800 border border-yellow-200",
  accepted: "bg-emerald-100 text-emerald-800 border border-emerald-200",
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

// ── Proposal Modal ──────────────────────────────────────────────────────────
function ProposalModal({ candidate, candidateName, jobs, onClose, onSent }) {
  const [jobId, setJobId]       = useState("");
  const [message, setMessage]   = useState("");
  const [sending, setSending]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!jobId) { toast.error("Please select a job."); return; }
    setSending(true);
    try {
      await createProposal({
        job_id: Number(jobId),
        candidate_id: Number(candidate.id),
        message: message.trim() || undefined,
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
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [expFilter, setExpFilter]     = useState("all");
  const [noticeFilter, setNoticeFilter] = useState("all");

  // Proposal feature state
  const [openJobs, setOpenJobs]               = useState([]);
  const [proposalMap, setProposalMap]         = useState({}); // candidateId → proposal
  const [modalTarget, setModalTarget]         = useState(null); // candidate object

  const [search, setSearch] = useState(
    new URLSearchParams(location.search).get("search") || ""
  );
  const debouncedSearch = useDebounce(search, 300);
  const { page, pageSize, goToPage } = usePagination();

  useEffect(() => {
    const q = new URLSearchParams(location.search).get("search") || "";
    setSearch(q);
  }, [location.search]);

  // Load open jobs + existing proposals (for badge display)
  useEffect(() => {
    async function loadSideData() {
      try {
        const jobsRes = await api.get("/company/jobs", { params: { status: "open", limit: 100 } });
        const body = jobsRes?.data?.data || jobsRes?.data || {};
        const rows = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
        setOpenJobs(rows);
      } catch { /* non-fatal */ }

      try {
        const props = await getCompanyProposals();
        const list  = Array.isArray(props?.data) ? props.data : Array.isArray(props) ? props : [];
        const map   = {};
        list.forEach((p) => {
          const key = String(p.candidate_id);
          // keep the most recent (already DESC from API)
          if (!map[key]) map[key] = p;
        });
        setProposalMap(map);
      } catch { /* non-fatal */ }
    }
    loadSideData();
  }, []);

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

  useEffect(() => { fetchData(); }, [debouncedSearch, page]);

  // After a proposal is sent, update the local map optimistically
  const handleProposalSent = useCallback((candidateId, jobId) => {
    setProposalMap((prev) => ({
      ...prev,
      [String(candidateId)]: { candidate_id: candidateId, job_id: jobId, status: "pending" },
    }));
  }, []);

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
      {modalTarget && (
        <ProposalModal
          candidate={modalTarget}
          candidateName={resolveName(modalTarget, userMap) ?? `Candidate #${modalTarget.id}`}
          jobs={openJobs}
          onClose={() => setModalTarget(null)}
          onSent={handleProposalSent}
        />
      )}

      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
          <p className="text-sm text-gray-600">Browse and discover available candidates</p>
        </div>

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
          <LoadingSkeleton rows={5} columns={7} />
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
                  const proposal = proposalMap[String(c.id)];

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

                      {/* actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {/* Proposal status badge or Send button */}
                          {proposal ? (
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_BADGE[proposal.status] || STATUS_BADGE.pending}`}>
                              {proposal.status}
                            </span>
                          ) : (
                            <button
                              onClick={() => setModalTarget(c)}
                              className="flex items-center gap-1.5 rounded-lg bg-orange-100 px-3 py-1.5 text-xs font-semibold text-orange-700 transition hover:bg-orange-200"
                            >
                              <Send size={13} />
                              Send Proposal
                            </button>
                          )}
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