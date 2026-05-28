// src/pages/company/CandidateProfile.jsx

import { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Briefcase, Clock, Mail } from "lucide-react";
import { api } from "../../services/api";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import ErrorState from "../../components/shared/ErrorState";

// ── safe string: converts any value to a plain string or fallback ─────────────
function safeStr(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  // object like { city: "Kathmandu", country: "Nepal" }
  if (typeof value === "object") {
    return value.city && value.country
      ? `${value.city}, ${value.country}`
      : value.city || value.country || value.name || value.label || fallback;
  }
  return fallback;
}

// ── initials avatar ───────────────────────────────────────────────────────────
function Initials({ name, id }) {
  const display = name || `C${id}`;
  const letters = display
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-xl font-bold text-orange-700">
      {letters}
    </div>
  );
}

// ── resolve helpers ───────────────────────────────────────────────────────────
function resolveName(c) {
  const raw =
    c?.user?.full_name ||
    c?.user?.name ||
    c?.full_name ||
    c?.name ||
    c?.candidate?.full_name ||
    c?.candidate?.name ||
    null;
  return raw ? safeStr(raw) : null;
}

function resolveEmail(c) {
  const raw = c?.user?.email || c?.email || c?.candidate?.email || "";
  return safeStr(raw);
}

function resolveLocation(c) {
  const raw = c?.location || c?.city || c?.address || null;
  return raw ? safeStr(raw, "Not specified") : "Not specified";
}

function resolveSkills(c) {
  const raw = c?.skills || c?.candidate_skills || c?.user?.skills || [];
  return raw
    .map((s) => {
      if (typeof s === "string") return s;
      if (typeof s === "object" && s !== null) {
        return safeStr(
          s?.skill?.name || s?.name || s?.skill || s?.title || null,
        );
      }
      return null;
    })
    .filter(Boolean);
}

function resolveBio(c) {
  const raw = c?.bio || c?.summary || c?.about || null;
  return raw ? safeStr(raw) : null;
}

function normalizePagedCandidates(response) {
  const payload = response?.data?.data || response?.data || {};
  const rows = payload?.data || payload?.rows || [];
  const totalPage = Number(payload?.totalPage || payload?.total_page || 1);

  return {
    rows: Array.isArray(rows) ? rows : [],
    totalPage: Number.isFinite(totalPage) && totalPage > 0 ? totalPage : 1,
  };
}

export default function CandidateProfile() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCandidate = async () => {
    try {
      setLoading(true);
      setError(null);

      const stateCandidate = location.state?.candidate;
      if (stateCandidate && String(stateCandidate?.id) === String(id)) {
        setCandidate(stateCandidate);
        return;
      }

      let page = 1;
      let totalPage = 1;

      while (page <= totalPage) {
        const companyRes = await api.get("/company/candidates", {
          params: { page, limit: 100 },
        });

        const { rows, totalPage: reportedTotalPage } =
          normalizePagedCandidates(companyRes);
        totalPage = reportedTotalPage;

        const matchedCandidate = rows.find(
          (candidate) => String(candidate?.id) === String(id),
        );

        if (matchedCandidate) {
          setCandidate(matchedCandidate);
          return;
        }

        page += 1;
      }

      setError("Candidate profile is no longer available");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load candidate profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, location.state]);

  if (loading) return <LoadingSkeleton rows={6} columns={2} />;
  if (error)
    return (
      <ErrorState
        title="Failed to load profile"
        message={error}
        onRetry={fetchCandidate}
      />
    );
  if (!candidate) return null;

  const name = resolveName(candidate) ?? `Candidate #${id}`;
  const email = resolveEmail(candidate);
  const exp = Number(candidate?.experience ?? 0);
  const loc = resolveLocation(candidate);
  const bio = resolveBio(candidate);
  const skills = resolveSkills(candidate);
  const notice =
    candidate?.notice_period_days != null
      ? candidate.notice_period_days === 0
        ? "Immediate"
        : `${candidate.notice_period_days} days`
      : "Not specified";

  return (
    <div className="space-y-6">
      {/* back button */}
      <button
        onClick={() => navigate("/company/candidates")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Candidates
      </button>

      {/* header card */}
      <div className="rounded-lg border border-orange-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Initials name={name} id={id} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
            {email && (
              <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                <Mail size={14} />
                {email}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-orange-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Experience
          </p>
          <div className="mt-2 flex items-center gap-2 text-gray-700">
            <Briefcase size={16} className="text-orange-400" />
            <span className="font-medium">
              {exp} {exp === 1 ? "yr" : "yrs"}
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-orange-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Location
          </p>
          <div className="mt-2 flex items-center gap-2 text-gray-700">
            <MapPin size={16} className="text-orange-400" />
            <span className="font-medium">{loc}</span>
          </div>
        </div>

        <div className="rounded-lg border border-orange-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Notice Period
          </p>
          <div className="mt-2 flex items-center gap-2 text-gray-700">
            <Clock size={16} className="text-orange-400" />
            <span className="font-medium">{notice}</span>
          </div>
        </div>
      </div>

      {/* skills */}
      <div className="rounded-lg border border-orange-100 bg-white p-6 shadow-sm">
        <h2 className="mb-3 font-semibold text-gray-900">Skills</h2>
        {skills.length === 0 ? (
          <p className="text-sm text-gray-400">No skills listed</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* bio / about */}
      {bio && (
        <div className="rounded-lg border border-orange-100 bg-white p-6 shadow-sm">
          <h2 className="mb-3 font-semibold text-gray-900">About</h2>
          <p className="text-sm leading-relaxed text-gray-600">{bio}</p>
        </div>
      )}
    </div>
  );
}
