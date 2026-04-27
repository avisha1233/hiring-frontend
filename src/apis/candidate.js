import { api } from "@/services/api";

export const candidateApi = {
  getStats: async () => {
    const { data } = await api.get("/candidate/stats");
    return data;
  },

  getApplications: async (params = {}) => {
    const { data } = await api.get("/candidate/applications", { params });
    return data;
  },

  getApplicationById: async (id) => {
    const { data } = await api.get(`/candidate/applications/${id}`);
    return data;
  },

  getInterviews: async (params = {}) => {
    const { data } = await api.get("/candidate/interviews", { params });
    return data;
  },

  getTasks: async (params = {}) => {
    const { data } = await api.get("/candidate/tasks", { params });
    return data;
  },

  createTask: async (payload) => {
    const { data } = await api.post("/candidate/tasks", payload);
    return data;
  },

  updateTaskStatus: async (id, status) => {
    const { data } = await api.patch(`/candidate/tasks/${id}`, { status });
    return data;
  },

  getProfile: async () => {
    const { data } = await api.get("/candidate/profile");
    return data;
  },

  updateProfile: async (payload) => {
    const { data } = await api.patch("/candidate/profile", payload);
    return data;
  },

  uploadResume: async (file) => {
    const formData = new FormData();
    formData.append("resume", file);

    const { data } = await api.post("/candidate/profile/resume", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return data;
  },

  getSettings: async () => {
    const { data } = await api.get("/candidate/settings");
    return data;
  },

  updateSettings: async (payload) => {
    const { data } = await api.patch("/candidate/settings", payload);
    return data;
  },

  getNotifications: async (params = {}) => {
    const { data } = await api.get("/candidate/notifications", { params });
    return data;
  },

  markAllNotificationsRead: async () => {
    const { data } = await api.patch("/candidate/notifications/mark-all-read");
    return data;
  },
};

export const jobsApi = {
  getJobs: async (params = {}) => {
    const { data } = await api.get("/jobs", { params });
    return data;
  },

  bookmarkJob: async (jobId) => {
    const { data } = await api.post(`/jobs/${jobId}/bookmark`);
    return data;
  },

  unbookmarkJob: async (jobId) => {
    const { data } = await api.delete(`/jobs/${jobId}/bookmark`);
    return data;
  },
};

export const messageApi = {
  getConversations: async (params = {}) => {
    const { data } = await api.get("/messages/conversations", { params });
    return data;
  },

  getConversationMessages: async (conversationId, params = {}) => {
    const { data } = await api.get(`/messages/${conversationId}`, { params });
    return data;
  },

  sendMessage: async (conversationId, payload) => {
    const { data } = await api.post(
      `/messages/${conversationId}/send`,
      payload,
    );
    return data;
  },
};
