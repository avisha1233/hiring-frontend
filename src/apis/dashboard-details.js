import { apiClient } from "@/apis/api";

const TYPE_TO_PATH = {
  users: "/users",
  companies: "/companies",
  jobs: "/jobs",
  applications: "/applications",
  pendingApprovals: "/users",
  newThisWeek: "/users",
};

export async function getDashboardDetailList(
  type,
  { page = 1, limit = 8 } = {},
) {
  const path = TYPE_TO_PATH[type];

  if (!path) {
    throw new Error(`Unsupported dashboard detail type: ${type}`);
  }

  const baseParams = {
    page: String(page),
    limit: String(limit),
  };

  const typeParams =
    type === "pendingApprovals"
      ? {
          is_verified: "false",
        }
      : {};

  const params = new URLSearchParams({
    ...baseParams,
    ...typeParams,
  });

  return apiClient.get(`${path}?${params.toString()}`);
}
