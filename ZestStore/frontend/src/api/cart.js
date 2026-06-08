import api from './axios'
export const getCart = () => api.get('/cart').then((r) => r.data)
export const addToCart = (data) => api.post('/cart', data).then((r) => r.data)
export const updateCartItem = (id, data) => api.put(`/cart/items/${id}`, data).then((r) => r.data)
export const removeCartItem = (id) => api.delete(`/cart/items/${id}`).then((r) => r.data)
export const clearCart = () => api.delete('/cart').then((r) => r.data)
