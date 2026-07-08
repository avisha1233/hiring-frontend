// src/pages/company/Applications.jsx

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import FilterTabs from "../../components/shared/FilterTabs";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import EmptyState from "../../components/shared/EmptyState";
import DataTable from "../../components/shared/DataTable";
import StatusBadge from "../../components/shared/StatusBadge";
import { getAuthUser } from "../../lib/auth";
import { formatDate } from "../../utils/formatters";
import { getCompanyProfile } from "@/apis/company";
import { api } from "../../services/api";
import InterviewScheduleModal from "../../components/company/InterviewScheduleModal";
import { normalizeApplicationStatus } from "../../utils/applicationStatus";

// ── filter tabs — same shape as candidate Applications ────────────────────────
const TABS = [
  { value: "all", label: "All" },
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "hired", label: "Hired" },
  { value: "rejected", label: "Rejected" },
];

const MOVE_TO_ACTIONS = {
  applied: {
    primaryAction: {
      label: "Interview",
      type: "schedule",
      tone: "amber",
    },
    secondaryAction: {
      label: "Reject",
      nextStatus: "rejected",
    },
  },
  interviewing: {
    primaryAction: {
      label: "Hire",
      nextStatus: "hired",
      tone: "emerald",
    },
    secondaryAction: {
      label: "Reject",
      nextStatus: "rejected",
    },
  },
  hired: {
    terminalLabel: "Terminal",
  },
  rejected: {
    terminalLabel: "Terminal",
  },
};

const getMoveToActions = (status) =>
  MOVE_TO_ACTIONS[normalizeApplicationStatus(status)] || MOVE_TO_ACTIONS.applied;

const resolveCandidateName = (row) =>
  [row.candidate?.first_name, row.candidate?.last_name]
    .filter(Boolean)
    .join(" ") ||
  row.candidate?.name ||
  row.candidate?.full_name ||
  row.candidate_name ||
  `Candidate #${row.candidate_id}`;

