import api from '../api/axios';

export const getSettings = () => api.get('/settings');

export const updateSettings = (data) =>
  api.patch('/settings', data);

export const getAdminProfile = () =>
  api.get('/auth/me');

export const updateAdminProfile = (data) =>
  api.patch('/auth/me', data);

export const changePassword = (data) =>
  api.patch('/auth/password', data);

export const clearAllNotifications = () =>
  api.delete('/settings/notifications/all');

export const resetSkillLibrary = () =>
  api.post('/settings/reset-skills');

export const exportAllData = () =>
  api.get('/settings/export', { responseType: 'blob' });

export const wipeTestData = () =>
  api.post('/settings/wipe-test-data');

export const getAuditLog = (params) =>
  api.get('/settings/audit-log', { params });
