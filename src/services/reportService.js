import api from "../api/axios";

// Generic report fetcher based on frontend tab type
export const getReport = (type, params) => {
  const typeMap = {
    overview: "overview",
    users: "user-growth",
    jobs: "jobs",
    hiring: "hiring",
    submissions: "applications",
  };
  const backendType = typeMap[type] || "overview";
  if (backendType === "overview") {
    return api.get("/reports/overview", { params });
  }
  // For other types, use generic reports endpoint with type query param
  return api.get("/reports", { params: { ...params, type: backendType } });
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
