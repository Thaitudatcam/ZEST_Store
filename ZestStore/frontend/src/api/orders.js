import api from './axios'
export const getOrders = () => api.get('/orders').then((r) => r.data)
export const getOrderDetail = (id) => api.get(`/orders/${id}`).then((r) => r.data)
export const placeOrder = (data) => api.post('/orders', data).then((r) => r.data)
export const cancelOrder = (id) => api.put(`/orders/${id}/cancel`).then((r) => r.data)
export const confirmReceived = (id) => api.put(`/orders/${id}/confirm-received`).then((r) => r.data)
export const requestReturn = (id, lyDo) => api.post(`/orders/${id}/return-request`, { lyDo }).then((r) => r.data)
