import api from './axios'

export const getAvailableCoupons = (tongTien) =>
  api.get('/coupons/available', { params: { tongTien } }).then((r) => r.data)
