// src/pages/company/CandidateProfile.jsx

import { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Clock,
  Mail,
  GraduationCap,
  FileText,
  ExternalLink,
  CalendarDays,
} from "lucide-react";
import { api, getFileUrl } from "../../services/api";
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

/**
 * Skills can arrive as:
 *   - Array<{ id, name, level, years_of_experience }>  (from new mapCandidateProfile)
 *   - Array<string>                                     (legacy/suggested-candidates)
 *   - Array<{ skill: { name } }> or Array<{ name }>    (raw CandidateSkill objects)
 */
function resolveSkills(c) {
  const raw =
    c?.skills ||
    c?.candidate_skills ||
    c?.CandidateSkills ||
    c?.user?.skills ||
    [];

  return raw
    .map((s) => {
      if (typeof s === "string") return { name: s, level: null, years_of_experience: null };
      if (typeof s === "object" && s !== null) {
        const name = safeStr(
          s?.name || s?.skill?.name || s?.Skill?.name || s?.title || null,
        );
        if (!name) return null;
        return {
          name,
          level: s?.level ?? null,
          years_of_experience: s?.years_of_experience ?? null,
        };
      }
      return null;
    })
    .filter(Boolean);
}

function resolveBio(c) {
  const raw = c?.bio || c?.summary || c?.about || null;
  return raw ? safeStr(raw) : null;
}

function formatDuration(start, end, isCurrent) {
  const s = start?.slice(0, 7) ?? "";
  const e = isCurrent ? "Present" : end?.slice(0, 7) ?? "";
  if (!s && !e) return null;
  if (!s) return e;
  if (!e) return s;
  return `${s} – ${e}`;
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

      // 1. Try the state passed via navigate() — still check for completeness
      //    (state may come from a list card that was fetched before the fix)
      const stateCandidate = location.state?.candidate;
      if (
        stateCandidate &&
        String(stateCandidate?.id) === String(id) &&
        // Prefer a fresh fetch when state has no skills data at all
        (stateCandidate?.skills?.length > 0 || stateCandidate?.bio)
      ) {
        setCandidate(stateCandidate);
        return;
      }

      // 2. Direct GET /company/candidates/:id  (new dedicated endpoint)
      try {
        const res = await api.get(`/company/candidates/${id}`);
        const data = res?.data?.data || res?.data;
        if (data) {
          setCandidate(data);
          return;
        }
      } catch (directErr) {
        // If the endpoint isn't available yet (e.g. older backend), fall through
        console.warn("[CandidateProfile] direct fetch failed, falling back to list search", directErr);
      }

      // 3. Fallback: paginate through the candidates list
      let page = 1;
      let totalPage = 1;

      while (page <= totalPage) {
        const companyRes = await api.get("/company/candidates", {
          params: { page, limit: 100 },
        });

        const payload = companyRes?.data?.data || companyRes?.data || {};
        const rows = payload?.data || payload?.rows || [];
        totalPage = Number(payload?.totalPage || payload?.total_page || 1);

        const matchedCandidate = rows.find(
          (c) => String(c?.id) === String(id),
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
  const qualification = candidate?.qualification ?? null;
  const resumeUrl = candidate?.resume_url ?? null;
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
        <div className="flex items-start gap-4">
          <Initials name={name} id={id} />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
            {email && (
              <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                <Mail size={14} />
                {email}
              </div>
            )}
          </div>
          {resumeUrl && (
            <a
              href={getFileUrl(resumeUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-700 hover:bg-orange-100 transition-colors"
            >
              <FileText size={14} />
              Resume
              <ExternalLink size={12} />
            </a>
          )}
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
                key={skill.name}
                title={
                  skill.level || skill.years_of_experience
                    ? [
                        skill.level && `Level: ${skill.level}`,
                        skill.years_of_experience &&
                          `${skill.years_of_experience} yr(s) experience`,
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : undefined
                }
                className="rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700 cursor-default"
              >
                {skill.name}
                {skill.years_of_experience
                  ? ` · ${skill.years_of_experience}yr`
                  : ""}
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

      {/* work experiences */}
      {candidate?.work_experiences?.length > 0 && (
        <div className="rounded-lg border border-orange-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase size={18} className="text-orange-400" />
            <h2 className="font-semibold text-gray-900">Work Experience</h2>
          </div>
          <div className="space-y-6">
            {candidate.work_experiences.map((work) => (
              <div key={work.id} className="relative pl-4 border-l-2 border-orange-200">
                <div className="absolute w-3 h-3 bg-orange-400 rounded-full -left-[7px] top-1.5 ring-4 ring-white" />
                <h3 className="font-semibold text-gray-800 text-base">{work.title}</h3>
                <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2">
                  {work.company && (
                    <div>
                      <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Company</span>
                      <span className="text-sm text-gray-700">{work.company}</span>
                    </div>
                  )}
                  {work.employment_type && (
                    <div>
                      <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Type</span>
                      <span className="text-sm text-gray-700">{work.employment_type}</span>
                    </div>
                  )}
                  {work.location && (
                    <div>
                      <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Location</span>
                      <span className="flex items-center gap-1 text-sm text-gray-700"><MapPin size={12} className="text-gray-400" /> {work.location}</span>
                    </div>
                  )}
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Duration</span>
                    <span className="flex items-center gap-1 text-sm text-gray-700"><CalendarDays size={12} className="text-gray-400" /> {formatDuration(work.start_date, work.end_date, work.is_current)}</span>
                  </div>
                </div>
                {work.description && (
                  <div className="mt-3">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Description</span>
                    <p className="text-sm leading-relaxed text-gray-600">{work.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* educations */}
      {candidate?.educations?.length > 0 && (
        <div className="rounded-lg border border-orange-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap size={18} className="text-orange-400" />
            <h2 className="font-semibold text-gray-900">Education</h2>
          </div>
          
          <div className="space-y-6">
            {candidate.educations.map((edu) => (
              <div key={edu.id} className="relative pl-4 border-l-2 border-orange-200">
                <div className="absolute w-3 h-3 bg-orange-400 rounded-full -left-[7px] top-1.5 ring-4 ring-white" />
                <h3 className="font-semibold text-gray-800 text-base">{edu.degree}</h3>
                <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2">
                  {edu.institution && (
                    <div>
                      <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Institution</span>
                      <span className="text-sm text-gray-700">{edu.institution}</span>
                    </div>
                  )}
                  {edu.field && (
                    <div>
                      <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Field of Study</span>
                      <span className="text-sm text-gray-700">{edu.field}</span>
                    </div>
                  )}
                  {edu.grade && (
                    <div>
                      <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Grade / GPA</span>
                      <span className="text-sm text-gray-700">{edu.grade}</span>
                    </div>
                  )}
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Duration</span>
                    <span className="flex items-center gap-1 text-sm text-gray-700"><CalendarDays size={12} className="text-gray-400" /> {formatDuration(edu.start_date, edu.end_date, edu.is_current)}</span>
                  </div>
                </div>
                {edu.description && (
                  <div className="mt-3">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Activities / Description</span>
                    <p className="text-sm leading-relaxed text-gray-600">{edu.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
