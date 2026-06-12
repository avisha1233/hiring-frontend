// src/pages/company/Candidates.jsx

import { useState, useEffect } from "react";
import { MapPin, Briefcase, Clock } from "lucide-react";
import SearchInput from "../../components/shared/SearchInput";
import FilterTabs from "../../components/shared/FilterTabs";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import ErrorState from "../../components/shared/ErrorState";
import EmptyState from "../../components/shared/EmptyState";
import Pagination from "../../components/shared/Pagination";
import Modal from "../../components/shared/Modal";
import StatusBadge from "../../components/shared/StatusBadge";
import { useDebounce, usePagination } from "../../hooks";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/axios"; // ← the axios instance that all other pages use
import { getAuthUser } from "@/lib/auth";
import { formatDateTime } from "@/utils/formatters";
import { toast } from "react-toastify";

const EXPERIENCE_TABS = [
  { value: "all", label: "All" },
  { value: "0-1", label: "0–1 yrs" },
  { value: "1-3", label: "1–3 yrs" },
  { value: "3-5", label: "3–5 yrs" },
  { value: "5+", label: "5+ yrs" },
];

const NOTICE_OPTIONS = [
  { value: "all", label: "Any notice period" },
  { value: "0", label: "Immediate" },
  { value: "30", label: "≤ 30 days" },
  { value: "60", label: "≤ 60 days" },
  { value: "90", label: "≤ 90 days" },
];

// ── name: the candidate row has user_id but the user object may or may not
//    be included depending on which endpoint we hit.
//    we pass the userMap (loaded separately) as a fallback.
function resolveName(c, userMap = {}) {
  // best case: user object already included in the candidate row
  const fromUser =
    c?.user?.full_name ||
    c?.user?.name ||
    c?.full_name ||
    c?.name ||
    c?.candidate?.full_name ||
    c?.candidate?.name;

  if (fromUser) return fromUser;

  // fallback: look up in the users map by user_id
  const user = userMap[c?.user_id];
  return user?.full_name || user?.name || null;
}

function resolveEmail(c, userMap = {}) {
  const fromUser = c?.user?.email || c?.email || c?.candidate?.email;
  if (fromUser) return fromUser;
  const user = userMap[c?.user_id];
  return user?.email || "";
}

// skills: /company/candidates returns CandidateSkills where each item has
// a nested Skill object → { skill_id, level, Skill: { name } }
// but we also handle flat string arrays and other shapes just in case
function resolveSkills(c) {
  const raw =
    c?.CandidateSkills || // /company/candidates shape
    c?.candidate_skills || // alternative key
    c?.skills || // flat array shape
    c?.user?.skills ||
    [];

  return raw
    .slice(0, 4)
    .map((s) => {
      if (typeof s === "string") return s;
      // { Skill: { name: "React" }, level: "advanced" }
      if (s?.Skill?.name) return s.Skill.name;
      // { skill: { name: "React" } }
      if (s?.skill?.name) return s.skill.name;
      // { name: "React" }
      if (s?.name) return s.name;
      return null;
    })
    .filter(Boolean);
}

// small initials avatar — same style as rest of app
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

// Proposal modal and sent proposals UI
function ProposalModal({
  isOpen,
  candidate,
  onClose,
  jobs,
  selectedJob,
  setSelectedJob,
  messageText,
  setMessageText,
  onSend,
  sending,
  recentProposals,
}) {
  if (!isOpen) return null;
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Send proposal to ${candidate ? candidate.user?.full_name || candidate.full_name || `#${candidate.id}` : "candidate"}`}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-700">Select Job</label>
          <select
            value={selectedJob || ""}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="mt-2 w-full rounded-lg border border-orange-100 px-3 py-2"
          >
            <option value="">Select a job</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-700">Message</label>
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            rows={4}
            className="mt-2 w-full rounded-lg border border-orange-100 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">Recent proposals</div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-md border border-orange-100 px-3 py-1 text-sm"
            >
              Cancel
            </button>
            <button
              disabled={sending}
              onClick={onSend}
              className="rounded-md bg-orange-500 px-3 py-1 text-sm text-white"
            >
              {sending ? "Sending…" : "Send Proposal"}
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {recentProposals.length === 0 ? (
            <div className="text-xs text-gray-500">No recent proposals</div>
          ) : (
            recentProposals.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-md border border-orange-50 p-2"
              >
                <div>
                  <div className="text-sm font-medium">
                    {p.job?.title || `Job ${p.job_id}`}
                  </div>
                  <div className="text-xs text-gray-500">
                    {p.candidate?.user?.full_name ||
                      `Candidate ${p.candidate_id}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">
                    {formatDateTime(p.created_at)}
                  </div>
                  <div className="mt-1">
                    <StatusBadge status={p.status}>{p.status}</StatusBadge>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}

