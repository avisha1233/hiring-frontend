import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import StatusBadge from "../../components/shared/StatusBadge";
import ErrorState from "../../components/shared/ErrorState";
import EmptyState from "../../components/shared/EmptyState";
import { getCompanyCandidates, getCompanyInterviews } from "@/apis/company";
import { formatDateTime } from "../../utils/formatters";
import { normalizeApplicationStatus } from "../../utils/applicationStatus";
import { CalendarDays, Clock, MapPin, Search, Video } from "lucide-react";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "interviewing", label: "Interviewing" },
  { value: "scheduled", label: "Scheduled" },
];

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  if (Array.isArray(value?.rows)) return value.rows;
  return [];
}

function resolveCandidateName(row) {
  return (
    [row?.candidate?.first_name, row?.candidate?.last_name]
      .filter(Boolean)
      .join(" ") ||
    row?.candidate?.name ||
    row?.candidate?.full_name ||
    row?.candidate_name ||
    row?.full_name ||
    row?.name ||
    `Candidate #${row?.id}`
  );
}

function resolveCandidateEmail(row) {
  return row?.candidate?.email || row?.email || row?.candidate_email || "";
}

function resolveJobTitle(row) {
  return (
    row?.interview?.job?.title ||
    row?.interview?.job_title ||
    row?.job?.title ||
    row?.job_title ||
    row?.application?.job?.title ||
    `Job #${row?.job_id || row?.interview?.job?.id || "—"}`
  );
}

function resolveInterview(interviewRows, candidate) {
  const candidateApplicationId = Number(
    candidate?.application_id || candidate?.application?.id,
  );
  const candidateId = Number(
    candidate?.candidate_id || candidate?.candidate?.id || candidate?.id,
  );

  const match = interviewRows.find((interview) => {
    const interviewApplicationId = Number(
      interview?.application_id || interview?.application?.id,
    );
    const interviewCandidateId = Number(
      interview?.candidate?.id || interview?.application?.candidate_id,
    );
    return (
      (Number.isFinite(candidateApplicationId) &&
        interviewApplicationId === candidateApplicationId) ||
      (Number.isFinite(candidateId) && interviewCandidateId === candidateId)
    );
  });

  return match || null;
}

function interviewTypeLabel(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "online" || normalized === "virtual") return "Online";
  if (normalized === "onsite" || normalized === "offline") return "On-site";
  return value ? String(value) : "Not set";
}

function interviewTypeIcon(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "online" || normalized === "virtual") {
    return <Video size={14} className="text-orange-500" />;
  }
  if (normalized === "onsite" || normalized === "offline") {
    return <MapPin size={14} className="text-orange-500" />;
  }
  return null;
}

