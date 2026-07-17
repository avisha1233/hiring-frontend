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

  getProposals: async () => {
    // First get the candidate's own numeric ID from their profile
    const profileRes = await api.get("/candidate/profile");
    const profile = profileRes?.data?.data || profileRes?.data || profileRes;
    const candidateId = profile?.id;
    if (!candidateId) return [];
    const { data } = await api.get(`/proposals?candidate_id=${candidateId}`);
    return data?.data || data || [];
  },

  updateProposalStatus: async (id, newStatus) => {
    const { data } = await api.patch(`/proposals/${id}`, { newStatus });
    return data;
  },

  applyToJob: async (jobId) => {
    const normalizedJobId = Number(jobId);

    if (!Number.isInteger(normalizedJobId) || normalizedJobId < 1) {
      throw new Error("Invalid job ID");
    }

    try {
      const { data } = await api.post("/applications", {
        job_id: normalizedJobId,
      });
      return data;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to apply for job";
      const normalizedError = new Error(message);
      normalizedError.status = error?.response?.status;
      normalizedError.payload = error?.response?.data || null;
      throw normalizedError;
    }
  },

  getWork: async () => {
    const { data } = await api.get("/candidate/work");
    return data;
  },
  addWork: async (payload) => {
    const { data } = await api.post("/candidate/work", payload);
    return data;
  },
  updateWork: async (id, payload) => {
    const { data } = await api.patch(`/candidate/work/${id}`, payload);
    return data;
  },
  deleteWork: async (id) => {
    const { data } = await api.delete(`/candidate/work/${id}`);
    return data;
  },

  getEdu: async () => {
    const { data } = await api.get("/candidate/edu");
    return data;
  },
  addEdu: async (payload) => {
    const { data } = await api.post("/candidate/edu", payload);
    return data;
  },
  updateEdu: async (id, payload) => {
    const { data } = await api.patch(`/candidate/edu/${id}`, payload);
    return data;
  },
  deleteEdu: async (id) => {
    const { data } = await api.delete(`/candidate/edu/${id}`);
    return data;
  },

  getCerts: async () => {
    return { data: [] };
  },
  addCert: async (payload) => {
    return { data: { id: Date.now(), ...payload } };
  },
  updateCert: async (id, payload) => {
    return { data: { id, ...payload } };
  },
  deleteCert: async (id) => {
    return { success: true };
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

export const userSettingsApi = {
  getProfile: async () => {
    const { data } = await api.get("/user/profile");
    return data;
  },

  updateProfile: async (payload) => {
    const { data } = await api.patch("/user/profile", payload);
    return data;
  },

  updatePassword: async (payload) => {
    const { data } = await api.patch("/user/password", payload);
    return data;
  },

  updateSettings: async (payload) => {
    const { data } = await api.patch("/user/settings", payload);
    return data;
  },
};
