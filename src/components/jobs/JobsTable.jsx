import { Loader2, MapPin, Users } from "lucide-react";
import { DropdownMenu } from "@/components/companies/DropdownMenu";

function normalizeStatus(status) {
  const value = String(status || "").toLowerCase();
  if (value === "open") return "open";
  if (value === "closed") return "closed";
  if (value === "draft") return "draft";
  return "draft";
}

function getStatusClass(status) {
  if (status === "open") {
    return "border border-[#bbf7d0] bg-[#dcfce7] text-[#15803d]";
  }

  if (status === "closed") {
    return "border border-[#fecaca] bg-[#fee2e2] text-[#b91c1c]";
  }

  return "border border-[#e5e7eb] bg-[#f3f4f6] text-[#4b5563]";
}

function toLabel(value = "") {
  return (
    String(value)
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase()) || "N/A"
  );
}

function formatSalary(range, currency = "USD") {
  if (!Array.isArray(range) || range.length < 2) {
    return "Not specified";
  }

  const [min, max] = range;
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

  return `${formatter.format(Number(min || 0))} - ${formatter.format(
    Number(max || 0),
  )}`;
}

export function JobsTable({
  jobs,
  companyMap,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onEdit,
  onDelete,
}) {
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-(--dash-border) bg-(--dash-surface)">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={30} className="animate-spin text-(--dash-accent)" />
          <p className="m-0 text-(--dash-muted)">Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <section className="rounded-2xl border border-[#fed7aa] bg-[#fff7ed] p-6">
        <h3 className="m-0 text-lg font-semibold text-[#9a3412]">
          Failed to load jobs
        </h3>
        <p className="m-0 mt-2 text-sm text-[#c2410c]">
          {errorMessage || "Please try again."}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-xl bg-(--dash-accent) px-4 py-2 text-sm font-semibold text-white transition hover:bg-(--dash-accent-strong)"
        >
          Retry
        </button>
      </section>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-(--dash-border) bg-(--dash-surface) shadow-(--dash-shadow)">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px]">
          <thead className="border-b border-(--dash-border) bg-[#fff7ed]">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-(--dash-muted)">
                Title
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-(--dash-muted)">
                Company
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-(--dash-muted)">
                Location
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-(--dash-muted)">
                Type
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-(--dash-muted)">
                Salary
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-(--dash-muted)">
                Applications
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-(--dash-muted)">
                Status
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-(--dash-muted)">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {jobs.length > 0 ? (
              jobs.map((job) => {
                const status = normalizeStatus(job.status);
                return (
                  <tr
                    key={job.id}
                    className="border-b border-(--dash-border) last:border-b-0"
                  >
                    <td className="px-6 py-4 align-top">
                      <p className="m-0 text-lg font-semibold text-(--dash-text)">
                        {job.title || "Untitled role"}
                      </p>
                      <p className="m-0 mt-1 text-sm text-(--dash-muted)">
                        #{job.id}
                      </p>
                    </td>

                    <td className="px-6 py-4 align-top text-base text-(--dash-text)">
                      {companyMap.get(job.company_id) ||
                        `Company #${job.company_id}`}
                    </td>

                    <td className="px-6 py-4 align-top text-(--dash-muted)">
                      <span className="inline-flex items-center gap-1.5 text-base">
                        <MapPin size={16} />
                        {job.location || "Remote"}
                      </span>
                    </td>

                    <td className="px-6 py-4 align-top">
                      <span className="rounded-lg border border-(--dash-border) bg-[#fffaf5] px-3 py-1 text-sm font-semibold text-[#9a3412]">
                        {toLabel(job.experience_level)}
                      </span>
                    </td>

                    <td className="px-6 py-4 align-top text-base text-(--dash-text)">
                      {formatSalary(job.salary_range, job.currency)}
                    </td>

                    <td className="px-6 py-4 align-top text-(--dash-muted)">
                      <span className="inline-flex items-center gap-1.5 text-base">
                        <Users size={16} />
                        {Number(job.applications_count || 0)}
                      </span>
                    </td>

                    <td className="px-6 py-4 align-top">
                      <span
                        className={`inline-flex rounded-xl px-3 py-1 text-sm font-semibold ${getStatusClass(
                          status,
                        )}`}
                      >
                        {toLabel(status)}
                      </span>
                    </td>

                    <td className="px-6 py-4 align-top text-right">
                      <DropdownMenu
                        onEdit={() => onEdit(job)}
                        onDelete={() => onDelete(job)}
                      />
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-16 text-center text-sm text-(--dash-muted)"
                >
                  No jobs found. Try changing your search or status filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
