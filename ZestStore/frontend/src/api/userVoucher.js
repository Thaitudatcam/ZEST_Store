import api from './axios'

export const getUserVouchers = () => api.get('/user-vouchers').then((r) => r.data)
export const claimVoucher = (maCode) => api.post('/user-vouchers/claim', { maCode }).then((r) => r.data)
export const getVoucherCount = () => api.get('/user-vouchers/count').then((r) => r.data)
