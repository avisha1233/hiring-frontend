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
            {resolveCandidateName(row)}
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

                  handleStatusChange(row.id, actions.primaryAction.nextStatus);
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
                  handleStatusChange(row.id, actions.secondaryAction.nextStatus);
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
    </div>
  );
}
