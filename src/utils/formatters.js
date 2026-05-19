export function formatDate(date) {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date) {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(amount, currency = "NPR") {
  if (amount === null || amount === undefined) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function timeAgo(date) {
  if (!date) return "-";
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function getInitials(name) {
  if (!name) return "UN";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return name.substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function truncate(text, length = 50) {
  if (!text) return "-";
  return text.length > length ? text.substring(0, length) + "..." : text;
}

export function getStatusColor(status) {
  if (!status) return "bg-gray-100 text-gray-500";
  const s = status.toLowerCase();

  if (["open", "active", "hired"].includes(s))
    return "bg-orange-100 text-orange-700";
  if (["completed", "approved", "success"].includes(s))
    return "bg-green-100 text-green-700";
  if (["interviewing", "scheduled", "pending"].includes(s))
    return "bg-amber-100 text-amber-700";
  if (["applied"].includes(s)) return "bg-orange-100 text-orange-700";
  if (["offered", "offer"].includes(s)) return "bg-green-100 text-green-700";
  if (["rejected", "blocked", "closed", "cancelled", "failed"].includes(s))
    return "bg-red-100 text-red-600";
  if (["draft", "inactive"].includes(s)) return "bg-gray-100 text-gray-500";

  return "bg-gray-100 text-gray-500";
}

// Re-export from constants for convenience
export { ROLE_COLORS, STATUS_COLORS } from "./constants";
