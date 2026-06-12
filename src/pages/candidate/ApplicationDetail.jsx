import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { candidateApi } from "@/apis/candidate";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getStatusMeta(status) {
  const normalized = String(status || "").toLowerCase();
  const meta = {
    reviewing: {
      label: "Reviewing",
      className: "border border-sky-200 bg-sky-50 text-sky-700",
    },
    shortlisted: {
      label: "Shortlisted",
      className: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    pending: {
      label: "Pending",
      className: "border border-orange-200 bg-orange-50 text-orange-700",
    },
    rejected: {
      label: "Rejected",
      className: "border border-red-200 bg-red-50 text-red-700",
    },
    offered: {
      label: "Offered",
      className: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    interview: {
      label: "Interview",
      className: "border border-violet-200 bg-violet-50 text-violet-700",
    },
    applied: {
      label: "Applied",
      className: "border border-orange-200 bg-orange-50 text-orange-700",
    },
    interviewing: {
      label: "Interviewing",
      className: "border border-sky-200 bg-sky-50 text-sky-700",
    },
    accepted: {
      label: "Accepted",
      className: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    },
  };

  return meta[normalized] || meta.pending;
}

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isActive = true;

    const loadApplication = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await candidateApi.getApplicationById(id);
        if (!isActive) return;

        const data = response?.data ?? response;
        setApplication(data);
      } catch (err) {
        if (!isActive) return;
        setError(err?.message || "Unable to load application details");
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    if (id) {
      loadApplication();
    }

    return () => {
      isActive = false;
    };
  }, [id]);

  const goBack = () => {
    navigate("/candidate/applications");
  };

  return (
    <div className="space-y-6">
      <button
        onClick={goBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-orange-700 hover:text-orange-800"
      >
        <ArrowLeft size={16} />
        Back to Applications
      </button>

      {loading ? (
        <div className="rounded-xl border border-orange-100 bg-white p-6 shadow-sm">
          <div className="space-y-4 animate-pulse">
            <div className="h-8 w-1/3 rounded bg-gray-200" />
            <div className="h-4 w-1/2 rounded bg-gray-200" />
            <div className="h-4 w-2/3 rounded bg-gray-200" />
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-900">
            Unable to load application details
          </h2>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <button
            onClick={goBack}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      ) : application ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-orange-100 bg-white p-6 shadow-sm">
              <h1 className="text-2xl font-bold text-gray-900">
                {application.job?.title ||
                  application.job_title ||
                  application.jobTitle ||
                  "Job Position"}
              </h1>
              <p className="mt-1 text-lg text-gray-600">
                {application.job?.company?.name ||
                  application.company_name ||
                  application.companyName ||
                  "Company"}
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <span
                  className={`inline-flex rounded-lg px-3 py-1 text-sm font-semibold ${getStatusMeta(application.status).className}`}
                >
                  {getStatusMeta(application.status).label}
                </span>
                {(application.job?.is_remote || application.location) && (
                  <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-600">
                    {application.job?.is_remote
                      ? "Remote"
                      : application.job?.location || application.location}
                  </span>
                )}
              </div>
            </div>

            {(application.job?.description ||
              application.job_description ||
              application.description) && (
              <div className="rounded-xl border border-orange-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">
                  Job Description
                </h2>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                  {application.job?.description ||
                    application.job_description ||
                    application.description}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900">
                Current Status
              </h3>
              <p
                className={`mt-3 inline-flex rounded-lg px-3 py-1 text-xs font-semibold ${getStatusMeta(application.status).className}`}
              >
                {getStatusMeta(application.status).label}
              </p>
            </div>

            <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm space-y-3 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">
                  Application ID
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {application.id}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">
                  Applied On
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {formatDate(application.applied_at || application.created_at)}
                </p>
              </div>
              {application.reviewed_at && (
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Reviewed On
                  </p>
                  <p className="mt-1 font-medium text-gray-900">
                    {formatDate(application.reviewed_at)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
