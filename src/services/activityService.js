import api from "../api/axios";

export const getActivities = (params) =>
  api.get("/admin/dashboard/activity", { params });
