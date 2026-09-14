import api from './axios'
export const getCategoryTree = () => api.get('/categories').then((r) => r.data)
export const getActiveCategories = () => api.get('/categories/active').then((r) => r.data)
