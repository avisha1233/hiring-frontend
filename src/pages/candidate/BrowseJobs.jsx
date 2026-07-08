import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import SearchInput from "../../components/shared/SearchInput";
import FilterTabs from "../../components/shared/FilterTabs";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import ErrorState from "../../components/shared/ErrorState";
import EmptyState from "../../components/shared/EmptyState";
import Pagination from "../../components/shared/Pagination";
import { useDebounce, usePagination } from "../../hooks";
import { jobsApi, candidateApi } from "../../apis/candidate";
import { getCompanies } from "../../apis/companies";
import { api } from "@/services/api";

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

function levelToWeight(str) {
  if (!str) return 2;
  const s = String(str).toLowerCase().trim();
  if (['expert', 'advanced', 'senior'].includes(s)) return 3;
  if (['intermediate', 'mid'].includes(s)) return 2;
  if (['beginner', 'junior', 'basic'].includes(s)) return 1;
  return 2;
}

/** Compute 0-100 match score and breakdown between candidate skills and job required skills */
function computeScoreAndBreakdown(candidateSkills, jobSkills) {
  const breakdown = [];

  if (!Array.isArray(jobSkills) || jobSkills.length === 0) {
    return { score: null, breakdown };
  }

  const candMap = new Map();
  if (Array.isArray(candidateSkills)) {
    candidateSkills.forEach((cs) => {
      const skillName = (cs.Skill?.name || cs.skill?.name || cs.name || "").toLowerCase().trim();
      if (!skillName) return;
      candMap.set(skillName, {
        level: cs.level || cs.proficiency || "intermediate",
        weight: levelToWeight(cs.level || cs.proficiency),
      });
    });
  }

  let totalPossible = 0;
  let actualScore = 0;

  jobSkills.forEach((js) => {
    const skillName = (js.Skill?.name || js.skill?.name || js.name || "").toLowerCase().trim();
    if (!skillName) return;

    const reqLevel = js.required_level || js.level || "intermediate";
    const jobWeight = levelToWeight(reqLevel);
    totalPossible += jobWeight;

    const cand = candMap.get(skillName);

    if (!cand) {
      breakdown.push({
        skill: skillName,
        required: reqLevel,
        candidateLevel: null,
        matchPercentage: 0,
      });
      return;
    }

    const candWeight = cand.weight;
    const matchPercentage = Math.min(Math.round((candWeight / jobWeight) * 100), 100);

    breakdown.push({
      skill: skillName,
      required: reqLevel,
      candidateLevel: cand.level,
      matchPercentage,
    });

    if (candWeight < jobWeight) {
      actualScore += candWeight;
    } else {
      actualScore += jobWeight;
    }
  });

  const score = totalPossible === 0 ? 0 : Math.min(Math.round((actualScore / totalPossible) * 100), 100);

  return { score, breakdown };
}

function formatMoney(value) {
  if (value === undefined || value === null || value === "") return null;
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return String(value);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(numericValue);
}

function formatSalary(job) {
  const minSalary = job.min_salary;
  const maxSalary = job.max_salary;
  const currency = job.currency || "NPR";

  const normalizedMin = formatMoney(minSalary);
  const normalizedMax = formatMoney(maxSalary);

  if (normalizedMin && normalizedMax) {
    return `${normalizedMin} – ${normalizedMax} ${currency}`;
  }
  if (normalizedMin) return `${normalizedMin} ${currency}`;
  if (normalizedMax) return `${normalizedMax} ${currency}`;
  return null;
}

function formatWorkType(job) {
  const explicitType = job.work_type || job.job_type || job.type;
  if (explicitType) return String(explicitType).replace(/_/g, " ");
  if (typeof job.is_remote === "boolean") return job.is_remote ? "Remote" : "On-site";
  return null;
}

