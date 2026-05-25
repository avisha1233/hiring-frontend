import { useEffect, useState } from "react";
import { FileText, CalendarDays } from "lucide-react";
import { useLocation } from "react-router-dom";
import SearchInput from "../../components/shared/SearchInput";
import EmptyState from "../../components/shared/EmptyState";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import StatusBadge from "../../components/shared/StatusBadge";
import { getSubmissions } from "@/apis/company";

export default function Submissions() {
  const location = useLocation();
  const [search, setSearch] = useState(
    new URLSearchParams(location.search).get("search") || "",
  );
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const querySearch =
      new URLSearchParams(location.search).get("search") || "";
    setSearch(querySearch);
  }, [location.search]);

  useEffect(() => {
    let cancelled = false;

    async function loadSubmissions() {
      setLoading(true);
      setError("");

      try {
        const res = await getSubmissions({ page: 1, limit: 50 });
        const data = res?.data?.data || res?.data || res || [];
        const rows = Array.isArray(data) ? data : [];
        const normalizedSearch = search.trim().toLowerCase();

        const filteredRows = normalizedSearch
          ? rows.filter((submission) => {
              const candidateName = String(
                submission.candidate?.full_name ||
                  submission.candidate?.name ||
                  submission.candidate_name ||
                  "",
              ).toLowerCase();
              const taskTitle = String(
                submission.task?.title || submission.task_title || "",
              ).toLowerCase();

              return (
                candidateName.includes(normalizedSearch) ||
                taskTitle.includes(normalizedSearch)
              );
            })
          : rows;

        if (!cancelled) {
          setSubmissions(filteredRows);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load submissions");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSubmissions();

    return () => {
      cancelled = true;
    };
  }, [search]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Submissions</h1>
        <p className="text-sm text-gray-600">
          Review task submissions from candidates
        </p>
      </div>

      <div className="rounded-lg border border-orange-100 bg-white p-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search submissions..."
          disabled={loading}
        />
      </div>

      {loading ? (
        <LoadingSkeleton rows={5} columns={4} />
      ) : error ? (
        <EmptyState title="Failed to load submissions" message={error} />
      ) : submissions.length === 0 ? (
        <EmptyState
          title="No submissions found"
          message="Try a different search term"
        />
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-orange-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      {submission.task?.title ||
                        submission.task_title ||
                        `Submission #${submission.id}`}
                    </h2>
                  </div>
                  <p className="text-sm text-gray-600">
                    {submission.candidate?.full_name ||
                      submission.candidate?.name ||
                      submission.candidate_name ||
                      "Candidate"}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays size={14} />
                      {submission.created_at || submission.submitted_at || "—"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={submission.status || "pending"} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
