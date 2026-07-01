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
  { value: "offered", label: "Offered" },
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
      label: "Offer",
      nextStatus: "offered",
      tone: "emerald",
    },
    secondaryAction: {
      label: "Reject",
      nextStatus: "rejected",
    },
  },
  offered: {
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

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyId, setCompanyId] = useState(null);
  const [scheduleTarget, setScheduleTarget] = useState(null);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState("");

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
      setApplications(Array.isArray(data) ? data : []);
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
          <div className="font-medium text-gray-900">
            {resolveCandidateName(row)}
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
      render: (row) => (
        row.match_score !== undefined && row.match_score !== null ? (
          <div className="group relative inline-flex items-center">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              row.match_score >= 85 ? 'bg-emerald-100 text-emerald-800' :
              row.match_score >= 70 ? 'bg-blue-100 text-blue-800' :
              row.match_score >= 50 ? 'bg-orange-100 text-orange-800' :
              'bg-rose-100 text-rose-800'
            }`}>
              {row.match_score}% Match
            </span>
            
            {/* Breakdown Tooltip */}
            {row.match_breakdown && (
              <div className="invisible absolute bottom-full left-1/2 z-10 mb-2 w-48 -translate-x-1/2 rounded bg-gray-900 p-3 text-xs text-white opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
                <p className="font-semibold border-b border-gray-700 pb-1 mb-2">Score Breakdown</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Skills Fit:</span>
                    <span className="font-medium">{row.match_breakdown.skillScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Experience:</span>
                    <span className="font-medium">{row.match_breakdown.experienceScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Location:</span>
                    <span className="font-medium">{row.match_breakdown.locationScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Notice Period:</span>
                    <span className="font-medium">{row.match_breakdown.noticePeriodScore}%</span>
                  </div>
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )
      ),
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
          interviewerId={user?.id}
          onClose={() => {
            setScheduleTarget(null);
            setScheduleError("");
          }}
          onSubmit={handleScheduleSubmit}
          submitting={scheduling}
          error={scheduleError}
        />
      ) : null}
    </div>
  );
}
