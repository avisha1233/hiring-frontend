/* eslint-disable react-refresh/only-export-components */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { candidateApi } from "@/apis/candidate";
import { CandidateLayout } from "@/components/candidate/CandidateLayout";

export const Route = createFileRoute("/applications/$id")({
  component: ApplicationDetailPage,
});

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, "MMM d, yyyy");
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
    hired: {
      label: "Hired",
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

function ApplicationDetailPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();

  const applicationQuery = useQuery({
    queryKey: ["candidate", "application", id],
    queryFn: () => candidateApi.getApplicationById(id),
    retry: false,
    staleTime: 20_000,
  });

  const { data: application, isLoading, isError, error } = applicationQuery;

  const handleGoBack = () => {
    navigate({ to: "/applications" });
  };

  return (
    <CandidateLayout
      title="Application Details"
      subtitle="View your application details"
    >
      <section className="space-y-6">
        {/* Back Button */}
        <button
          onClick={handleGoBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-sky-600 hover:text-sky-700 hover:underline"
        >
          <ArrowLeft size={16} />
          Back to Applications
        </button>

        {/* Loading State */}
        {isLoading && (
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="space-y-4">
              <div className="h-8 w-1/3 animate-pulse rounded-lg bg-gray-200" />
              <div className="h-4 w-1/2 animate-pulse rounded-lg bg-gray-200" />
              <div className="h-4 w-2/3 animate-pulse rounded-lg bg-gray-200" />
            </div>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <h3 className="text-lg font-semibold text-red-900">
              Unable to load application details
            </h3>
            <p className="mt-2 text-sm text-red-700">
              {error?.message || "An error occurred while loading the application."}
            </p>
            <button
              onClick={handleGoBack}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Go Back
            </button>
          </div>
        )}

        {/* Application Details */}
        {application && !isLoading && !isError && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Job Information Card */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900">
                  {application.job_title || application.jobTitle || "Job Position"}
                </h2>
                <p className="mt-1 text-lg text-gray-600">
                  {application.company_name || application.companyName || "Company"}
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <span className={`inline-flex rounded-lg px-3 py-1 text-sm font-semibold ${getStatusMeta(application.status).className}`}>
                    {getStatusMeta(application.status).label}
                  </span>
                  {application.location && (
                    <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-600">
                      📍 {application.location}
                    </span>
                  )}
                </div>
              </div>

              {/* Timeline / Details Card */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">
                  Application Timeline
                </h3>

                <div className="mt-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100">
                      <span className="text-sm font-semibold text-sky-600">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Applied</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(application.applied_at || application.created_at)}
                      </p>
                    </div>
                  </div>

                  {application.reviewed_at && (
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                        <span className="text-sm font-semibold text-emerald-600">2</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Reviewed</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(application.reviewed_at)}
                        </p>
                      </div>
                    </div>
                  )}

                  {application.interviewed_at && (
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100">
                        <span className="text-sm font-semibold text-violet-600">3</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Interviewed</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(application.interviewed_at)}
                        </p>
                      </div>
                    </div>
                  )}

                  {application.offered_at && (
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                        <span className="text-sm font-semibold text-green-600">4</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Offer Extended</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(application.offered_at)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Job Description Card */}
              {(application.job_description || application.description) && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Job Description
                  </h3>
                  <div className="mt-4 prose prose-sm max-w-none text-gray-600">
                    <p className="whitespace-pre-wrap">
                      {application.job_description || application.description}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Status Card */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-900">
                  Current Status
                </h4>
                <p className={`mt-3 inline-flex rounded-lg px-3 py-1 text-xs font-semibold ${getStatusMeta(application.status).className}`}>
                  {getStatusMeta(application.status).label}
                </p>
              </div>

              {/* Key Info Card */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Application ID
                  </p>
                  <p className="mt-1 font-medium text-gray-900">{application.id}</p>
                </div>

                {application.position_type && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Position Type
                    </p>
                    <p className="mt-1 font-medium text-gray-900">
                      {application.position_type}
                    </p>
                  </div>
                )}

                {application.salary_range && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Salary Range
                    </p>
                    <p className="mt-1 font-medium text-gray-900">
                      {application.salary_range}
                    </p>
                  </div>
                )}

                {application.experience_required && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Experience Required
                    </p>
                    <p className="mt-1 font-medium text-gray-900">
                      {application.experience_required}
                    </p>
                  </div>
                )}
              </div>

              {/* Dates Card */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Applied On
                  </p>
                  <p className="mt-1 font-medium text-gray-900">
                    {formatDate(application.applied_at || application.created_at)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Last Updated
                  </p>
                  <p className="mt-1 font-medium text-gray-900">
                    {formatDate(application.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </CandidateLayout>
  );
}
