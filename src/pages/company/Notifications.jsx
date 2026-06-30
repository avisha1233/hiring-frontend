import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Briefcase,
  Calendar,
  FileText,
  Star,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { api } from "../../services/api";
import { getNotifications, markAsRead, deleteNotification } from "../../services/notificationService";
import { getAuthUser } from "../../lib/auth";

// ── helpers ───────────────────────────────────────────────────────────────────

function getIcon(type) {
  switch (String(type || "").toLowerCase()) {
    case "interview":    return Calendar;
    case "application":  return FileText;
    case "offer":        return Star;
    case "job":          return Briefcase;
    default:             return Bell;
  }
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)     return "Just now";
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function groupByDate(list) {
  const today     = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const groups = { Today: [], Yesterday: [], Older: [] };
  list.forEach((n) => {
    const d = new Date(n.created_at);
    if (d.toDateString() === today.toDateString())     groups.Today.push(n);
    else if (d.toDateString() === yesterday.toDateString()) groups.Yesterday.push(n);
    else groups.Older.push(n);
  });
  return groups;
}

// ── NotificationRow ───────────────────────────────────────────────────────────

function NotificationRow({ n, onMarkRead, onDismiss }) {
  const Icon    = getIcon(n.type);
  const isUnread = !n.is_read;

  return (
    <div
      onClick={() => isUnread && onMarkRead(n.id)}
      className={`flex items-start gap-3 px-5 py-4 border-b border-orange-50 transition-colors
        ${isUnread ? "bg-orange-50/60 cursor-pointer hover:bg-orange-50" : "bg-white"}
        ${isUnread ? "border-l-[3px] border-l-orange-500" : "border-l-[3px] border-l-transparent"}`}
    >
      {/* icon */}
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100">
        <Icon size={16} className="text-orange-500" />
      </div>

      {/* body */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${isUnread ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
          {n.title || "Notification"}
        </p>
        {n.message && (
          <p className="mt-0.5 text-xs text-gray-500 leading-relaxed line-clamp-2">
            {n.message}
          </p>
        )}
        <p className="mt-1 text-[11px] text-gray-400">{timeAgo(n.created_at)}</p>
      </div>

      {/* right controls */}
      <div className="flex shrink-0 flex-col items-center gap-2 ml-2">
        {isUnread && (
          <span className="h-2 w-2 rounded-full bg-orange-500" />
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(n.id); }}
          className="rounded px-1.5 py-0.5 text-[10px] text-gray-400 border border-orange-100 hover:border-rose-300 hover:text-rose-500 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function CompanyNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const user = getAuthUser();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // GET /notifications?user_id=<id>&limit=100 — the generic notification handler
      const res = await getNotifications({ user_id: user?.id, limit: 100, sort: "created_at", sortDirection: "DESC" });
      const rows = res?.data?.data ?? (Array.isArray(res?.data) ? res?.data : []);
      setNotifications(rows);
    } catch {
      setError("Could not load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  async function markOneRead(id) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    try {
      await markAsRead(id);
    } catch {
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: false } : n));
    }
  }

  async function markAllRead() {
    const unread = notifications.filter((n) => !n.is_read);
    if (!unread.length) return;
    setMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await Promise.all(unread.map((n) => markAsRead(n.id)));
    } catch {
      load();
    } finally {
      setMarkingAll(false);
    }
  }

  async function dismiss(id) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await deleteNotification(id);
    } catch {
      load();
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const grouped     = groupByDate(notifications);

  return (
    <div className="space-y-5">

      {/* ── page header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500">
            {loading ? "Loading…" : unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh */}
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-orange-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-orange-500" : "text-gray-400"} />
            Refresh
          </button>

          {/* Mark all read */}
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingAll}
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 transition-colors"
            >
              <CheckCircle2 size={14} />
              {markingAll ? "Marking…" : "Mark all read"}
            </button>
          )}
        </div>
      </div>

      {/* ── error banner ── */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button
            onClick={load}
            className="ml-4 rounded-lg bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── skeleton loader ── */}
      {loading && (
        <div className="rounded-xl border border-orange-100 bg-white shadow-sm overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3 px-5 py-4 border-b border-orange-50 animate-pulse">
              <div className="h-9 w-9 shrink-0 rounded-xl bg-orange-100" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 w-2/5 rounded bg-orange-100" />
                <div className="h-2.5 w-3/4 rounded bg-orange-50" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── empty state ── */}
      {!loading && !error && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-orange-100 bg-white py-20 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100">
            <Bell size={24} className="text-orange-500" />
          </div>
          <p className="text-sm font-semibold text-gray-700">You're all caught up!</p>
          <p className="text-xs text-gray-400 text-center max-w-xs">
            New notifications about applications, interviews, and offers will appear here.
          </p>
        </div>
      )}

      {/* ── grouped notification list ── */}
      {!loading && notifications.length > 0 && (
        <div className="space-y-4">
          {Object.entries(grouped).map(([label, items]) => {
            if (!items.length) return null;
            return (
              <div key={label}>
                <p className="mb-2 pl-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  {label}
                </p>
                <div className="rounded-xl border border-orange-100 bg-white shadow-sm overflow-hidden">
                  {items.map((n) => (
                    <NotificationRow
                      key={n.id}
                      n={n}
                      onMarkRead={markOneRead}
                      onDismiss={dismiss}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