export default function Candidates() {
  const location = useLocation();
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState([]);
  const [userMap, setUserMap] = useState({}); // id → user object
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [modalCandidate, setModalCandidate] = useState(null);
  const [companyJobs, setCompanyJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [recentProposals, setRecentProposals] = useState([]);
  const [expFilter, setExpFilter] = useState("all");
  const [noticeFilter, setNoticeFilter] = useState("all");

  const [search, setSearch] = useState(
    new URLSearchParams(location.search).get("search") || "",
  );
  const debouncedSearch = useDebounce(search, 300);
  const { page, pageSize, goToPage } = usePagination();

  // sync search from URL query string (e.g. from global search bar)
  useEffect(() => {
    const q = new URLSearchParams(location.search).get("search") || "";
    setSearch(q);
  }, [location.search]);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);

      // use /company/candidates — this endpoint includes CandidateSkills
      // and returns candidates that have applied to this company's jobs
      const res = await api.get("/company/candidates", {
        params: {
          search: debouncedSearch || undefined,
          page,
          limit: pageSize,
        },
      });

      // response shape: { data: { data: [...], totalPage: N, total: N } }
      const body = res?.data?.data || res?.data || {};
      const rows = Array.isArray(body?.data)
        ? body.data
        : Array.isArray(body?.rows)
          ? body.rows
          : Array.isArray(body)
            ? body
            : [];
      const count = Number(body?.total || body?.totalCount || rows.length || 0);

      setCandidates(rows);
      setTotal(count);

      // load users separately to fill in names that aren't in the candidate row
      // (same pattern the admin Candidates page uses)
      try {
        const usersRes = await api.get("/users", { params: { limit: 500 } });
        const userRows =
          usersRes?.data?.data?.data ||
          usersRes?.data?.data ||
          usersRes?.data ||
          [];
        const map = {};
        if (Array.isArray(userRows)) {
          userRows.forEach((u) => {
            map[u.id] = u;
          });
        }
        setUserMap(map);
      } catch {
        // non-fatal — names will still show if the candidate row includes user data
      }
    } catch (err) {
      console.error("[Candidates]", err);
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to load candidates",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [debouncedSearch, page]);

  const currentUser = getAuthUser();
  const companyId = currentUser?.company_id || currentUser?.id;

  const pushToast = (message, type = "success") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  };

  // load company jobs and recent proposals when modal opens or companyId changes
  useEffect(() => {
    let mounted = true;
    async function loadMeta() {
      try {
        if (!companyId) return;
        const jobsRes = await api.get("/jobs", {
          params: { company_id: companyId, limit: 200 },
        });
        if (!mounted) return;
        setCompanyJobs(jobsRes.data?.data || jobsRes.data || jobsRes || []);

        const propsRes = await api.get(
          `/proposals?company_id=${companyId}&limit=10`,
        );
        if (!mounted) return;
        setRecentProposals(propsRes.data || propsRes);
      } catch (err) {
        // ignore meta load errors
      }
    }
    loadMeta();
    return () => {
      mounted = false;
    };
  }, [companyId]);

  // client-side experience + notice period filter
  const shown = candidates.filter((c) => {
    if (expFilter !== "all") {
      const exp = Number(c.experience ?? 0);
      if (expFilter === "0-1" && !(exp >= 0 && exp < 1)) return false;
      if (expFilter === "1-3" && !(exp >= 1 && exp < 3)) return false;
      if (expFilter === "3-5" && !(exp >= 3 && exp < 5)) return false;
      if (expFilter === "5+" && !(exp >= 5)) return false;
    }
    if (noticeFilter !== "all") {
      const np = Number(c.notice_period_days ?? 999);
      if (noticeFilter === "0" && np !== 0) return false;
      if (noticeFilter === "30" && np > 30) return false;
      if (noticeFilter === "60" && np > 60) return false;
      if (noticeFilter === "90" && np > 90) return false;
    }
    return true;
  });

  if (error) {
    return (
      <ErrorState
        title="Failed to load candidates"
        message={error}
        onRetry={fetchData}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
        <p className="text-sm text-gray-600">
          Browse and discover available candidates
        </p>
      </div>

      {/* search bar + notice period filter */}
      <div className="flex flex-wrap gap-4 rounded-lg border border-orange-100 bg-white p-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or location..."
          disabled={loading}
        />
        <select
          value={noticeFilter}
          onChange={(e) => setNoticeFilter(e.target.value)}
          className="rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          {NOTICE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* experience tabs */}
      <FilterTabs
        tabs={EXPERIENCE_TABS}
        active={expFilter}
        onChange={setExpFilter}
      />

      {loading ? (
        <LoadingSkeleton rows={5} columns={7} />
      ) : shown.length === 0 ? (
        <EmptyState
          title="No candidates found"
          message="Try adjusting your search or filters"
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-orange-100 bg-white shadow-sm">
          <table className="w-full">
            <thead className="border-b border-orange-100 bg-orange-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Match Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Experience
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Skills
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Notice Period
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((c) => {
                const name = resolveName(c, userMap) ?? `Candidate #${c.id}`;
                const email = resolveEmail(c, userMap);
                const skills = resolveSkills(c);
                const exp = Number(c.experience ?? 0);
                const loc = c.location || "Not specified";
                const notice =
                  c.notice_period_days != null
                    ? c.notice_period_days === 0
                      ? "Immediate"
                      : `${c.notice_period_days} days`
                    : "–";

                return (
                  <tr
                    key={c.id}
                    className="border-b border-orange-50 hover:bg-orange-50"
                  >
                    {/* name + email */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <InitialsAvatar name={name} />
                        <div>
                          <p className="font-medium text-gray-900">{name}</p>
                          {email && (
                            <p className="text-xs text-gray-500">{email}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* match score */}
                    <td className="px-4 py-3 text-sm">
                      {c.match_score !== undefined && c.match_score !== null ? (
                        <div className="group relative inline-flex items-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              c.match_score >= 85
                                ? "bg-emerald-100 text-emerald-800"
                                : c.match_score >= 70
                                  ? "bg-blue-100 text-blue-800"
                                  : c.match_score >= 50
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {c.match_score}% Match
                          </span>

                          {/* Breakdown Tooltip */}
                          {c.match_breakdown && (
                            <div className="invisible absolute bottom-full left-1/2 z-10 mb-2 w-48 -translate-x-1/2 rounded bg-gray-900 p-3 text-xs text-white opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
                              <p className="font-semibold border-b border-gray-700 pb-1 mb-2">
                                Score Breakdown
                              </p>
                              <div className="space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-gray-400">
                                    Skills Fit:
                                  </span>
                                  <span className="font-medium">
                                    {c.match_breakdown.skillScore}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">
                                    Experience:
                                  </span>
                                  <span className="font-medium">
                                    {c.match_breakdown.experienceScore}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">
                                    Location:
                                  </span>
                                  <span className="font-medium">
                                    {c.match_breakdown.locationScore}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">
                                    Notice Period:
                                  </span>
                                  <span className="font-medium">
                                    {c.match_breakdown.noticePeriodScore}%
                                  </span>
                                </div>
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
                            <span
                              key={skill}
                              className="inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700"
                            >
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

                    {/* action */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setModalCandidate(c);
                            setShowProposalModal(true);
                          }}
                          className="rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50"
                        >
                          Send Proposal
                        </button>

                        <button
                          onClick={() =>
                            navigate(`/company/candidates/${c.id}`, {
                              state: { candidate: c },
                            })
                          }
                          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600"
                        >
                          View Profile
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
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total || shown.length}
          onPageChange={goToPage}
        />
      )}
      {/* Sent proposals modal */}
      <ProposalModal
        isOpen={showProposalModal}
        candidate={modalCandidate}
        onClose={() => {
          setShowProposalModal(false);
          setModalCandidate(null);
          setSelectedJob(null);
          setMessageText("");
        }}
        jobs={companyJobs}
        selectedJob={selectedJob}
        setSelectedJob={setSelectedJob}
        messageText={messageText}
        setMessageText={setMessageText}
        sending={sending}
        onSend={async () => {
          if (!selectedJob) {
            toast.error("Please select a job");
            return;
          }
          try {
            setSending(true);
            const payload = {
              job_id: Number(selectedJob),
              candidate_id: modalCandidate.id,
              message: messageText,
            };
            const res = await api.post("/proposals", payload);
            toast.success("Proposal sent");
            setRecentProposals((prev) => [res.data || res, ...(prev || [])]);
            setShowProposalModal(false);
            setModalCandidate(null);
            setSelectedJob(null);
            setMessageText("");
          } catch (err) {
            toast.error(
              err?.response?.data?.message ||
                err.message ||
                "Failed to send proposal",
            );
          } finally {
            setSending(false);
          }
        }}
        recentProposals={recentProposals}
      />

      {/* react-toastify handles toasts globally via ToastContainer in main.jsx */}
    </div>
  );
}
