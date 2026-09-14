import api from './axios'

export const getProvinces = () => api.get('/shipping/ghn/provinces').then((r) => r.data.data)
export const getDistricts = (provinceId) => api.get('/shipping/ghn/districts', { params: { provinceId } }).then((r) => r.data.data)
export const getWards = (districtId) => api.get('/shipping/ghn/wards', { params: { districtId } }).then((r) => r.data.data)
export const getServices = (toDistrictId) => api.get('/shipping/ghn/services', { params: { toDistrictId } }).then((r) => r.data.data)
export const calculateShippingFee = (data) => api.post('/shipping/ghn/fee', data).then((r) => {
  // GHN trả về { data: { total } }, còn một số endpoint nội bộ trả về { fee }.
  // Chuẩn hóa để checkout luôn nhận cùng một cấu trúc.
  const payload = r.data || {}
  const fee = payload.fee ?? payload.data?.total
  if (fee === undefined || fee === null || Number.isNaN(Number(fee))) {
    throw new Error('GHN không trả về mức phí hợp lệ')
  }
  return { fee: Number(fee), source: payload.source || 'ghn' }
})
