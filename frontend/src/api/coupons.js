import api from './axios'

export const getAvailableCoupons = (tongTien, maSanPhamIds, maNguoiDung) =>
  api.get('/coupons/available', { params: {
    tongTien,
    maSanPhamIds: Array.isArray(maSanPhamIds) ? maSanPhamIds.join(',') || undefined : maSanPhamIds,
    maNguoiDung,
  } }).then((r) => r.data)

export const validateCoupon = (data) => api.post('/coupons/validate', data).then((r) => r.data)

export const getBestOffer = (tongTien, maSanPhamIds, maNguoiDung) =>
  api.post('/coupons/best-offer', null, { params: { tongTien, maSanPhamIds: maSanPhamIds || [], pos: true } }).then((r) => r.data)
