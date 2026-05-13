import api from '../api/axios';

export const getSubmissions = (params) =>
  api.get('/submissions', { params });
export const getSubmissionById = (id) =>
  api.get(`/submissions/${id}`);
export const updateSubmission = (id, data) =>
  api.patch(`/submissions/${id}`, data);
export const deleteSubmission = (id) =>
  api.delete(`/submissions/${id}`);
