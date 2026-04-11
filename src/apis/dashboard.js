import { apiRequest } from "@/apis/client";

export async function getDashboardStats({ page = 1, limit = 5 } = {}) {
  const search = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const response = await apiRequest(`/dashboard/stats?${search.toString()}`);
  return response?.data || null;
}

export async function getCurrentUserApi() {
  const response = await apiRequest("/auth/me");
  return response?.data || null;
}

export async function getDashboardBundle({ page = 1, limit = 5 } = {}) {
  const [dashboard, currentUser] = await Promise.all([
    getDashboardStats({ page, limit }),
    getCurrentUserApi(),
  ]);

  return {
    dashboard,
    currentUser,
  };
}
