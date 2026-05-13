import api from '../api/axios';

export const getCompanies = (params) => api.get('/companies', { params });
export const getCompanyById = (id) => api.get(`/companies/${id}`);
export const createCompany = (data) => api.post('/companies', data);
export const updateCompany = (id, data) => api.patch(`/companies/${id}`, data);
export const deleteCompany = (id) => api.delete(`/companies/${id}`);
export const blockCompany = (id, reason) =>
  api.patch(`/companies/${id}`, { status: 'blocked', block_reason: reason });
export const unblockCompany = (id) =>
  api.patch(`/companies/${id}`, { status: 'active' });