// ── Skill Gap Modal ─────────────────────────────────────────────────────────
function SkillGapModal({ open, onClose, application }) {
  if (!open || !application) return null;

  const breakdown = application.match_breakdown;
  const displayScore =
    application.match_score !== undefined && application.match_score !== null
      ? Number(application.match_score)
      : 0;

  // Handle both camelCase and snake_case keys from backend
  const met = breakdown?.met || breakdown?.matched || [];
  const belowLevel = breakdown?.belowLevel || breakdown?.below_level || [];
  const missing = breakdown?.missing || [];
  const skillsBreakdown = breakdown?.skillsBreakdown || breakdown?.skills_breakdown || [];
  const totalSkills = skillsBreakdown.length > 0 ? skillsBreakdown.length : met.length + belowLevel.length + missing.length;

  const candidateName = resolveCandidateName(application);
  const jobTitle = application.job?.title || application.job_title || `Job #${application.job_id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      {/* modal */}
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Skill Gap Analysis</h2>
              <p className="mt-1 text-sm text-gray-500">
                {candidateName} — {jobTitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* score summary bar */}
          <div className="mt-4 rounded-xl bg-orange-50 border border-orange-100 p-4">
            <div className="flex items-center gap-4">
              {/* circular score */}
              <div className="relative w-14 h-14 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#fed7aa"
                    strokeWidth="3.5"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="3.5"
                    strokeDasharray={`${displayScore}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-orange-700">
                  {displayScore}%
                </span>
              </div>
              {/* stat pills */}
              <div className="flex flex-wrap gap-2 flex-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {met.length} Matched
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-medium text-amber-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {belowLevel.length} Below Level
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  {missing.length} Missing
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* body */}
        <div className="px-6 pb-2 max-h-[50vh] overflow-y-auto space-y-4">
          {skillsBreakdown.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-100 pb-2 mb-3">
                Job's Skills
              </h3>
              <div className="space-y-4">
                {skillsBreakdown.map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {item.skill}
                      </span>
                      <span className={`text-xs font-semibold ${
                        item.matchPercentage >= 100 ? 'text-emerald-600' :
                        item.matchPercentage >= 50 ? 'text-amber-600' :
                        'text-rose-600'
                      }`}>
                        matched {item.matchPercentage}%
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.matchPercentage >= 100 ? 'bg-emerald-500' :
                          item.matchPercentage >= 50 ? 'bg-amber-500' :
                          'bg-rose-500'
                        }`}
                        style={{ width: `${item.matchPercentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>Candidate: {item.candidateLevel || 'None'}</span>
                      <span>Required: {item.required}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            totalSkills === 0 && (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-50 text-orange-400 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                </div>
                <p className="text-sm text-gray-500">
                  No skill breakdown data available for this application.
                </p>
              </div>
            )
          )}
        </div>

        {/* footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmationModal({ open, onClose, onConfirm, action, application }) {
  if (!open || !application || !action) return null;
  const candidateName = resolveCandidateName(application);
  const jobTitle = application.job?.title || application.job_title || `Job #${application.job_id}`;
  
  const isHire = action === "hired";
  
  const displayScore =
    application.match_score !== undefined && application.match_score !== null
      ? Number(application.match_score)
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden border border-orange-100">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">Confirm Action</h2>
          <p className="text-gray-700 text-center mb-2">
            Are you sure you want to {isHire ? "Hire" : "Reject"} <span className="font-semibold text-orange-600">{candidateName}</span> for <span className="font-semibold">{jobTitle}</span>?
          </p>
          {displayScore !== null && (
            <p className="text-sm text-gray-500 text-center mb-6">
              Match Score: <span className="font-medium text-orange-600">{displayScore}%</span>
            </p>
          )}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-orange-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
                isHire ? "bg-emerald-500 hover:bg-emerald-600" : "bg-rose-500 hover:bg-rose-600"
              }`}
            >
              Confirm {isHire ? "Hire" : "Reject"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CandidateProfileModal({ open, onClose, application, allApplications }) {
  if (!open || !application) return null;

  const candidate = application.candidate || {};
  const candidateName = resolveCandidateName(application);
  const email = candidate.email || "No email provided";
  
  let skills = candidate.skills || candidate.candidate_skills || [];
  if (typeof skills === 'string') {
    try { skills = JSON.parse(skills); } catch(e) {}
  }
  if (!Array.isArray(skills)) skills = [];

  const workExperiences = candidate.work_experiences || candidate.WorkExperiences || [];
  const educations = candidate.educations || candidate.Educations || [];
  
  const displayScore =
    application.match_score !== undefined && application.match_score !== null
      ? Number(application.match_score)
      : null;

  const history = (allApplications || []).filter(
    (a) => a.candidate_id === application.candidate_id || 
           (a.candidate && application.candidate && a.candidate.id === application.candidate.id)
  ).sort((a, b) => new Date(b.created_at || b.applied_at) - new Date(a.created_at || a.applied_at));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-orange-100">
        <div className="px-6 py-4 border-b border-orange-100 flex items-start justify-between bg-orange-50/50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{candidateName}</h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
              {email}
            </div>
            {candidate.location && (
              <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                {candidate.location}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-orange-100 hover:text-orange-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Score + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Match Score</div>
              <div className="mt-1 text-2xl font-bold text-orange-600">
                {displayScore !== null ? `${displayScore}%` : 'N/A'}
              </div>
              <div className="text-xs text-gray-500 mt-1 truncate">For {application.job?.title || 'this role'}</div>
            </div>
            <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Current Status</div>
              <div className="mt-2">
                <StatusBadge status={normalizeApplicationStatus(application.status)}>
                  {normalizeApplicationStatus(application.status)}
                </StatusBadge>
              </div>
            </div>
          </div>

          {/* Quick meta */}
          {(candidate.qualification || candidate.experience != null) && (
            <div className="flex flex-wrap gap-3">
              {candidate.qualification && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  🎓 {candidate.qualification}
                </span>
              )}
              {candidate.experience != null && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-100 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                  💼 {candidate.experience} yr{candidate.experience !== 1 ? 's' : ''} experience
                </span>
              )}
              {candidate.notice_period_days != null && candidate.notice_period_days > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-100 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
                  ⏱ {candidate.notice_period_days}d notice
                </span>
              )}
            </div>
          )}

          {/* Bio */}
          {candidate.bio && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2 border-b border-orange-50 pb-2">About</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{candidate.bio}</p>
            </div>
          )}

          {/* Skills & Resume */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b border-orange-50 pb-2">Skills & Resume</h3>
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((s, i) => {
                   const skillName = typeof s === 'string' ? s : (s?.skill?.name || s?.name || "Unknown");
                   return (
                     <span key={i} className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
                       {skillName}
                     </span>
                   )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No skills listed</p>
            )}
            
            {candidate.resume_url ? (
              <div className="mt-3">
                <a href={candidate.resume_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-600 hover:text-orange-700">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                  View Resume
                </a>
              </div>
            ) : (
              <p className="mt-3 text-xs text-gray-400 italic">No resume uploaded</p>
            )}
          </div>

          {/* Work Experience */}
          {workExperiences.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b border-orange-50 pb-2">Work Experience</h3>
              <div className="space-y-3">
                {workExperiences.map((w, i) => (
                  <div key={i} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <div className="font-medium text-sm text-gray-900">{w.title || w.job_title || 'Role'}</div>
                    <div className="text-xs text-gray-600 mt-0.5">{w.company || w.company_name || ''}</div>
                    {(w.start_date || w.end_date) && (
                      <div className="text-xs text-gray-400 mt-1">
                        {w.start_date ? formatDate(w.start_date) : '?'} — {w.is_current || w.current ? 'Present' : (w.end_date ? formatDate(w.end_date) : '?')}
                      </div>
                    )}
                    {w.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{w.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {educations.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b border-orange-50 pb-2">Education</h3>
              <div className="space-y-3">
                {educations.map((e, i) => (
                  <div key={i} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <div className="font-medium text-sm text-gray-900">{e.degree || e.qualification || 'Degree'}</div>
                    <div className="text-xs text-gray-600 mt-0.5">{e.institution || e.school || ''}{e.field_of_study ? ` · ${e.field_of_study}` : ''}</div>
                    {(e.start_date || e.end_date) && (
                      <div className="text-xs text-gray-400 mt-1">
                        {e.start_date ? formatDate(e.start_date) : '?'} — {e.is_current || e.current ? 'Present' : (e.end_date ? formatDate(e.end_date) : '?')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Application History */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b border-orange-50 pb-2">Application History</h3>
            {history.length > 0 ? (
              <div className="space-y-3">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3 shadow-sm">
                    <div>
                      <div className="font-medium text-sm text-gray-900">{h.job?.title || h.job_title || `Job #${h.job_id}`}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Applied on {formatDate(h.applied_at || h.created_at)}</div>
                    </div>
                    <StatusBadge status={normalizeApplicationStatus(h.status)}>
                      {normalizeApplicationStatus(h.status)}
                    </StatusBadge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No previous applications found</p>
            )}
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-orange-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-200 transition-colors"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}


export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyId, setCompanyId] = useState(null);
  const [scheduleTarget, setScheduleTarget] = useState(null);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [skillGapTarget, setSkillGapTarget] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [profileTarget, setProfileTarget] = useState(null);

  const user = getAuthUser();

  // ── resolve companyId from profile on mount ───────────────────────────────
  useEffect(() => {
    async function resolveCompany() {
      try {
        const res = await getCompanyProfile();
        const profile = res?.data || res || {};
        const id = profile?.id || profile?.company_id || user?.company_id || user?.id;
        setCompanyId(Number(id));
      } catch {
        const id = Number(user?.company_id || user?.id);
        if (id) {
          setCompanyId(id);
        } else {
          setError("Could not load company profile");
          setLoading(false);
        }
      }
    }
    resolveCompany();
  }, []);

  // ── fetch applications whenever companyId or filter changes ──────────────
  const fetchApplications = async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const params = {
        company_id: companyId,
        // only send status param when a real filter is selected
        ...(statusFilter !== "all" && { status: statusFilter }),
      };
      const res = await api.get("/applications", { params });
      const data = res?.data?.data || res?.data || res || [];
      const sorted = (Array.isArray(data) ? data : []).sort((a, b) => {
        const aScore = a.match_score !== undefined && a.match_score !== null ? Number(a.match_score) : 0;
        const bScore = b.match_score !== undefined && b.match_score !== null ? Number(b.match_score) : 0;
        return bScore - aScore;
      });
      setApplications(sorted);
    } catch (err) {
      setError(err.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, statusFilter]);

  // ── update application status ─────────────────────────────────────────────
  const handleStatusChange = async (appId, newStatus) => {
    try {
      await api.patch(`/applications/${appId}`, { status: newStatus });
      toast.success(`Application marked as ${newStatus}`);
      fetchApplications();
    } catch {
      toast.error("Failed to update application");
    }
  };

  const handleScheduleSubmit = async (payload) => {
    setScheduling(true);
    setScheduleError("");
    try {
      await api.post("/interviews", payload);
      toast.success("Interview scheduled");
      setScheduleTarget(null);
      fetchApplications();
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

  // ── table columns — mirrors candidate columns structure exactly ───────────
  const columns = [
    {
      key: "candidate",
      label: "Candidate",
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900 flex items-center gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setProfileTarget(row);
              }}
              className="text-orange-600 hover:text-orange-800 hover:underline transition-colors text-left"
            >
              {resolveCandidateName(row)}
            </button>
            {row.match_score >= 85 && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                Recommended
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {row.candidate?.email || ""}
          </div>
        </div>
      ),
    },
    {
      key: "match_score",
      label: "Match Score",
      render: (row) => {
        const displayScore = row.match_score !== undefined && row.match_score !== null ? Number(row.match_score) : null;

        return displayScore !== null ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSkillGapTarget(row);
            }}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold cursor-pointer transition-all hover:shadow-md hover:scale-105 ${
              displayScore >= 85 ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' :
              displayScore >= 70 ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
              displayScore >= 50 ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' :
              'bg-rose-100 text-rose-800 hover:bg-rose-200'
            }`}
            title="Click to view skill gap analysis"
          >
            {displayScore}% Match
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 opacity-60">
              <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </button>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        );
      },
    },
    {
      key: "job",
      label: "Job",
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.job?.title || row.job_title || `Job #${row.job_id}`}
          </div>
          <div className="text-xs text-gray-500">
            {row.job?.location || row.location || ""}
          </div>
        </div>
      ),
    },
    {
      key: "applied_on",
      label: "Applied On",
      render: (row) => formatDate(row.applied_at || row.created_at),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <StatusBadge status={normalizeApplicationStatus(row.status)}>
          {normalizeApplicationStatus(row.status)}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      label: "Move To",
      render: (row) => {
        const status = normalizeApplicationStatus(row.status);
        const actions = getMoveToActions(status);

        if (actions.terminalLabel) {
          return (
            <span className="text-xs font-medium italic text-gray-400">
              {actions.terminalLabel}
            </span>
          );
        }

        return (
          <div className="flex flex-wrap items-center gap-2">
            {actions.primaryAction ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (actions.primaryAction.type === "schedule") {
                    setScheduleTarget(row);
                    setScheduleError("");
                    return;
                  }

                  setConfirmAction({ application: row, nextStatus: actions.primaryAction.nextStatus });
                }}
                className={`rounded-md border px-3 py-1 text-xs font-semibold transition-colors ${
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
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmAction({ application: row, nextStatus: actions.secondaryAction.nextStatus });
                }}
                className="rounded-md border border-rose-400 px-3 py-1 text-xs font-semibold text-rose-500 transition-colors hover:bg-rose-50"
              >
                {actions.secondaryAction.label}
              </button>
            ) : null}
          </div>
        );
      },
    },
  ];

  // ── render — identical structure to candidate Applications ────────────────
  return (
    <div className="space-y-4">
      {/* page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <p className="text-sm text-gray-600">
          Review and manage candidate applications
        </p>
      </div>

      {/* filter tabs inside a card — same as candidate page */}
      <div className="rounded-lg border border-orange-100 bg-white p-4">
        <FilterTabs
          tabs={TABS}
          active={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      {/* table / loading / error / empty states — identical pattern */}
      {loading ? (
        <LoadingSkeleton rows={5} columns={5} />
      ) : error ? (
        <EmptyState title="Failed to load" message={error} />
      ) : applications.length === 0 ? (
        <EmptyState
          title="No applications yet"
          message={
            statusFilter === "all"
              ? "No candidates have applied to your jobs yet"
              : `No applications with status "${statusFilter}"`
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={applications}
          loading={loading}
          empty="No applications found"
        />
      )}

      {scheduleTarget ? (
        <InterviewScheduleModal
          open={Boolean(scheduleTarget)}
          application={scheduleTarget}
          onClose={() => {
            setScheduleTarget(null);
            setScheduleError("");
          }}
          onSubmit={handleScheduleSubmit}
          submitting={scheduling}
          error={scheduleError}
        />
      ) : null}

      {/* Skill Gap Modal */}
      <SkillGapModal
        open={Boolean(skillGapTarget)}
        application={skillGapTarget}
        onClose={() => setSkillGapTarget(null)}
      />

      <ConfirmationModal
        open={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        action={confirmAction?.nextStatus}
        application={confirmAction?.application}
        onConfirm={() => {
          handleStatusChange(confirmAction.application.id, confirmAction.nextStatus);
          setConfirmAction(null);
        }}
      />

      <CandidateProfileModal
        open={Boolean(profileTarget)}
        onClose={() => setProfileTarget(null)}
        application={profileTarget}
        allApplications={applications}
      />
    </div>
  );
}
