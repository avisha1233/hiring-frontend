import api from '../api/axios';

export const getSkills = (params) => api.get('/skills', { params });
export const getSkillById = (id) => api.get(`/skills/${id}`);
export const createSkill = (data) => api.post('/skills', data);
export const updateSkill = (id, data) => api.patch(`/skills/${id}`, data);
export const deleteSkill = (id) => api.delete(`/skills/${id}`);