function formatExperience(job) {
  const level = job.experience_level || job.level;
  const requiredYears = job.required_experience ?? job.experience_years;

  if (level) {
    return String(level)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  if (requiredYears !== undefined && requiredYears !== null && requiredYears !== "") {
    return `${requiredYears}+ yrs`;
  }
  return null;
}

function normalizeJob(job, companyName) {
  const nestedCompanyName = job.company?.name || job.company?.company_name;
  const experienceLevelValue = job.experience_level || job.level || "";

  return {
    ...job,
    companyName:
      nestedCompanyName || job.company_name || job.companyName || companyName || "-",
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

/** Company initials box — picks first 2 words' first letters */
function CompanyInitials({ name }) {
  const initials = (name && name !== "-")
    ? name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("")
    : "?";

  // Deterministic hue from name string
  const hue = [...(name || "")].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm"
      style={{ background: `hsl(${hue},60%,48%)` }}
      aria-label={name}
    >
      {initials}
    </div>
  );
}

/** Coloured match-score badge */
function ScoreBadge({ score, onClick }) {
  if (score == null) return null;

  const cls =
    score >= 80
      ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-200"
      : score >= 50
        ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-200"
        : "bg-orange-100 text-orange-700 ring-1 ring-orange-200 hover:bg-orange-200";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold flex items-center gap-1 transition-colors ${cls}`}
      title="Click to view skill gap analysis"
    >
      {score}% match
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 opacity-60">
        <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
      </svg>
    </button>
  );
}

/** Coloured application status badge */
function ApplicationStatusBadge({ status }) {
  if (!status) return null;

  const normalized = String(status).toLowerCase();
  
  let cls = "bg-gray-100 text-gray-700 ring-1 ring-gray-200";
  if (normalized === "hired") {
    cls = "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";
  } else if (normalized === "rejected") {
    cls = "bg-red-100 text-red-700 ring-1 ring-red-200";
  } else if (["interviewing", "pending", "applied", "in_review", "shortlisted"].includes(normalized)) {
    cls = "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
  }

  const label = normalized.charAt(0).toUpperCase() + normalized.slice(1).replace(/_/g, " ");

  return (
    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold flex items-center gap-1 ${cls}`}>
      {label}
    </span>
  );
}

