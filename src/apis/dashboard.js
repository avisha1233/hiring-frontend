import { apiRequest } from "@/apis/client";

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toLowerCase();

const isAdminUser = (user) => normalizeRole(user?.role) === "admin";

export async function getDashboardStats({ period = "7d" } = {}) {
  const search = new URLSearchParams({
    period,
  });

  const response = await apiRequest(
    `/admin/dashboard/stats?${search.toString()}`,
  );
  return response?.data || null;
}

export async function getDashboardActivity({
  period = "7d",
  page = 1,
  limit = 5,
} = {}) {
  const search = new URLSearchParams({
    period,
    page: String(page),
    limit: String(limit),
  });

  const response = await apiRequest(
    `/admin/dashboard/activity?${search.toString()}`,
  );
  return response?.data || null;
}

export async function getCurrentUserApi() {
  const response = await apiRequest("/auth/me");
  return response?.data || null;
}

export async function getDashboardBundle({
  period = "7d",
  page = 1,
  limit = 5,
} = {}) {
  const currentUser = await getCurrentUserApi();

  let dashboard = null;

  if (isAdminUser(currentUser)) {
    const [stats, activities] = await Promise.all([
      getDashboardStats({ period }),
      getDashboardActivity({ period, page, limit }),
    ]);

    dashboard = {
      ...stats,
      activities,
    };
  } else {
    const search = new URLSearchParams({ period });
    const response = await apiRequest(`/dashboard/stats?${search.toString()}`);
    dashboard = response?.data || null;
  }

  return {
    dashboard,
    currentUser,
  };
}
