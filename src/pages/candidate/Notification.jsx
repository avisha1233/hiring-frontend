import { useState, useEffect } from "react";
import {
  Bell,
  Calendar,
  FileText,
  CheckSquare,
  Upload,
  Star,
} from "lucide-react";
import { api } from "../../services/api";

// figure out which icon to show based on notification type
function getIcon(type) {
  switch (type) {
    case "interview":
      return Calendar;
    case "application":
      return FileText;
    case "task":
      return CheckSquare;
    case "submission":
      return Upload;
    case "offer":
      return Star;
    default:
      return Bell;
  }
}

// how long ago was this notification
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// group notifications into today / yesterday / older
function groupByDate(notifications) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const groups = { Today: [], Yesterday: [], Older: [] };

  notifications.forEach((n) => {
    const d = new Date(n.created_at);
    if (d.toDateString() === today.toDateString()) {
      groups.Today.push(n);
    } else if (d.toDateString() === yesterday.toDateString()) {
      groups.Yesterday.push(n);
    } else {
      groups.Older.push(n);
    }
  });

  return groups;
}

function NotificationItem({ notification, onMarkRead, onDelete }) {
  const Icon = getIcon(notification.type);
  const isUnread = !notification.is_read;

  return (
    <div
      onClick={() => !notification.is_read && onMarkRead(notification.id)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "12px 16px",
        borderBottom: "0.5px solid #FFE8D6",
        background: isUnread ? "#FFFAF7" : "#fff",
        cursor: isUnread ? "pointer" : "default",
        borderLeft: isUnread ? "3px solid #F97316" : "3px solid transparent",
        transition: "background 0.1s",
      }}
    >
      {/* icon */}
      <div
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "8px",
          background: "#FFE8D6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: "1px",
        }}
      >
        <Icon size={16} color="#F97316" />
      </div>

      {/* content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: isUnread ? 500 : 400,
            color: "#111827",
            marginBottom: "3px",
          }}
        >
          {notification.title}
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "#6b7280",
            lineHeight: 1.5,
          }}
        >
          {notification.message}
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "#9ca3af",
            marginTop: "5px",
          }}
        >
          {timeAgo(notification.created_at)}
        </div>
      </div>

      {/* right side — unread dot + delete */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          flexShrink: 0,
        }}
      >
        {isUnread && (
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#F97316",
            }}
          />
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          style={{
            fontSize: "10px",
            padding: "2px 6px",
            borderRadius: "4px",
            border: "0.5px solid #FFD0B0",
            background: "transparent",
            color: "#9ca3af",
            cursor: "pointer",
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const candidateId = user?.id;

  async function loadNotifications() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/notifications?user_id=${candidateId}`);
      setNotifications(res.data || []);
    } catch (err) {
      setError("Could not load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (candidateId) loadNotifications();
  }, [candidateId]);

  async function markOneRead(id) {
    // update UI right away so it feels fast
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    try {
      await api.patch(`/notifications/${id}`, { is_read: true });
    } catch {
      // revert if it failed
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: false } : n)),
      );
    }
  }

  async function markAllRead() {
    const unread = notifications.filter((n) => !n.is_read);
    if (unread.length === 0) return;

    setMarkingAll(true);

    // update UI first
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    try {
      await Promise.all(
        unread.map((n) =>
          api.patch(`/notifications/${n.id}`, { is_read: true }),
        ),
      );
    } catch {
      // if something failed just reload from server
      loadNotifications();
    } finally {
      setMarkingAll(false);
    }
  }

  async function deleteOne(id) {
    // remove from UI immediately
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await api.delete(`/notifications/${id}`);
    } catch {
      // put it back if delete failed
      loadNotifications();
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const grouped = groupByDate(notifications);

  return (
    <div>
      {/* header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "14px",
        }}
      >
        <div>
          <div style={{ fontSize: "15px", fontWeight: 500 }}>Notifications</div>
          {!loading && unreadCount > 0 && (
            <div
              style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}
            >
              {unreadCount} unread
            </div>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={markingAll}
            style={{
              fontSize: "12px",
              padding: "5px 14px",
              borderRadius: "8px",
              border: "0.5px solid #FFD0B0",
              background: "#FFE8D6",
              color: "#C2570A",
              cursor: markingAll ? "not-allowed" : "pointer",
              opacity: markingAll ? 0.6 : 1,
            }}
          >
            {markingAll ? "Marking…" : "Mark all as read"}
          </button>
        )}
      </div>

      {/* error state */}
      {error && (
        <div
          style={{
            padding: "10px 14px",
            background: "#FCEBEB",
            border: "0.5px solid #F09595",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#A32D2D",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          {error}
          <button
            onClick={loadNotifications}
            style={{
              fontSize: "11px",
              padding: "3px 10px",
              borderRadius: "6px",
              border: "none",
              background: "#A32D2D",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* loading skeletons */}
      {loading && (
        <div
          style={{
            background: "#fff",
            border: "0.5px solid #FFD0B0",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "12px",
                padding: "14px 16px",
                borderBottom: "0.5px solid #FFE8D6",
              }}
            >
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "8px",
                  background: "#FFE8D6",
                  opacity: 0.5,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    height: "13px",
                    width: "40%",
                    background: "#FFE8D6",
                    borderRadius: "4px",
                    marginBottom: "8px",
                    opacity: 0.5,
                  }}
                />
                <div
                  style={{
                    height: "11px",
                    width: "75%",
                    background: "#FFE8D6",
                    borderRadius: "4px",
                    opacity: 0.4,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* empty state */}
      {!loading && notifications.length === 0 && !error && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 20px",
            background: "#fff",
            border: "0.5px solid #FFD0B0",
            borderRadius: "12px",
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "12px",
              background: "#FFE8D6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "14px",
            }}
          >
            <Bell size={22} color="#F97316" />
          </div>
          <div
            style={{ fontSize: "13px", fontWeight: 500, marginBottom: "5px" }}
          >
            You are all caught up
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#9ca3af",
              textAlign: "center",
              maxWidth: "220px",
            }}
          >
            New notifications will show up here when there is activity on your
            account
          </div>
        </div>
      )}

      {/* grouped notification list */}
      {!loading && notifications.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {Object.entries(grouped).map(([groupLabel, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={groupLabel}>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 500,
                    color: "#9ca3af",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "6px",
                    paddingLeft: "4px",
                  }}
                >
                  {groupLabel}
                </div>
                <div
                  style={{
                    background: "#fff",
                    border: "0.5px solid #FFD0B0",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  {items.map((n) => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      onMarkRead={markOneRead}
                      onDelete={deleteOne}
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
