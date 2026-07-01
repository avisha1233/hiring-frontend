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
import { candidateApi } from "@/apis/candidate";
import { updateApplicationStatus } from "../../services/applicationService";

const TABS = [
  { value: "all", label: "All" },
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "hired", label: "Hired" },
  { value: "rejected", label: "Rejected" },
];

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();

  const user = getAuthUser();
  const userId = user?.id;

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        status: statusFilter !== "all" ? statusFilter : undefined,
      };
      const response = await candidateApi.getApplications(params);

      // Debug: verify payload shape and records returned by API.
      console.log("[MyApplications] getApplications response:", response);

      const data = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      setApplications(data);
    } catch (err) {
      setError(err.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, statusFilter]);

  useEffect(() => {
    const onApplicationCreated = () => {
      fetchApplications();
    };

    window.addEventListener(
      "candidate:application-created",
      onApplicationCreated,
    );
    return () => {
      window.removeEventListener(
        "candidate:application-created",
        onApplicationCreated,
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, statusFilter]);

  const handleAccept = async (app) => {
    try {
      await updateApplicationStatus(app.id, "accepted");
      toast.success("Offer accepted");
      fetchApplications();
    } catch (err) {
      toast.error("Failed to accept offer");
    }
  };

  const columns = [
    {
      key: "job",
      label: "Job Title",
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.job?.title || row.jobTitle || row.job_title || "-"}
          </div>
          <div className="text-xs text-gray-500">
            {row.job?.is_remote
              ? "Remote"
              : row.job?.location || row.location || ""}
          </div>
        </div>
      ),
    },
    {
      key: "company",
      label: "Company",
      render: (row) =>
        row.companyName || row.company_name || row.job?.company?.name || "-",
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
      key: "action",
      label: "Action",
      render: (row) =>
        String(row.status).toLowerCase() === "hired" ? (
          <div className="rounded-md bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700 border border-emerald-200">
            Hired
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/candidate/applications/${row.id}`);
            }}
            className="rounded-md border border-orange-200 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-orange-50"
          >
            View Details
          </button>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
        <p className="text-sm text-gray-600">Track your job applications</p>
      </div>

      <div className="rounded-lg border border-orange-100 bg-white p-4">
        <FilterTabs
          tabs={TABS}
          active={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      {loading ? (
        <LoadingSkeleton rows={5} columns={5} />
      ) : error ? (
        <EmptyState title="Failed to load" message={error} />
      ) : applications.length === 0 ? (
        <EmptyState
          title="No applications yet"
          message="You haven't applied to any jobs yet"
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
