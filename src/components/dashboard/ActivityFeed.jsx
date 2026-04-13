import { ChevronLeft, ChevronRight, Sparkles, UserRound } from "lucide-react";

function formatRelativeDate(input) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

export function ActivityFeed({
  items = [],
  pagination,
  onPageChange,
  isLoading,
  onActivityClick,
}) {
  const page = pagination?.page || 1;
  const totalPage = pagination?.totalPage || 1;

  return (
    <section className="rounded-2xl border border-(--dash-border) bg-(--dash-surface) p-6 shadow-(--dash-shadow) transition-colors duration-300 hover:border-(--dash-accent)">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="m-0 flex items-center gap-2 text-lg font-semibold text-(--dash-text) sm:text-xl">
            <Sparkles size={20} className="text-(--dash-accent)" />
            Recent Activity
          </h3>
          <p className="m-0 mt-1 text-xs text-(--dash-muted) sm:text-sm">
            Latest platform events and actions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => onPageChange(page - 1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-(--dash-border) text-(--dash-muted) transition hover:bg-(--dash-accent-soft) hover:text-(--dash-accent) disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            disabled={page >= totalPage || isLoading}
            onClick={() => onPageChange(page + 1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-(--dash-border) text-(--dash-muted) transition hover:bg-(--dash-accent-soft) hover:text-(--dash-accent) disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {isLoading && (
          <p className="m-0 text-sm text-(--dash-muted)">
            Loading activity...
          </p>
        )}

        {!isLoading && items.length === 0 && (
          <p className="m-0 text-sm text-(--dash-muted)">
            No recent activity found for this page.
          </p>
        )}

        {!isLoading &&
          items.map((item) => (
            <article
              key={item.id}
              className="flex items-start gap-4 rounded-xl border border-transparent px-2 py-3 transition duration-200 hover:border-(--dash-border) hover:bg-(--dash-accent-soft)"
              onClick={() => onActivityClick?.(item)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onActivityClick?.(item);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`Open activity ${item.title || item.id}`}
            >
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-(--dash-accent-soft) text-(--dash-accent)">
                <UserRound size={18} />
              </div>
              <div>
                <p className="m-0 text-base text-(--dash-text)">
                  {item.title || item.message}
                </p>
                <p className="m-0 text-sm text-(--dash-muted)">
                  {formatRelativeDate(item.created_at)}
                </p>
              </div>
            </article>
          ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-(--dash-border) pt-4 text-sm text-(--dash-muted)">
        <span>
          Page {page} of {totalPage}
        </span>
        <span>Total: {pagination?.total || 0} items</span>
      </div>
    </section>
  );
}

