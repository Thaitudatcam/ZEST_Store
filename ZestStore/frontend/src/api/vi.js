import api from './axios'

export const getSoDu = () => api.get('/vi/so-du').then(r => r.data)

export const getLichSuVi = (page = 0, size = 20) =>
  api.get('/vi/lich-su', { params: { page, size } }).then(r => r.data)

export const napTien = (soTien, phuongThuc) =>
  api.post('/vi/nap', { soTien, phuongThuc }).then(r => r.data)

export const getPaymentById = (paymentId) =>
  api.get(`/payments/${paymentId}`).then(r => r.data)


