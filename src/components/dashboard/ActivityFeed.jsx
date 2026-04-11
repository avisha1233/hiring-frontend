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
}) {
  const page = pagination?.page || 1;
  const totalPage = pagination?.totalPage || 1;

  return (
    <section className="rounded-2xl border border-[#162338] bg-[#050b16] p-6 transition-colors duration-300 hover:border-[#28415f]">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="m-0 flex items-center gap-2 text-lg font-semibold text-white sm:text-xl">
            <Sparkles size={20} className="text-[#00d09c]" />
            Recent Activity
          </h3>
          <p className="m-0 mt-1 text-xs text-[#8096b4] sm:text-sm">
            Latest platform events and actions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => onPageChange(page - 1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#1f3048] text-[#89a0bc] transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            disabled={page >= totalPage || isLoading}
            onClick={() => onPageChange(page + 1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#1f3048] text-[#89a0bc] transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {isLoading && (
          <p className="m-0 text-sm text-[#8ea2be]">Loading activity...</p>
        )}

        {!isLoading && items.length === 0 && (
          <p className="m-0 text-sm text-[#8ea2be]">
            No recent activity found for this page.
          </p>
        )}

        {!isLoading &&
          items.map((item) => (
            <article
              key={item.id}
              className="flex items-start gap-4 rounded-xl border border-transparent px-2 py-3 transition duration-200 hover:border-[#1f3048] hover:bg-[#070f1b]"
            >
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-[#0f1c2d] text-[#00d09c]">
                <UserRound size={18} />
              </div>
              <div>
                <p className="m-0 text-base text-white">
                  {item.title || item.message}
                </p>
                <p className="m-0 text-sm text-[#8ca1bd]">
                  {formatRelativeDate(item.created_at)}
                </p>
              </div>
            </article>
          ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[#152136] pt-4 text-sm text-[#8096b4]">
        <span>
          Page {page} of {totalPage}
        </span>
        <span>Total: {pagination?.total || 0} items</span>
      </div>
    </section>
  );
}
