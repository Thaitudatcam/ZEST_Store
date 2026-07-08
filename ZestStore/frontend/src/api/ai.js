import api from './axios'

export const getConversations = () =>
  api.get('/ai/conversations').then((r) => r.data)

export const getMessages = (id) =>
  api.get(`/ai/conversations/${id}/messages`).then((r) => r.data)

export const sendMessage = (noiDung, maHoiThoai, hinhAnh) =>
  api.post('/ai/chat', { noiDung, maHoiThoai, hinhAnh }).then((r) => r.data)

export const deleteConversation = (id) =>
  api.delete(`/ai/conversations/${id}`).then((r) => r.data)

export const getAiInsights = () =>
  api.get('/ai/analytics/insights').then((r) => r.data)
