import api from './axios'

export const getAvailableCoupons = (tongTien, maSanPhamIds) =>
  api.get('/coupons/available', { params: { tongTien, maSanPhamIds } }).then((r) => r.data)

export const getBestOffer = (tongTien, maSanPhamIds) =>
  api.post('/coupons/best-offer', null, { params: { tongTien, maSanPhamIds } }).then((r) => r.data)

export const reserveCoupon = (maCode) =>
  api.post('/coupons/reserve', null, { params: { maCode } }).then((r) => r.data)

export const releaseCoupon = (maCode) =>
  api.post('/coupons/release', null, { params: { maCode } }).then((r) => r.data)
