import { apiClient } from "@/apis/api";

function toQueryString(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  return query.toString();
}

export function getNotifications(params = {}) {
  const query = toQueryString(params);
  const suffix = query ? `?${query}` : "";
  return apiClient.get(`/notifications${suffix}`);
}

export function markNotificationAsRead(notificationId) {
  return apiClient.patch(`/notifications/${notificationId}`, { is_read: true });
}
