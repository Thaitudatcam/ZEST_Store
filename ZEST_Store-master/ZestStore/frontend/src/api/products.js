import api from './axios'
export const getProducts = (params) => api.get('/products', { params }).then((r) => r.data)
export const getProductBySlug = (slug) => api.get(`/products/${slug}`).then((r) => r.data)
export const getProductImages = (id) => api.get(`/products/${id}/images`).then((r) => r.data)
export const getProductVariants = (id) => api.get(`/products/${id}/variants`).then((r) => r.data)
