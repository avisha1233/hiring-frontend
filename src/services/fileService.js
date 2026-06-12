import api from "../api/axios";

export const getFiles = (params) => api.get("/files", { params });
export const getFileById = (id) => api.get(`/files/${id}`);
export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/files", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
export const deleteFile = (id) => api.delete(`/files/${id}`);
export const downloadFile = (id) => api.get(`/files/${id}`);
