import api from './axios'
export const loginApi = (data) => api.post('/auth/login', data).then((r) => r.data)
export const registerApi = (data) => api.post('/auth/register', data).then((r) => r.data)
