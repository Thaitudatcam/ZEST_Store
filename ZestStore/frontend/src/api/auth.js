import api from './axios'
export const loginApi = (data) => api.post('/auth/login', data).then((r) => r.data)
export const registerApi = (data) => api.post('/auth/register', data).then((r) => r.data)
export const refreshTokenApi = (token) => api.post('/auth/refresh', { token }).then((r) => r.data)
export const guiMaXacThuc = () => api.post('/auth/gui-ma-xac-thuc').then((r) => r.data)
export const xacThucEmail = (data) => api.post('/auth/xac-thuc-email', data).then((r) => r.data)
export const quenMatKhau = (data) => api.post('/auth/quen-mat-khau', data).then((r) => r.data)
export const xacThucQuenMatKhau = (data) => api.post('/auth/xac-thuc-quen-mat-khau', data).then((r) => r.data)
export const datLaiMatKhau = (data) => api.post('/auth/dat-lai-mat-khau', data).then((r) => r.data)
