/* eslint-disable react-refresh/only-export-components */

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bookmark, MapPin, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { CandidateLayout } from "@/components/candidate/CandidateLayout";
import { jobsApi } from "@/apis/candidate";

export const Route = createFileRoute("/browse-jobs")({
  component: BrowseJobsPage,
});

const CATEGORIES = [
  "Design",
  "Development",
  "Marketing",
  "Sales",
  "Product",
  "Data Science",
];
const JOB_TYPES = [
  "Full Time",
  "Part Time",
  "Remote",
  "Internship",
  "Contract",
];

function BrowseJobsPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [page, setPage] = useState(1);
  const [bookmarked, setBookmarked] = useState({});

  const jobsQuery = useQuery({
    queryKey: [
      "candidate",
      "jobs",
      search,
      selectedCategory,
      selectedTypes.join(","),
      page,
    ],
    queryFn: () =>
      jobsApi.getJobs({
        page,
        limit: 10,
        search,
      }),
    retry: false,
    staleTime: 30_000,
  });

  const bookmarkMutation = useMutation({
    mutationFn: async ({ id, nextValue }) => {
      if (nextValue) {
        await jobsApi.bookmarkJob(id);
      } else {
        await jobsApi.unbookmarkJob(id);
      }
    },
  });

  const jobs = useMemo(() => {
    const rows = jobsQuery.data?.data || [];

    return rows.filter((job) => {
      const categoryMatches =
        !selectedCategory ||
        String(job.title || "")
          .toLowerCase()
          .includes(selectedCategory.toLowerCase());
      const typeLabel = job.is_remote ? "Remote" : "Full Time";
      const typeMatches =
        selectedTypes.length === 0 || selectedTypes.includes(typeLabel);
      return categoryMatches && typeMatches;
    });
  }, [jobsQuery.data?.data, selectedCategory, selectedTypes]);

  return (
    <CandidateLayout
      title="Browse Jobs"
      subtitle="Find the perfect role for you"
      searchValue={search}
      onSearch={setSearch}
    >
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[280px,1fr]">
        <aside className="rounded-xl border border-(--dash-border) bg-(--dash-surface) p-4 shadow-(--dash-shadow)">
          <h3 className="m-0 text-sm font-semibold text-(--dash-text)">
            Categories
          </h3>
          <div className="mt-3 space-y-2">
            {CATEGORIES.map((category) => (
              <label
                key={category}
                className="flex items-center gap-2 text-sm text-(--dash-muted)"
              >
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategory === category}
                  onChange={() => setSelectedCategory(category)}
                />
                {category}
              </label>
            ))}
          </div>

          <h3 className="m-0 mt-5 text-sm font-semibold text-(--dash-text)">
            Job Type
          </h3>
          <div className="mt-3 space-y-2">
            {JOB_TYPES.map((type) => {
              const checked = selectedTypes.includes(type);
              return (
                <label
                  key={type}
                  className="flex items-center gap-2 text-sm text-(--dash-muted)"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      setSelectedTypes((prev) =>
                        checked
                          ? prev.filter((item) => item !== type)
                          : [...prev, type],
                      );
                    }}
                  />
                  {type}
                </label>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedCategory("");
              setSelectedTypes([]);
            }}
            className="mt-5 w-full rounded-lg border border-(--dash-border) px-3 py-2 text-sm text-(--dash-muted) hover:border-(--dash-accent) hover:text-(--dash-accent)"
          >
            Clear Filters
          </button>
        </aside>

        <div className="rounded-xl border border-(--dash-border) bg-(--dash-surface) p-4 shadow-(--dash-shadow)">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="m-0 text-sm font-semibold text-(--dash-text)">
              Available Jobs
            </h3>
            <span className="inline-flex items-center gap-1 rounded-lg bg-(--dash-accent-soft) px-2 py-1 text-xs font-semibold text-(--dash-accent)">
              <SlidersHorizontal size={12} /> Filters
            </span>
          </div>

          {jobsQuery.isPending ? (
            <div className="space-y-2">
              <div className="h-24 animate-pulse rounded-lg bg-(--dash-accent-soft)" />
              <div className="h-24 animate-pulse rounded-lg bg-(--dash-accent-soft)" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-(--dash-border) bg-(--dash-bg-elevated) p-8 text-center text-sm text-(--dash-muted)">
              No jobs found for current filters.
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => {
                const isBookmarked = Boolean(bookmarked[job.id]);
                return (
                  <article
                    key={job.id}
                    className="rounded-xl border border-(--dash-border) bg-(--dash-bg-elevated) p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="m-0 text-sm font-semibold text-(--dash-text)">
                          {job.title || "Untitled role"}
                        </p>
                        <p className="m-0 mt-1 text-xs text-(--dash-muted)">
                          Company #{job.company_id}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const nextValue = !isBookmarked;
                          setBookmarked((prev) => ({
                            ...prev,
                            [job.id]: nextValue,
                          }));
                          bookmarkMutation.mutate({ id: job.id, nextValue });
                        }}
                        className={`rounded-lg border px-2 py-1 ${isBookmarked ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-(--dash-border) text-(--dash-muted)"}`}
                      >
                        <Bookmark size={14} />
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-(--dash-muted)">
                      <span className="inline-flex items-center gap-1 rounded-md border border-(--dash-border) bg-white px-2 py-1">
                        <MapPin size={12} /> {job.location || "Remote"}
                      </span>
                      <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700">
                        New
                      </span>
                      <span className="rounded-md border border-(--dash-border) bg-white px-2 py-1">
                        {job.is_remote ? "Remote" : "Full Time"}
                      </span>
                      <span className="rounded-md border border-(--dash-border) bg-white px-2 py-1">
                        {job.required_experience
                          ? `${job.required_experience}+ yrs`
                          : "0-2 yrs"}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="rounded-lg border border-(--dash-border) px-3 py-1 text-xs text-(--dash-muted)"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => prev + 1)}
              className="rounded-lg border border-(--dash-border) px-3 py-1 text-xs text-(--dash-muted)"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </CandidateLayout>
  );
}
