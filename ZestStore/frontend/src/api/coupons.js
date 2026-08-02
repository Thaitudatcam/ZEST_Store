import api from './axios'

export const getAvailableCoupons = (tongTien, maSanPhamIds, maNguoiDung) =>
  api.get('/coupons/available', { params: { tongTien, maSanPhamIds, maNguoiDung } }).then((r) => r.data)
