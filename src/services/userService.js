import api from "../api/axios";

export const getUsers = (params) => api.get("/users", { params });
export const getUserById = (id) => api.get(`/users/${id}`);
export const getCurrentUser = () => api.get("/auth/me");
export const createUser = (data) => api.post("/users", data);
export const updateUser = (id, data) => api.patch(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const blockUser = (id, reason) =>
  api.patch(`/users/${id}`, { status: "blocked", block_reason: reason });
export const unblockUser = (id) =>
  api.patch(`/users/${id}`, { status: "active" });
export const changePassword = (data) => api.patch("/user/password", data);
