import { Bell, BellRing } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { getNotifications } from "@/apis/notifications";
import { getAuthUser } from "@/lib/auth";

function formatTime(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function NotificationMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const authUser = getAuthUser();
  const userId = authUser?.id;

  const notificationsQuery = useQuery({
    queryKey: ["notifications", userId],
    queryFn: () =>
      getNotifications({
        user_id: userId,
        page: 1,
        limit: 10,
        sort: "created_at",
        sortDirection: "DESC",
      }),
    enabled: Boolean(userId),
    staleTime: 20_000,
    retry: false,
  });

  const notifications = useMemo(() => {
    const rows = notificationsQuery.data?.data;
    return Array.isArray(rows) ? rows : [];
  }, [notificationsQuery.data?.data]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );

  useEffect(() => {
    const onDocumentClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const onEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocumentClick);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-(--dash-muted) transition hover:bg-(--dash-accent-soft) hover:text-(--dash-accent)"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Bell size={18} />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-(--dash-accent) px-1 text-xs font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <section className="absolute right-0 z-50 mt-2 w-[340px] rounded-2xl border border-(--dash-border) bg-(--dash-surface) p-3 shadow-(--dash-shadow)">
          <div className="flex items-center justify-between px-1 pb-2">
            <p className="m-0 text-sm font-semibold text-(--dash-text)">
              Notifications
            </p>
            <button
              type="button"
              onClick={() => notificationsQuery.refetch()}
              className="text-xs text-(--dash-muted) transition hover:text-(--dash-accent)"
            >
              Refresh
            </button>
          </div>

          {notificationsQuery.isPending ? (
            <p className="m-0 rounded-xl border border-(--dash-border) bg-(--dash-bg) px-3 py-4 text-sm text-(--dash-muted)">
              Loading notifications...
            </p>
          ) : null}

          {notificationsQuery.isError ? (
            <p className="m-0 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-3 py-4 text-sm text-(--dash-danger)">
              Failed to load notifications.
            </p>
          ) : null}

          {!notificationsQuery.isPending && !notificationsQuery.isError ? (
            notifications.length > 0 ? (
              <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
                {notifications.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-(--dash-border) bg-(--dash-bg) px-3 py-3"
                  >
                    <p className="m-0 flex items-center gap-2 text-sm font-medium text-(--dash-text)">
                      {!item.is_read ? (
                        <BellRing size={14} className="text-(--dash-accent)" />
                      ) : null}
                      {item.title || "Notification"}
                    </p>
                    <p className="m-0 mt-1 text-sm text-(--dash-muted)">
                      {item.message}
                    </p>
                    <p className="m-0 mt-2 text-xs text-(--dash-muted)">
                      {formatTime(item.created_at)}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="m-0 rounded-xl border border-(--dash-border) bg-(--dash-bg) px-3 py-4 text-sm text-(--dash-muted)">
                You have no notifications.
              </p>
            )
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
