import api from './axios'

export const getProvinces = () => api.get('/shipping/ghn/provinces').then((r) => r.data.data)
export const getDistricts = (provinceId) => api.get('/shipping/ghn/districts', { params: { provinceId } }).then((r) => r.data.data)
export const getWards = (districtId) => api.get('/shipping/ghn/wards', { params: { districtId } }).then((r) => r.data.data)
export const getServices = (toDistrictId) => api.get('/shipping/ghn/services', { params: { toDistrictId } }).then((r) => r.data.data)
export const calculateFee = (data) => api.post('/shipping/ghn/fee', data).then((r) => r.data.data)