function SkillGapModal({ isOpen, onClose, score, breakdown, jobTitle, companyName }) {
  if (!isOpen) return null;

  const displayScore = score || 0;
  const skillsBreakdown = breakdown || [];

  // Calculate met, belowLevel, missing for the summary bar
  let met = 0;
  let belowLevel = 0;
  let missing = 0;

  skillsBreakdown.forEach((b) => {
    if (b.matchPercentage >= 100) met++;
    else if (b.matchPercentage > 0) belowLevel++;
    else missing++;
  });

  const totalSkills = skillsBreakdown.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Skill Gap Analysis</h2>
              <p className="mt-1 text-sm text-gray-500">
                {companyName} — {jobTitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* score summary bar */}
          <div className="mt-4 rounded-xl bg-orange-50 border border-orange-100 p-4">
            <div className="flex items-center gap-4">
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
              <div className="flex flex-wrap gap-2 flex-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {met} Matched
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-medium text-amber-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {belowLevel} Below Level
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  {missing} Missing
                </span>
              </div>
            </div>
          </div>
        </div>

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
                      <span className={`text-xs font-semibold ${item.matchPercentage >= 100 ? 'text-emerald-600' :
                          item.matchPercentage >= 50 ? 'text-amber-600' :
                            'text-rose-600'
                        }`}>
                        matched {item.matchPercentage}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${item.matchPercentage >= 100 ? 'bg-emerald-500' :
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                </div>
                <p className="text-sm text-gray-500">
                  No skill breakdown data available for this application.
                </p>
              </div>
            )
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
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
  const [viewingJob, setViewingJob] = useState(null);
  const [gapModalJob, setGapModalJob] = useState(null);

  const openDetails = (job) => {
    setViewingJob(job);
  };

  // ── Fetch current candidate skills once ──────────────────────────────────
  const { data: meData } = useQuery({
    queryKey: ["candidates", "me"],
    queryFn: async () => {
      const res = await api.get("/candidates/me");
      return res?.data ?? res;
    },
    staleTime: 5 * 60_000,
    retry: false,
  });

  const candidateSkills = useMemo(
    () => meData?.CandidateSkills ?? [],
    [meData],
  );

  // ── Companies lookup ─────────────────────────────────────────────────────
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
    rows.forEach((company) => map.set(String(company.id), company.name));
    return map;
  }, [companiesQuery.data]);

  // ── Jobs + applications fetch ────────────────────────────────────────────
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

  // ── Apply handler ────────────────────────────────────────────────────────
  const handleApply = async (jobId) => {
    try {
      setApplyingId(jobId);
      const created = await candidateApi.applyToJob(jobId);

      setApplications((prev) => {
        if (prev.some((app) => Number(app.job_id) === Number(jobId))) return prev;
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

  const hasApplied = (jobId) => applications.some((app) => app.job_id === jobId);

  // ── Derived job list ─────────────────────────────────────────────────────
  const displayJobs = useMemo(
    () => jobs.map((job) => normalizeJob(job, companyMap.get(String(job.company_id)))),
    [jobs, companyMap],
  );

  const filteredJobs = displayJobs.filter((job) => {
    if (levelFilter !== "all" && job.experienceLevelValue !== levelFilter) return false;
    return true;
  }).sort((a, b) => {
    const scoreA = computeScoreAndBreakdown(candidateSkills, a.JobSkills ?? []).score ?? 0;
    const scoreB = computeScoreAndBreakdown(candidateSkills, b.JobSkills ?? []).score ?? 0;
    return scoreB - scoreA;
  });

  if (error) {
    return <ErrorState title="Failed to load jobs" message={error} onRetry={fetchData} />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Browse Jobs</h1>
        <p className="text-sm text-gray-600">Explore available job opportunities</p>
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
      <FilterTabs tabs={STATUS_TABS} active={statusFilter} onChange={setStatusFilter} />

      {/* ── Single-column card list ── */}
      {loading ? (
        <LoadingSkeleton rows={6} columns={1} />
      ) : filteredJobs.length === 0 ? (
        <EmptyState title="No jobs found" message="Try adjusting your search filters" />
      ) : (
        <div className="flex flex-col gap-4">
          {filteredJobs.map((job) => {
            const application = applications.find((app) => Number(app.job_id) === Number(job.id));
            const isApplied = !!application;
            const isClosed = job.status === "closed";
            const isApplying = applyingId === job.id;

            // Skill tags from JobSkills association
            const skills = (
              job.JobSkills?.map((js) => js.Skill?.name || js.skill_name).filter(Boolean) ||
              job.skills?.map((s) => s.name || s).filter(Boolean) ||
              []
            ).slice(0, 6);

            // Client-side match score
            const { score, breakdown } = computeScoreAndBreakdown(candidateSkills, job.JobSkills ?? []);

            // Meta line: company · location · type
            const metaParts = [
              job.companyName !== "-" ? job.companyName : null,
              job.location || null,
              job.workTypeLabel || null,
            ].filter(Boolean);

            return (
              <div
                key={job.id}
                className="flex flex-col gap-3 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm transition-all duration-200 hover:border-orange-200 hover:shadow-md"
              >
                {/* ── Top row: initials + title/meta + score ── */}
                <div className="flex items-start gap-3">
                  <CompanyInitials name={job.companyName} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-base font-semibold leading-snug text-gray-900">
                        {job.title || `Job #${job.id}`}
                      </h2>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {application?.status && <ApplicationStatusBadge status={application.status} />}
                        <ScoreBadge score={score} onClick={() => setGapModalJob({ job, score, breakdown })} />
                      </div>
                    </div>

                    {metaParts.length > 0 && (
                      <p className="mt-0.5 truncate text-xs capitalize text-gray-500">
                        {metaParts.join(" · ")}
                      </p>
                    )}
                  </div>
                </div>

                {/* ── Skill tags ── */}
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-orange-100 bg-orange-50 px-2.5 py-0.5 text-[11px] font-medium text-orange-700"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* ── Salary + level badges ── */}
                <div className="flex flex-wrap items-center gap-2">
                  {job.salaryLabel && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200">
                      <svg
                        className="h-3 w-3 text-gray-400"
                        fill="none"
                        viewBox="0 0 16 16"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 2v1m0 10v1M4.5 8a3.5 3.5 0 1 0 7 0 3.5 3.5 0 0 0-7 0Z"
                        />
                      </svg>
                      {job.salaryLabel}
                    </span>
                  )}
                  {job.experienceLabel && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-100">
                      {job.experienceLabel}
                    </span>
                  )}
                  {isClosed && (
                    <span className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 ring-1 ring-red-100">
                      Closed
                    </span>
                  )}
                </div>

                {/* ── Action buttons ── */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => openDetails(job)}
                    className="flex-1 rounded-xl border border-orange-200 bg-white py-2 text-sm font-semibold text-orange-600 transition-colors hover:bg-orange-50"
                  >
                    View Details
                  </button>

                  <button
                    id={`apply-btn-${job.id}`}
                    onClick={() => !isApplied && !isClosed && handleApply(job.id)}
                    disabled={isClosed || isApplied || isApplying}
                    className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${isApplied
                        ? "cursor-default border border-emerald-200 bg-emerald-50 text-emerald-600"
                        : isClosed
                          ? "cursor-not-allowed bg-gray-100 text-gray-400"
                          : isApplying
                            ? "cursor-not-allowed bg-orange-400 text-white"
                            : "bg-orange-500 text-white hover:bg-orange-600"
                      }`}
                  >
                    {isApplying ? "Applying…" : isApplied ? "✓ Applied" : isClosed ? "Closed" : "Apply Now"}
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

      {/* ── Job Details Modal ── */}
      {viewingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setViewingJob(null); }}>
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-orange-50 px-6 py-4 shrink-0">
              <div className="flex items-center gap-3">
                <CompanyInitials name={viewingJob.companyName} />
                <div>
                  <h2 className="text-lg font-bold text-gray-900 leading-snug">{viewingJob.title}</h2>
                  <p className="text-sm text-gray-500">{viewingJob.companyName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingJob(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-orange-50 hover:text-orange-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto px-6 py-5 space-y-6">

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-orange-50/40 p-3">
                  <span className="block text-xs text-gray-500">Salary Range</span>
                  <span className="text-sm font-semibold text-gray-900">{viewingJob.salaryLabel || "Not specified"}</span>
                </div>
                <div className="rounded-xl bg-orange-50/40 p-3">
                  <span className="block text-xs text-gray-500">Job Type</span>
                  <span className="text-sm font-semibold text-gray-900 capitalize">{viewingJob.workTypeLabel || "Not specified"}</span>
                </div>
                <div className="rounded-xl bg-orange-50/40 p-3">
                  <span className="block text-xs text-gray-500">Location</span>
                  <span className="text-sm font-semibold text-gray-900">{viewingJob.location || "Not specified"}</span>
                </div>
                <div className="rounded-xl bg-orange-50/40 p-3">
                  <span className="block text-xs text-gray-500">Experience Level</span>
                  <span className="text-sm font-semibold text-gray-900 capitalize">{viewingJob.experienceLabel || "Not specified"}</span>
                </div>
                <div className="rounded-xl bg-orange-50/40 p-3">
                  <span className="block text-xs text-gray-500">Required Experience</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {viewingJob.required_experience != null ? `${viewingJob.required_experience} years` : "Not specified"}
                  </span>
                </div>
                <div className="rounded-xl bg-orange-50/40 p-3">
                  <span className="block text-xs text-gray-500">Project Duration</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {viewingJob.project_duration_days != null ? `${viewingJob.project_duration_days} days` : "Not specified"}
                  </span>
                </div>
              </div>

              {/* Deadline & Remote Status */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 bg-gray-50 p-3.5 rounded-xl">
                <div>
                  <span className="font-semibold text-gray-700">Application Deadline: </span>
                  {viewingJob.deadline ? (
                    new Date(viewingJob.deadline).toLocaleDateString("en-NP", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })
                  ) : "No deadline"}
                </div>
                <div className="h-4 w-px bg-gray-300 self-center hidden sm:block" />
                <div>
                  <span className="font-semibold text-gray-700">Remote Policy: </span>
                  {viewingJob.is_remote ? "Fully Remote" : "On-site / Hybrid"}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">Job Description</h3>
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {viewingJob.description || "No description provided."}
                </div>
              </div>

              {/* Required Skills */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2.5">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {(
                    viewingJob.JobSkills?.map((js) => js.Skill?.name || js.skill_name).filter(Boolean) ||
                    viewingJob.skills?.map((s) => s.name || s).filter(Boolean) ||
                    []
                  ).map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700"
                    >
                      {s}
                    </span>
                  ))}
                  {(!viewingJob.JobSkills || viewingJob.JobSkills.length === 0) && (
                    <span className="text-sm text-gray-400">No specific skills listed.</span>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 border-t border-orange-50 px-6 py-4 shrink-0 bg-gray-50/50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setViewingJob(null)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  const isApplied = hasApplied(viewingJob.id);
                  const isClosed = viewingJob.status === "closed";
                  if (!isApplied && !isClosed) {
                    handleApply(viewingJob.id);
                    setViewingJob(null);
                  }
                }}
                disabled={hasApplied(viewingJob.id) || viewingJob.status === "closed" || applyingId === viewingJob.id}
                className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors ${hasApplied(viewingJob.id)
                    ? "bg-emerald-500 text-white cursor-default"
                    : viewingJob.status === "closed"
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-orange-500 hover:bg-orange-600 text-white"
                  }`}
              >
                {applyingId === viewingJob.id ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : hasApplied(viewingJob.id) ? (
                  "✓ Already Applied"
                ) : viewingJob.status === "closed" ? (
                  "Closed"
                ) : (
                  "Apply Now"
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      <SkillGapModal
        isOpen={!!gapModalJob}
        onClose={() => setGapModalJob(null)}
        score={gapModalJob?.score}
        breakdown={gapModalJob?.breakdown}
        jobTitle={gapModalJob?.job?.title}
        companyName={gapModalJob?.job?.companyName}
      />
    </div>
  );
}
