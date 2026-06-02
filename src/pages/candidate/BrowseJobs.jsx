import { useEffect, useMemo, useState } from "react";
import { MapPin, DollarSign, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import SearchInput from "../../components/shared/SearchInput";
import FilterTabs from "../../components/shared/FilterTabs";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import ErrorState from "../../components/shared/ErrorState";
import EmptyState from "../../components/shared/EmptyState";
import StatusBadge from "../../components/shared/StatusBadge";
import Pagination from "../../components/shared/Pagination";
import { useDebounce, usePagination } from "../../hooks";
import { jobsApi } from "../../apis/candidate";
import { candidateApi } from "../../apis/candidate";
import { getCompanies } from "../../apis/companies";

const STATUS_TABS = [
  { value: "all", label: "All Jobs" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

const LEVELS = [
  { value: "all", label: "All Levels" },
  { value: "junior", label: "Entry Level" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior" },
];

function formatMoney(value) {
  if (value === undefined || value === null || value === "") return null;

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return String(value);

  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    numericValue,
  );
}

function formatSalary(job) {
  const minSalary = job.min_salary;
  const maxSalary = job.max_salary;
  const currency = job.currency || "NPR";

  const normalizedMin = formatMoney(minSalary);
  const normalizedMax = formatMoney(maxSalary);

  if (normalizedMin && normalizedMax) {
    return `${normalizedMin} - ${normalizedMax}${currency ? ` ${currency}` : ""}`;
  }

  if (normalizedMin) {
    return `${normalizedMin}${currency ? ` ${currency}` : ""}`;
  }

  if (normalizedMax) {
    return `${normalizedMax}${currency ? ` ${currency}` : ""}`;
  }

  return "-";
}

function formatWorkType(job) {
  const explicitType = job.work_type || job.job_type || job.type;
  if (explicitType) return String(explicitType);

  if (typeof job.is_remote === "boolean") {
    return job.is_remote ? "Remote" : "On-site";
  }

  return "-";
}

function formatExperience(job) {
  const level = job.experience_level || job.level;
  const requiredYears = job.required_experience ?? job.experience_years;

  if (level) {
    return String(level)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  if (
    requiredYears !== undefined &&
    requiredYears !== null &&
    requiredYears !== ""
  ) {
    return `${requiredYears}+ yrs`;
  }

  return "-";
}

function normalizeJob(job, companyName) {
  const nestedCompanyName = job.company?.name || job.company?.company_name;
  const experienceLevelValue = job.experience_level || job.level || "";

  return {
    ...job,
    companyName:
      nestedCompanyName ||
      job.company_name ||
      job.companyName ||
      companyName ||
      "-",
    experienceLevelValue,
    salaryLabel: formatSalary(job),
    workTypeLabel: formatWorkType(job),
    experienceLabel: formatExperience(job),
  };
}

function normalizeRows(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  return [];
}

export default function BrowseJobs() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [applyingId, setApplyingId] = useState(null);
  const { page, pageSize, goToPage } = usePagination();

  const companiesQuery = useQuery({
    queryKey: ["candidate", "companies"],
    queryFn: async () => {
      const response = await getCompanies({ page: 1, limit: 200 });
      return response?.data?.data || response?.data || response || [];
    },
    staleTime: 60_000,
    retry: false,
  });

  const companyMap = useMemo(() => {
    const rows = normalizeRows(companiesQuery.data);
    const map = new Map();

    rows.forEach((company) => {
      map.set(String(company.id), company.name);
    });

    return map;
  }, [companiesQuery.data]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {
        search: debouncedSearch,
        status: statusFilter !== "all" ? statusFilter : undefined,
        page,
        limit: pageSize,
      };

      const [jobsRes, appsRes] = await Promise.all([
        jobsApi.getJobs(params),
        candidateApi.getApplications(),
      ]);

      setJobs(jobsRes?.data || jobsRes || []);
      setApplications(appsRes?.data || appsRes || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [debouncedSearch, statusFilter, page]);

  const handleApply = async (jobId) => {
    try {
      setApplyingId(jobId);
      const created = await candidateApi.applyToJob(jobId);

      setApplications((prev) => {
        if (prev.some((app) => Number(app.job_id) === Number(jobId))) {
          return prev;
        }

        return [
          {
            id: created?.id || `optimistic-${jobId}`,
            job_id: Number(jobId),
            status: created?.status || "applied",
            applied_at: created?.applied_at || new Date().toISOString(),
          },
          ...prev,
        ];
      });

      window.dispatchEvent(new Event("candidate:application-created"));
      toast.success("Application submitted successfully");
      await fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to apply for job");
    } finally {
      setApplyingId(null);
    }
  };

  const hasApplied = (jobId) => {
    return applications.some((app) => app.job_id === jobId);
  };

  const displayJobs = useMemo(
    () =>
      jobs.map((job) =>
        normalizeJob(job, companyMap.get(String(job.company_id))),
      ),
    [jobs, companyMap],
  );

  const filteredJobs = displayJobs.filter((job) => {
    if (levelFilter !== "all" && job.experienceLevelValue !== levelFilter)
      return false;
    return true;
  });

  if (error) {
    return (
      <ErrorState
        title="Failed to load jobs"
        message={error}
        onRetry={fetchData}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Browse Jobs</h1>
        <p className="text-sm text-gray-600">
          Explore available job opportunities
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 rounded-lg border border-orange-100 bg-white p-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by job title or company..."
          disabled={loading}
        />
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          {LEVELS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      {/* Status Tabs */}
      <FilterTabs
        tabs={STATUS_TABS}
        active={statusFilter}
        onChange={setStatusFilter}
      />

      {/* Table */}
      {loading ? (
        <LoadingSkeleton rows={5} columns={6} />
      ) : filteredJobs.length === 0 ? (
        <EmptyState
          title="No jobs found"
          message="Try adjusting your search filters"
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-orange-100 bg-white shadow-sm">
          <table className="w-full">
            <thead className="border-b border-orange-100 bg-orange-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Job Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Company
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Level
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Salary
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Remote
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => {
                const isApplied = hasApplied(job.id);
                const isClosed = job.status === "closed";
                const isApplying = applyingId === job.id;

                return (
                  <tr
                    key={job.id}
                    className="border-b border-orange-50 hover:bg-orange-50"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{job.title}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {job.companyName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin size={14} className="text-gray-400" />
                        {job.location || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
                        {job.experienceLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <DollarSign size={14} className="text-gray-400" />
                        {job.salaryLabel}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        {job.workTypeLabel}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={job.status}>
                        {job.status}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleApply(job.id)}
                        disabled={isClosed || isApplied || isApplying}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                          isClosed || isApplied
                            ? "cursor-not-allowed bg-gray-100 text-gray-400"
                            : isApplying
                              ? "bg-orange-400 text-white"
                              : "bg-orange-500 text-white hover:bg-orange-600"
                        }`}
                      >
                        {isApplying
                          ? "Applying..."
                          : isApplied
                            ? "Applied"
                            : isClosed
                              ? "Closed"
                              : "Apply"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredJobs.length > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={filteredJobs.length * 2}
          onPageChange={goToPage}
        />
      )}
    </div>
  );
}
