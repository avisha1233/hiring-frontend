// src/pages/company/Applications.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

// ── filter tabs — same shape as candidate Applications ────────────────────────
const TABS = [
  { value: "all", label: "All" },
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offered", label: "Offered" },
  { value: "rejected", label: "Rejected" },
];

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
  const navigate = useNavigate();

  const user = getAuthUser();

  // ── resolve companyId from profile on mount ───────────────────────────────
  useEffect(() => {
    async function resolveCompany() {
      try {
        const res = await getCompanyProfile();
        const profile = res?.data || res || {};
        const id = profile?.id || profile?.company_id || user?.company_id;
        setCompanyId(Number(id));
      } catch {
        setError("Could not load company profile");
        setLoading(false);
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
        <StatusBadge status={row.status}>{row.status}</StatusBadge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          {/* View Profile — navigate to candidate detail */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/company/candidates/${row.candidate_id}`, {
                state: { candidate: row.candidate },
              });
            }}
            className="rounded-md border border-orange-200 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-orange-50"
          >
            View Profile
          </button>

          {/* Schedule — only active when not already interviewing/beyond */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange(row.id, "interviewing");
            }}
            disabled={["interviewing", "offered", "hired", "rejected"].includes(
              String(row.status).toLowerCase(),
            )}
            className="rounded-md bg-orange-500 px-3 py-1 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Schedule
          </button>
        </div>
      ),
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
    </div>
  );
}
