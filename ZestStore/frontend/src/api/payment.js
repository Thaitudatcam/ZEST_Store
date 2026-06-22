import api from './axios'

export const createVnPayPayment = (orderId) =>
  api.post(`/payments/vnpay/create/${orderId}`).then((r) => r.data)

export const createMomoPayment = (orderId) =>
  api.post(`/payments/momo/create/${orderId}`).then((r) => r.data)

export const createZaloPayPayment = (orderId) =>
  api.post(`/payments/zalopay/create/${orderId}`).then((r) => r.data)

export const createVietQrPayment = (orderId) =>
  api.post(`/payments/vietqr/create/${orderId}`).then((r) => r.data)

export const confirmVietQrPayment = (paymentId) =>
  api.post(`/payments/vietqr/confirm/${paymentId}`).then((r) => r.data)

export const retryPayment = (paymentId) =>
  api.post(`/payments/${paymentId}/retry`).then((r) => r.data)
