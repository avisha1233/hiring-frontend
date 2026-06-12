import api from '../api/axios';

export const getApplications = (params) =>
  api.get('/applications', { params });
export const getApplicationById = (id) =>
  api.get(`/applications/${id}`);
export const updateApplication = (id, data) =>
  api.patch(`/applications/${id}`, data);
export const updateApplicationStatus = (id, status) =>
  api.patch(`/applications/${id}`, { status });
export const deleteApplication = (id) =>
  api.delete(`/applications/${id}`);
