import api from './axios'
export const getWishlist = () => api.get('/wishlist').then((r) => r.data)
export const addWishlist = (id) => api.post(`/wishlist/${id}`).then((r) => r.data)
export const removeWishlist = (id) => api.delete(`/wishlist/${id}`).then((r) => r.data)
export const checkWishlist = (id) => api.get(`/wishlist/check/${id}`).then((r) => r.data)
