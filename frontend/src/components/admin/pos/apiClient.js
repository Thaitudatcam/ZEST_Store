import api from '../../../api/axios'

export const posApi = {
  getVariants: (params = {}) =>
    api.get('/products/admin/variant-list', { params }).then(r => r.data),

  getCategories: () =>
    api.get('/categories/active').then(r => r.data).catch(() => []),

  getColors: () => api.get('/colors').then(r => r.data).catch(() => []),
  getSizes: () => api.get('/sizes').then(r => r.data).catch(() => []),

  lookupSku: (sku) =>
    api.get('/admin/pos/scan', { params: { sku } }).then(r => r.data),

  getCustomers: () =>
    api.get('/admin/customers').then(r => r.data).catch(() => []),

  searchCustomers: (q) =>
    api.get('/admin/customers/search', { params: { q } }).then(r => r.data),

  createCustomer: (data) =>
    api.post('/admin/customers', data).then(r => r.data),

  validateCoupon: (body) =>
    api.post('/admin/pos/validate-coupon', body).then(r => r.data),

  getAvailableCoupons: (total, productIds, userId) =>
    api.get('/coupons/available', { params: { tongTien: total, maSanPhamIds: productIds?.join(','), maNguoiDung: userId } }).then(r => r.data).catch(() => []),

  createOrder: (data) =>
    api.post('/admin/pos/orders', data).then(r => r.data),

  vietQRPreview: (amount) =>
    api.post('/admin/pos/vietqr/preview', { amount }).then(r => r.data),

  confirmQRPayment: (data) =>
    api.post('/admin/pos/orders', data).then(r => r.data),

  getOrderPrintData: (id) =>
    api.get(`/orders/admin/${id}/print`).then(r => r.data),

  registerOrderPrint: (id) =>
    api.post(`/orders/admin/${id}/print`).then(r => r.data),

  calculateShipping: (body) =>
    api.post('/shipping/ghn/fee', body).then(r => {
      const d = r.data
      const total = d?.data?.total ?? d?.fee ?? 0
      return { fee: total }
    }).catch(() => ({ fee: 30000 })),

  getProvinces: () =>
    api.get('/shipping/ghn/provinces').then(r => r.data?.data || r.data || []).catch(() => []),

  getDistricts: (provinceId) =>
    api.get('/shipping/ghn/districts', { params: { provinceId } }).then(r => r.data?.data || r.data || []).catch(() => []),

  getWards: (districtId) =>
    api.get('/shipping/ghn/wards', { params: { districtId } }).then(r => r.data?.data || r.data || []).catch(() => []),

  getCustomerAddresses: (customerId) =>
    api.get(`/admin/customers/${customerId}/addresses`).then(r => r.data).catch(() => []),
}
