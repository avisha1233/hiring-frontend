import api from '../api/axios';

export const getConversations = (params) =>
  api.get('/conversations', { params });
export const getConversationById = (id) =>
  api.get(`/conversations/${id}`);
export const getConversationMessages = (conversationId, params) =>
  api.get(`/conversations/${conversationId}/messages`, { params });
export const deleteConversation = (id) =>
  api.delete(`/conversations/${id}`);
