import api from './axios'

export const getUserVouchers = () => api.get('/user-vouchers').then((r) => r.data)
export const claimVoucher = (maCode) => api.post('/user-vouchers/claim', { maCode }).then((r) => r.data)
export const getVoucherCount = () => api.get('/user-vouchers/count').then((r) => r.data)
export const getUnclaimedCount = () => api.get('/user-vouchers/unclaimed-count').then((r) => r.data)
export const acceptVoucher = (id) => api.post(`/user-vouchers/${id}/accept`).then((r) => r.data)
export const grantVoucher = (maNguoiDung, maPhieuGiamGia) => api.post('/user-vouchers/grant', { maNguoiDung, maPhieuGiamGia }).then((r) => r.data)
export const revokeVoucher = (id) => api.post(`/user-vouchers/${id}/revoke`).then((r) => r.data)
