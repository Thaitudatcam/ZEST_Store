import api from './axios'

export const getStats = () => api.get('/dashboard/stats').then((r) => r.data)
export const getAllOrders = (page = 0, size = 20, loaiDonHang, q, trangThai, tuNgay, denNgay) => api.get('/orders/admin/all', { params: { page, size, loaiDonHang, q, trangThai, tuNgay, denNgay } }).then((r) => r.data)
export const getCoupons = () => api.get('/coupons').then((r) => r.data)
export const generateCouponCode = () => api.get('/coupons/generate-code').then((r) => r.data)
export const createCoupon = (data) => api.post('/coupons', data).then((r) => r.data)
export const deleteCoupon = (id) => api.delete(`/coupons/${id}`).then((r) => r.data)
export const getCouponUsers = (id) => api.get(`/coupons/${id}/users`).then((r) => r.data)
export const revokeCouponUser = (couponId, userId) => api.delete(`/coupons/${couponId}/users/${userId}`).then((r) => r.data)
export const createCategory = (data) => api.post('/categories', data).then((r) => r.data)
export const deleteBrand = (id) => api.delete('/brands/' + id).then((r) => r.data)
export const toggleBrand = (id) => api.put('/brands/' + id + '/toggle').then((r) => r.data)
export const createBrand = (data) => api.post('/brands', data).then((r) => r.data)
export const updateBrand = (id, data) => api.put('/brands/' + id, data).then((r) => r.data)
export const getBrands = () => api.get('/brands').then((r) => r.data)
export const createColor = (data) => api.post('/colors', data).then((r) => r.data)
export const createSize = (data) => api.post('/sizes', data).then((r) => r.data)
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data).then((r) => r.data)
export const deleteCategory = (id) => api.delete(`/categories/${id}`).then((r) => r.data)
export const toggleCategory = (id) => api.put(`/categories/${id}/toggle`).then((r) => r.data)

export const getOrderPrintData = (id) => api.get(`/orders/admin/${id}/print`).then((r) => r.data)
export const registerOrderPrint = (id) => api.post(`/orders/admin/${id}/print`).then((r) => r.data)

export const getAllReviews = () => api.get('/admin/reviews').then((r) => r.data)
export const deleteReview = (id) => api.delete(`/admin/reviews/${id}`).then((r) => r.data)
export const restoreReview = (id) => api.put(`/admin/reviews/${id}/restore`).then((r) => r.data)

export const getCustomers = () => api.get('/admin/customers').then((r) => r.data)
export const toggleCustomerStatus = (id) => api.put(`/admin/customers/${id}/status`).then((r) => r.data)
export const searchCustomers = (q) => api.get('/admin/customers/search', { params: { q } }).then((r) => r.data)
export const createCustomer = (data) => api.post('/admin/customers', data).then((r) => r.data)
export const getCustomerAddresses = (id) => api.get(`/admin/customers/${id}/addresses`).then((r) => r.data)
export const addCustomerAddress = (id, data) => api.post(`/admin/customers/${id}/addresses`, data).then((r) => r.data)
export const updateCustomerAddress = (customerId, addressId, data) => api.put(`/admin/customers/${customerId}/addresses/${addressId}`, data).then((r) => r.data)
export const deleteCustomerAddress = (customerId, addressId) => api.delete(`/admin/customers/${customerId}/addresses/${addressId}`).then((r) => r.data)
export const setDefaultCustomerAddress = (customerId, addressId) => api.put(`/admin/customers/${customerId}/addresses/${addressId}/default`).then((r) => r.data)

export const getEmployees = () => api.get('/admin/employees').then((r) => r.data)
export const createEmployee = (data) => api.post('/admin/employees', data).then((r) => r.data)
export const updateEmployee = (id, data) => api.put(`/admin/employees/${id}`, data).then((r) => r.data)
export const toggleEmployeeStatus = (id) => api.put(`/admin/employees/${id}/status`).then((r) => r.data)

export const getRevenueByDay = (tuNgay, denNgay) => api.get('/dashboard/revenue/day', { params: { tuNgay, denNgay } }).then(r => r.data)
export const getRevenueByMonth = (thang, nam) => 
  api.get('/dashboard/revenue/month', { params: { thang, nam } }).then(r => r.data)
export const getRevenueByYear = () => api.get('/dashboard/revenue/year').then(r => r.data)
export const getOrderStats = () => api.get('/dashboard/order-stats').then(r => r.data)
export const filterCoupons = (queryString) =>
  api.get(`/coupons/filter?${queryString}`).then((r) => r.data);

export const toggleProductStatus = (id) => api.put(`/products/${id}/toggle-status`).then((r) => r.data)

export const getRevenueByDate = (days = 30) => api.get('/dashboard/revenue-by-date', { params: { days } }).then((r) => r.data)
export const getRecentOrders = (limit = 10) => api.get('/dashboard/recent-orders', { params: { limit } }).then((r) => r.data)
export const getBestSellingProducts = (limit = 10) => api.get('/dashboard/best-selling', { params: { limit } }).then((r) => r.data)

export const getShippingFees = () => api.get('/admin/shipping-fees').then((r) => r.data)
export const createShippingFee = (data) => api.post('/admin/shipping-fees', data).then((r) => r.data)
export const updateShippingFee = (id, data) => api.put(`/admin/shipping-fees/${id}`, data).then((r) => r.data)
export const deleteShippingFee = (id) => api.delete(`/admin/shipping-fees/${id}`).then((r) => r.data)
export const toggleCouponStatus = (id) => api.put(`/coupons/${id}/toggle-status`).then(r => r.data)
export const updateCoupon = (id, data) => api.put(`/coupons/${id}`, data).then(r => r.data)
export const lookupSku = (sku) => api.get(`/admin/pos/scan`, { params: { sku } }).then((r) => r.data)

export const getCampaigns = () => api.get('/admin/campaigns').then((r) => r.data)
export const getCampaign = (id) => api.get(`/admin/campaigns/${id}`).then((r) => r.data)
export const createCampaign = (data) => api.post('/admin/campaigns', data).then((r) => r.data)
export const toggleCampaignStatus = (id) => api.put(`/admin/campaigns/${id}/toggle-status`).then((r) => r.data)
export const launchCampaign = (id) => api.post(`/admin/campaigns/${id}/launch`).then((r) => r.data)
export const updateCampaign = (id, data) => api.put(`/admin/campaigns/${id}`, data).then((r) => r.data)
export const deleteCampaign = (id) => api.delete(`/admin/campaigns/${id}`).then((r) => r.data)

export const getThuocTinh = (loai) => api.get('/thuoc-tinh', { params: { loai } }).then((r) => r.data)
export const createThuocTinh = (loaiThuocTinh, giaTri) => api.post('/thuoc-tinh', { loaiThuocTinh, giaTri }).then((r) => r.data)
