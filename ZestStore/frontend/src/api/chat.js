import api from './axios'

export const getMessages = () =>
  api.get('/chat/messages').then(r => r.data)

export const sendMessage = (noiDung) =>
  api.post('/chat/messages', { noiDung }).then(r => r.data)

export const markRead = () =>
  api.put('/chat/read').then(r => r.data)

export const getConversations = () =>
  api.get('/chat/admin/conversations').then(r => r.data)

export const getAdminMessages = (userId) =>
  api.get(`/chat/admin/messages/${userId}`).then(r => r.data)

export const adminReply = (userId, noiDung) =>
  api.post(`/chat/admin/reply/${userId}`, { noiDung }).then(r => r.data)

export const deleteMessage = (maTinNhan) =>
  api.delete(`/chat/messages/${maTinNhan}`).then(r => r.data)
