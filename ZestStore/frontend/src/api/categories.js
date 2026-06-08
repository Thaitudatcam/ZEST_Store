import api from './axios'
export const getCategories = () => api.get('/categories').then((r) => r.data)
export const getCategoryTree = () => api.get('/categories').then((r) => r.data)
