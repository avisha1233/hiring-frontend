import { Link, useLocation } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Briefcase,
  CheckSquare,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Search,
  Settings,
  User,
  X,
  ClipboardList,
  Bookmark,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { clearAuthSession, getAuthUser } from "@/lib/auth";
import { candidateApi } from "@/apis/candidate";

const NAV_LINKS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/browse-jobs", label: "Browse Jobs", icon: Briefcase },
  { to: "/applications", label: "My Applications", icon: ClipboardList },
  { to: "/messages", label: "Messages", icon: MessageCircle },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
];

function initialsFromUser(user) {
  const source = String(user?.full_name || user?.email || "Candidate").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function NotificationPanel({ open, onClose }) {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ["candidate", "notifications", "panel"],
    queryFn: () => candidateApi.getNotifications({ page: 1, limit: 12 }),
    staleTime: 20_000,
    retry: false,
    enabled: open,
  });

  const markAllMutation = useMutation({
    mutationFn: candidateApi.markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["candidate", "notifications"],
      });
    },
  });

  const items = notificationsQuery.data?.data || [];

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-(--dash-overlay) transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-(--dash-border) bg-(--dash-surface) shadow-(--dash-shadow) transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-(--dash-border) px-5 py-4">
          <h3 className="m-0 text-lg font-semibold text-(--dash-text)">
            Notifications
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-(--dash-border) p-2 text-(--dash-muted)"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center justify-between px-5 py-3">
          <p className="m-0 text-sm text-(--dash-muted)">
            Stay updated with activity
          </p>
          <button
            type="button"
            onClick={() => markAllMutation.mutate()}
            className="rounded-lg bg-(--dash-accent-soft) px-3 py-1.5 text-xs font-semibold text-(--dash-accent)"
          >
            Mark all as read
          </button>
        </div>

        <div className="space-y-2 overflow-y-auto px-4 pb-4">
          {notificationsQuery.isPending ? (
            <div className="rounded-xl border border-(--dash-border) bg-(--dash-bg-elevated) p-4 text-sm text-(--dash-muted)">
              Loading notifications...
            </div>
          ) : null}

          {!notificationsQuery.isPending && items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-(--dash-border) bg-(--dash-bg-elevated) p-6 text-center text-sm text-(--dash-muted)">
              No notifications yet.
            </div>
          ) : null}

          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-(--dash-border) bg-(--dash-bg-elevated) p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="m-0 text-sm font-semibold text-(--dash-text)">
                  {item.title || "Notification"}
                </p>
                {!item.is_read ? (
                  <span className="mt-1 h-2 w-2 rounded-full bg-(--dash-accent)" />
                ) : null}
              </div>
              <p className="m-0 mt-1 text-sm text-(--dash-muted)">
                {item.message || ""}
              </p>
              <p className="m-0 mt-2 text-xs text-(--dash-muted)">
                {item.created_at
                  ? formatDistanceToNow(new Date(item.created_at), {
                      addSuffix: true,
                    })
                  : "just now"}
              </p>
            </article>
          ))}
        </div>
      </aside>
    </>
  );
}

