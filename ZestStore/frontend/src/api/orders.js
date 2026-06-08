import api from './axios'
export const getOrders = () => api.get('/orders').then((r) => r.data)
export const placeOrder = (data) => api.post('/orders', data).then((r) => r.data)
export const cancelOrder = (id) => api.put(`/orders/${id}/cancel`).then((r) => r.data)