function initials(name) {
  return String(name || "?")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Interviews() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const interviewsQuery = useQuery({
    queryKey: ["company", "interviews", "roster"],
    queryFn: async () => {
      const [candidateRes, interviewRes] = await Promise.all([
        getCompanyCandidates({ limit: 200 }),
        getCompanyInterviews({ limit: 200, sortDirection: "ASC" }),
      ]);

      return {
        candidates: toArray(candidateRes),
        interviews: toArray(interviewRes),
      };
    },
  });

  const rows = useMemo(() => {
    const candidateRows = toArray(interviewsQuery.data?.candidates).filter(
      (candidate) => {
        const status = normalizeApplicationStatus(
          candidate?.application_status || candidate?.status,
        );
        return status === "interviewing" || status === "scheduled";
      },
    );

    const interviewRows = toArray(interviewsQuery.data?.interviews)
      .slice()
      .sort((left, right) => {
        const leftTime = new Date(left?.scheduled_at || 0).getTime();
        const rightTime = new Date(right?.scheduled_at || 0).getTime();
        return leftTime - rightTime;
      });

    return candidateRows
      .map((candidate) => {
        const interview = resolveInterview(interviewRows, candidate);
        const applicationStatus = normalizeApplicationStatus(
          candidate?.application_status || candidate?.status,
        );

        return {
          ...candidate,
          applicationStatus,
          interview,
        };
      })
      .filter((row) => {
        if (statusFilter !== "all" && row.applicationStatus !== statusFilter) {
          return false;
        }

        if (!search.trim()) {
          return true;
        }

        const haystack = [
          resolveCandidateName(row),
          resolveCandidateEmail(row),
          resolveJobTitle(row),
          row?.interview?.status,
          row?.interview?.interview_type,
          row?.interview?.candidate_name,
          row?.interview?.job_title,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(search.trim().toLowerCase());
      })
      .sort((left, right) => {
        const leftTime = new Date(left?.interview?.scheduled_at || 0).getTime();
        const rightTime = new Date(
          right?.interview?.scheduled_at || 0,
        ).getTime();
        return leftTime - rightTime;
      });
  }, [interviewsQuery.data, search, statusFilter]);

  const stats = useMemo(() => {
    const scheduledCount = rows.filter(
      (row) => row.applicationStatus === "scheduled",
    ).length;
    const interviewingCount = rows.filter(
      (row) => row.applicationStatus === "interviewing",
    ).length;
    const withInterviewDetails = rows.filter((row) => row.interview).length;
    const upcomingCount = rows.filter((row) => {
      const time = new Date(row?.interview?.scheduled_at || 0).getTime();
      return Number.isFinite(time) && time >= Date.now();
    }).length;

    return {
      total: rows.length,
      interviewing: interviewingCount,
      scheduled: scheduledCount,
      upcoming: upcomingCount,
      withInterviewDetails,
    };
  }, [rows]);

  const loading = interviewsQuery.isLoading;
  const error = interviewsQuery.error;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-xl border border-orange-100 bg-white p-5 shadow-sm"
            />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-xl border border-orange-100 bg-white p-6 shadow-sm" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load interviews"
        message={
          error?.message || "Unable to fetch the company interview roster."
        }
        onRetry={() => interviewsQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
          <p className="mt-1 text-sm text-gray-600">
            Real interview activity for candidates currently interviewing or
            already scheduled.
          </p>
        </div>
        <div className="inline-flex items-center rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-700">
          {stats.withInterviewDetails}/{stats.total} matched to interview
          records
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total", value: stats.total },
          { label: "Interviewing", value: stats.interviewing },
          { label: "Scheduled", value: stats.scheduled },
          { label: "Upcoming", value: stats.upcoming },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-orange-100 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {item.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-orange-500">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-orange-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search candidate, job, interviewer, or interview type"
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
        >
          {STATUS_FILTERS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-orange-100 bg-white shadow-sm">
        {rows.length === 0 ? (
          <EmptyState
            title="No matching interviews"
            message={
              search || statusFilter !== "all"
                ? "Try a wider search or clear the status filter."
                : "Interviewing and scheduled candidates will appear here once interview records exist."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-orange-50 bg-orange-50/70">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Candidate
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Job
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Candidate Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Interview Details
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Schedule
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Interviewer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Interview Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row) => {
                  const candidateName = resolveCandidateName(row);
                  const candidateEmail = resolveCandidateEmail(row);
                  const jobTitle = resolveJobTitle(row);
                  const interview = row.interview;
                  const interviewerName =
                    interview?.interviewer?.full_name ||
                    interview?.interviewer_name ||
                    interview?.interviewerName ||
                    (interview?.interviewer_id
                      ? `User #${interview.interviewer_id}`
                      : "—");

                  return (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-orange-50/30"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700">
                            {initials(candidateName)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {candidateName}
                            </p>
                            {candidateEmail ? (
                              <p className="text-xs text-gray-500">
                                {candidateEmail}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-700">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {jobTitle}
                          </span>
                          {row?.interview?.job?.location || row?.job?.location ? (
                            <span className="text-xs text-gray-500">
                              {row?.interview?.job?.location || row?.job?.location}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={row.applicationStatus} />
                      </td>
                      <td className="px-4 py-4 text-gray-700">
                        {interview ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 capitalize text-gray-900">
                              {interviewTypeIcon(interview.interview_type)}
                              <span className="font-medium">
                                {interviewTypeLabel(interview.interview_type)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              {interview.duration_minutes
                                ? `${interview.duration_minutes} min`
                                : "Duration not set"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-500">
                            No interview record yet
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-gray-700">
                        {interview?.scheduled_at ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <CalendarDays
                                size={13}
                                className="text-orange-400"
                              />
                              <span>
                                {formatDateTime(interview.scheduled_at)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Clock size={13} className="text-orange-400" />
                              <span>
                                {new Date(
                                  interview.scheduled_at,
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">
                            Pending schedule
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-gray-700">
                        {interviewerName}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge
                          status={interview?.status || row.applicationStatus}
                        />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() =>
                            navigate(`/company/candidates/${row.id}`, {
                              state: { candidate: row },
                            })
                          }
                          className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-600"
                        >
                          View candidate
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
