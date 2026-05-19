// src/pages/company/Candidates.jsx

import { useState, useEffect } from "react";
import { MapPin, Briefcase, Clock, User } from "lucide-react";
import SearchInput from "../../components/shared/SearchInput";
import FilterTabs from "../../components/shared/FilterTabs";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import ErrorState from "../../components/shared/ErrorState";
import EmptyState from "../../components/shared/EmptyState";
import Pagination from "../../components/shared/Pagination";
import { useDebounce, usePagination } from "../../hooks";
import { getCompanyProfile } from "@/apis/company";
import { api } from "../../services/api";
import { useNavigate } from "react-router-dom";

// ── experience level filter tabs — same shape as BrowseJobs STATUS_TABS ──────
const EXPERIENCE_TABS = [
  { value: "all",    label: "All"        },
  { value: "0-1",    label: "0–1 yrs"   },
  { value: "1-3",    label: "1–3 yrs"   },
  { value: "3-5",    label: "3–5 yrs"   },
  { value: "5+",     label: "5+ yrs"    },
];

// ── availability filter — mirrors the level <select> in BrowseJobs ────────────
const NOTICE_OPTIONS = [
  { value: "all",  label: "Any notice period" },
  { value: "0",    label: "Immediate"          },
  { value: "30",   label: "≤ 30 days"          },
  { value: "60",   label: "≤ 60 days"          },
  { value: "90",   label: "≤ 90 days"          },
];

export default function Candidates() {
  const [candidates, setCandidates]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [search, setSearch]           = useState("");
  const debouncedSearch               = useDebounce(search, 300);
  const [expFilter, setExpFilter]     = useState("all");
  const [noticeFilter, setNoticeFilter] = useState("all");
  const { page, pageSize, goToPage }  = usePagination();
  const navigate                      = useNavigate();

  // ── fetch candidates from the real API ─────────────────────────────────────
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        search: debouncedSearch || undefined,
        page,
        limit: pageSize,
      };

      const res  = await api.get("/candidates", { params });
      const data = res?.data?.data || res?.data || res || [];
      setCandidates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page]);

  // ── client-side experience + notice period filtering ───────────────────────
  const filteredCandidates = candidates.filter((c) => {
    // experience band filter
    if (expFilter !== "all") {
      const exp = Number(c.experience ?? 0);
      if (expFilter === "0-1"  && !(exp >= 0 && exp <  1)) return false;
      if (expFilter === "1-3"  && !(exp >= 1 && exp <  3)) return false;
      if (expFilter === "3-5"  && !(exp >= 3 && exp <  5)) return false;
      if (expFilter === "5+"   && !(exp >= 5))              return false;
    }

    // notice period filter
    if (noticeFilter !== "all") {
      const np = Number(c.notice_period_days ?? 999);
      if (noticeFilter === "0"  && np !== 0)   return false;
      if (noticeFilter === "30" && np > 30)    return false;
      if (noticeFilter === "60" && np > 60)    return false;
      if (noticeFilter === "90" && np > 90)    return false;
    }

    return true;
  });

  // ── resolve skill tags from whatever shape the API returns ─────────────────
  function getSkills(candidate) {
    // API might return candidate.skills as array of strings or objects
    const raw = candidate.skills || candidate.candidate_skills || [];
    return raw.slice(0, 4).map((s) =>
      typeof s === "string" ? s : s?.skill?.name || s?.name || "Skill"
    );
  }

  // ── error state — same as BrowseJobs ──────────────────────────────────────
  if (error) {
    return (
      <ErrorState
        title="Failed to load candidates"
        message={error}
        onRetry={fetchData}
      />
    );
  }

  return (
    <div className="space-y-4">

      {/* ── page header — identical structure to BrowseJobs ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
        <p className="text-sm text-gray-600">
          Browse and discover available candidates
        </p>
      </div>

      {/* ── search + notice period select — mirrors BrowseJobs filter bar ── */}
      <div className="flex flex-wrap gap-4 rounded-lg border border-orange-100 bg-white p-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or location..."
          disabled={loading}
        />
        <select
          value={noticeFilter}
          onChange={(e) => setNoticeFilter(e.target.value)}
          className="rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          {NOTICE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── experience tabs — mirrors STATUS_TABS in BrowseJobs ── */}
      <FilterTabs
        tabs={EXPERIENCE_TABS}
        active={expFilter}
        onChange={setExpFilter}
      />

      {/* ── table / loading / empty states — identical pattern ── */}
      {loading ? (
        <LoadingSkeleton rows={5} columns={6} />
      ) : filteredCandidates.length === 0 ? (
        <EmptyState
          title="No candidates found"
          message="Try adjusting your search or filters"
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-orange-100 bg-white shadow-sm">
          <table className="w-full">

            {/* thead — same classes as BrowseJobs */}
            <thead className="border-b border-orange-100 bg-orange-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Experience
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Skills
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Notice Period
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                  Action
                </th>
              </tr>
            </thead>

            {/* tbody — same row classes as BrowseJobs */}
            <tbody>
              {filteredCandidates.map((candidate) => {
                const name     = candidate.user?.full_name
                  || candidate.full_name
                  || candidate.name
                  || `Candidate #${candidate.id}`;

                const email    = candidate.user?.email || candidate.email || "";
                const exp      = candidate.experience ?? 0;
                const location = candidate.location || "-";
                const notice   = candidate.notice_period_days != null
                  ? candidate.notice_period_days === 0
                    ? "Immediate"
                    : `${candidate.notice_period_days} days`
                  : "-";
                const skills   = getSkills(candidate);

                return (
                  <tr
                    key={candidate.id}
                    className="border-b border-orange-50 hover:bg-orange-50"
                  >
                    {/* name + email */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* initials avatar — mirrors how candidate pages show people */}
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700">
                          {name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{name}</p>
                          {email && (
                            <p className="text-xs text-gray-500">{email}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* experience */}
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Briefcase size={14} className="text-gray-400" />
                        {exp} {exp === 1 ? "yr" : "yrs"}
                      </div>
                    </td>

                    {/* skills tags — same pill style as job level in BrowseJobs */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {skills.length === 0 ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : (
                          skills.map((skill) => (
                            <span
                              key={skill}
                              className="inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700"
                            >
                              {skill}
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    {/* location */}
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin size={14} className="text-gray-400" />
                        {location}
                      </div>
                    </td>

                    {/* notice period */}
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock size={14} className="text-gray-400" />
                        {notice}
                      </div>
                    </td>

                    {/* action — View Profile button, same alignment as BrowseJobs */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() =>
                          navigate(`/company/candidates/${candidate.id}`)
                        }
                        className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── pagination — identical to BrowseJobs ── */}
      {!loading && filteredCandidates.length > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={filteredCandidates.length * 2}
          onPageChange={goToPage}
        />
      )}

    </div>
  );
}