import api from './axios'
export const getProfile = () => api.get('/users/profile').then((r) => r.data)
export const updateProfile = (data) => api.put('/users/profile', data).then((r) => r.data)
export const changePassword = (data) => api.put('/users/change-password', data).then((r) => r.data)
export const getAddresses = () => api.get('/users/addresses').then((r) => r.data)
export const addAddress = (data) => api.post('/users/addresses', data).then((r) => r.data)
export const deleteAddress = (id) => api.delete(`/users/addresses/${id}`).then((r) => r.data)
export const setDefaultAddress = (id) => api.put(`/users/addresses/${id}/default`).then((r) => r.data)
