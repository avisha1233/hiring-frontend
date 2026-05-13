import api from "../api/axios";

export const getReport = (type, params) => {
  const reportMap = {
    overview: () => api.get("/reports/overview", { params }),
    users: () => api.get("/reports/user-growth", { params }),
    jobs: () => api.get("/reports/jobs", { params }),
    hiring: () => api.get("/reports/hiring", { params }),
    submissions: () => api.get("/reports/applications", { params }),
  };

  const reportFn =
    reportMap[type] || (() => api.get("/reports/overview", { params }));
  return reportFn();
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