export function CandidateLayout({
  title,
  subtitle,
  children,
  onSearch,
  searchValue = "",
}) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const user = getAuthUser();

  const notificationCountQuery = useQuery({
    queryKey: ["candidate", "notifications", "count"],
    queryFn: () => candidateApi.getNotifications({ page: 1, limit: 20 }),
    staleTime: 20_000,
    retry: false,
  });

  const unreadCount = useMemo(() => {
    const items = notificationCountQuery.data?.data || [];
    return items.filter((item) => !item.is_read).length;
  }, [notificationCountQuery.data?.data]);

  const linkClass = (to) => {
    const active =
      to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
    return active
      ? "relative bg-(--dash-accent-soft) text-(--dash-accent)"
      : "text-(--dash-muted) hover:bg-(--dash-accent-soft) hover:text-(--dash-accent)";
  };

  return (
    <div className="min-h-screen bg-(--dash-bg) text-(--dash-text)">
      <NotificationPanel
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />

      <div
        className={`fixed inset-0 z-30 bg-(--dash-overlay) transition-opacity lg:hidden ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-(--dash-border) bg-(--dash-bg-elevated) shadow-(--dash-shadow) transition-all duration-300 lg:translate-x-0 ${collapsed ? "w-20" : "w-[220px]"} ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-(--dash-border) px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-(--dash-accent) text-sm font-semibold text-white">
            HR
          </div>
          {!collapsed ? (
            <div>
              <p className="m-0 text-sm font-semibold text-(--dash-text)">
                HR_Recruit
              </p>
              <p className="m-0 text-xs text-(--dash-muted)">Candidate</p>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="absolute -right-3 top-20 hidden h-7 w-7 items-center justify-center rounded-full border border-(--dash-border) bg-(--dash-bg-elevated) text-(--dash-muted) lg:flex"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <nav className="mt-4 flex-1 space-y-1 px-2">
          {NAV_LINKS.map((item) => {
            const Icon = item.icon;
            const active =
              item.to === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 no-underline transition ${linkClass(item.to)}`}
              >
                {active ? (
                  <span className="absolute left-0 h-5 w-1 rounded-r bg-green-500" />
                ) : null}
                <Icon size={17} />
                {!collapsed ? (
                  <span className="text-sm">{item.label}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-(--dash-border) p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-(--dash-accent-soft) text-sm font-semibold text-(--dash-accent)">
              {initialsFromUser(user)}
            </div>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="m-0 truncate text-sm font-semibold text-(--dash-text)">
                  {user?.full_name || "Candidate"}
                </p>
                <p className="m-0 truncate text-xs text-(--dash-muted)">
                  {user?.email || "candidate@example.com"}
                </p>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => {
              clearAuthSession();
              window.location.assign("/login");
            }}
            className="mt-3 w-full rounded-lg border border-(--dash-border) px-3 py-2 text-xs text-(--dash-muted) hover:border-(--dash-accent) hover:text-(--dash-accent)"
          >
            Logout
          </button>
        </div>
      </aside>

      <div
        className={`pb-18 transition-all duration-300 lg:pb-0 ${collapsed ? "lg:ml-20" : "lg:ml-[220px]"}`}
      >
        <header className="flex h-16 items-center justify-between border-b border-(--dash-border) bg-(--dash-bg-elevated) px-4 sm:px-6">
          <div>
            <h1 className="m-0 text-xl font-semibold text-(--dash-text)">
              {title}
            </h1>
            <p className="m-0 text-xs text-(--dash-muted)">{subtitle}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-(--dash-border) text-(--dash-muted) lg:hidden"
            >
              <Menu size={16} />
            </button>

            <div className="hidden items-center gap-2 rounded-lg border border-(--dash-border) bg-(--dash-surface) px-3 py-2 md:flex">
              <Search size={14} className="text-(--dash-muted)" />
              <input
                value={searchValue}
                onChange={(event) => onSearch?.(event.target.value)}
                placeholder="Search jobs..."
                className="w-56 bg-transparent text-sm text-(--dash-text) outline-none placeholder:text-(--dash-muted)"
              />
            </div>

            <button
              type="button"
              onClick={() => setNotificationsOpen(true)}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-(--dash-border) text-(--dash-muted)"
            >
              <Bell size={16} />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-(--dash-accent) px-1 text-[10px] font-semibold text-white">
                  {unreadCount}
                </span>
              ) : null}
            </button>
          </div>
        </header>

        <main className="animate-fade-in p-4 sm:p-6">{children}</main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-(--dash-border) bg-(--dash-bg-elevated) px-2 py-2 lg:hidden">
        {NAV_LINKS.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active =
            item.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 rounded-md px-2 py-1 no-underline text-[10px] ${active ? "text-(--dash-accent)" : "text-(--dash-muted)"}`}
            >
              <Icon size={16} />
              <span>{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
