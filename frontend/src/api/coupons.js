import api from './axios'

export const getAvailableCoupons = (tongTien, maSanPhamIds, maNguoiDung) =>
  api.get('/coupons/available', { params: {
    tongTien,
    maSanPhamIds: Array.isArray(maSanPhamIds) ? maSanPhamIds.join(',') || undefined : maSanPhamIds,
    maNguoiDung,
  } }).then((r) => r.data)

export const validateCoupon = (data) => api.post('/coupons/validate', data).then((r) => r.data)

export const getBestOffer = (tongTien, maSanPhamIds, items, maNguoiDung) =>
  api.post('/coupons/best-offer', { items }, { params: {
    tongTien,
    maSanPhamIds: Array.isArray(maSanPhamIds) ? maSanPhamIds.join(',') || undefined : maSanPhamIds,
    maNguoiDung,
    pos: false,
  } }).then((r) => r.data)
