import api from '../api/axios';

export const getCandidates = (params) => api.get('/candidates', { params });
export const getCandidateById = (id) => api.get(`/candidates/${id}`);
export const updateCandidate = (id, data) => api.patch(`/candidates/${id}`, data);
export const deleteCandidate = (id) => api.delete(`/candidates/${id}`);
export const blockCandidate = (userId, reason) =>
  api.patch(`/users/${userId}`, { status: 'blocked', block_reason: reason });
export const unblockCandidate = (userId) =>
  api.patch(`/users/${userId}`, { status: 'active' });
