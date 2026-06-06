import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import SearchInput from "../../components/shared/SearchInput";
import FilterTabs from "../../components/shared/FilterTabs";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import ErrorState from "../../components/shared/ErrorState";
import EmptyState from "../../components/shared/EmptyState";
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

      {/* ── Card grid ── */}
      {loading ? (
        <LoadingSkeleton rows={6} columns={1} />
      ) : filteredJobs.length === 0 ? (
        <EmptyState
          title="No jobs found"
          message="Try adjusting your search filters"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredJobs.map((job) => {
            const isApplied  = hasApplied(job.id);
            const isClosed   = job.status === "closed";
            const isApplying = applyingId === job.id;

            // skill tags — from JobSkills association or skills array
            const skills = (
              job.JobSkills?.map((js) => js.Skill?.name || js.skill_name).filter(Boolean) ||
              job.skills?.map((s) => s.name || s).filter(Boolean) ||
              []
            ).slice(0, 5);

            // match score colour
            const score = job.match_score;
            const scoreBg =
              score >= 80 ? "bg-emerald-100 text-emerald-700" :
              score >= 60 ? "bg-orange-100 text-orange-700" :
              score != null ? "bg-gray-100 text-gray-500" : null;

            // meta line: company · location · job type
            const metaParts = [
              job.companyName !== "-" ? job.companyName : null,
              job.location    || null,
              job.workTypeLabel !== "-" ? job.workTypeLabel.replace(/_/g, " ") : null,
            ].filter(Boolean);

            return (
              <div
                key={job.id}
                className="flex flex-col rounded-2xl border border-orange-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-orange-200 transition-all duration-200"
              >
                {/* title + match score */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h2 className="text-base font-semibold text-gray-900 leading-snug">
                    {job.title || `Job #${job.id}`}
                  </h2>
                  {scoreBg && score != null && (
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${scoreBg}`}>
                      {score}%
                    </span>
                  )}
                </div>

                {/* company · location · type */}
                {metaParts.length > 0 && (
                  <p className="text-xs text-gray-500 mb-3 capitalize">
                    {metaParts.join(" · ")}
                  </p>
                )}

                {/* skill tags */}
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {skills.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-orange-50 border border-orange-100 px-2.5 py-0.5 text-[11px] font-medium text-orange-700"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="mb-4" />
                )}

                {/* push buttons to bottom */}
                <div className="mt-auto flex gap-2">
                  {/* Apply Now */}
                  <button
                    onClick={() => !isApplied && !isClosed && handleApply(job.id)}
                    disabled={isClosed || isApplied || isApplying}
                    className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${
                      isApplied
                        ? "bg-emerald-50 text-emerald-600 cursor-default border border-emerald-200"
                        : isClosed
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : isApplying
                        ? "bg-orange-400 text-white cursor-not-allowed"
                        : "bg-orange-500 text-white hover:bg-orange-600"
                    }`}
                  >
                    {isApplying ? "Applying…" : isApplied ? "Applied" : isClosed ? "Closed" : "Apply Now"}
                  </button>

                  {/* View My Gap */}
                  <button
                    onClick={() => toast.info(`Gap analysis for "${job.title}" coming soon`)}
                    className="flex-1 rounded-xl border border-gray-200 bg-white py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    View My Gap
                  </button>
                </div>
              </div>
            );
          })}
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
