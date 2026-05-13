import api from '../api/axios';

export const getJobs = (params) => api.get('/jobs', { params });
export const getJobById = (id) => api.get(`/jobs/${id}`);
export const createJob = (data) => api.post('/jobs', data);
export const updateJob = (id, data) => api.patch(`/jobs/${id}`, data);
export const deleteJob = (id) => api.delete(`/jobs/${id}`);
export const closeJob = (id) => api.patch(`/jobs/${id}`, { status: 'closed' });
export const openJob = (id) => api.patch(`/jobs/${id}`, { status: 'open' });
