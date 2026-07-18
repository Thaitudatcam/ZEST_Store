import api from './axios'

export const getSoDu = () => api.get('/vi/so-du').then(r => r.data)

export const getLichSuVi = (page = 0, size = 20) =>
  api.get('/vi/lich-su', { params: { page, size } }).then(r => r.data)
