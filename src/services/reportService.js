import api from "../api/axios";

// Generic report fetcher based on frontend tab type
export const getReport = (type, params) => {
  if (type === "users") {
    return api.get("/reports/user-growth", { params });
  }
  if (type === "jobs") {
    return api.get("/reports/jobs", { params });
  }
  if (type === "hiring") {
    return api.get("/reports/hiring", { params });
  }
  // Default to overview
  return api.get("/reports/overview", { params });
};

export const getOverviewReport = () => api.get("/reports/overview");

export const getUserGrowthReport = (params) =>
  api.get("/reports/user-growth", { params });

export const getJobReport = (params) => api.get("/reports/jobs", { params });

export const getApplicationReport = (params) =>
  api.get("/reports/applications", { params });

export const getHiringReport = (params) =>
  api.get("/reports/hiring", { params });

export const getRevenueReport = (params) =>
  api.get("/reports/revenue", { params });

export const exportReport = (type, params) =>
  api.get(`/reports/export/${type}`, {
    params,
    responseType: "blob",
  });
