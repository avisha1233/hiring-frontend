import api from '../api/axios';

export const getNotifications = (params) =>
  api.get('/notifications', { params });
export const getNotificationById = (id) =>
  api.get(`/notifications/${id}`);
export const createNotification = (data) =>
  api.post('/notifications', data);
export const updateNotification = (id, data) =>
  api.patch(`/notifications/${id}`, data);
export const deleteNotification = (id) =>
  api.delete(`/notifications/${id}`);
export const deleteAllNotifications = () =>
  api.delete('/notifications');
export const markAsRead = (id) =>
  api.patch(`/notifications/${id}`, { is_read: true });
