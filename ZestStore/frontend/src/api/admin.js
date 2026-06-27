import api from './axios'

export const getStats = () => api.get('/dashboard/stats').then((r) => r.data)
export const getRevenue = (tuNgay, denNgay) => api.get('/dashboard/revenue/day', { params: { tuNgay, denNgay } }).then((r) => r.data)

export const getTopProducts = (hanhDong = 'view', limit = 10) => api.get('/dashboard/top-products', { params: { hanhDong, limit } }).then((r) => r.data)
export const getAllOrders = (page = 0, size = 20, loaiDonHang) => api.get('/orders/admin/all', { params: { page, size, loaiDonHang } }).then((r) => r.data)
export const updateOrderStatus = (id, trangThai) => api.put(`/orders/admin/${id}/status`, { trangThai }).then((r) => r.data)
export const getAdminOrderDetail = (id) => api.get(`/orders/admin/${id}/detail`).then((r) => r.data)

export const getCoupons = () => api.get('/coupons').then((r) => r.data)
export const createCoupon = (data) => api.post('/coupons', data).then((r) => r.data)
export const deleteCoupon = (id) => api.delete(`/coupons/${id}`).then((r) => r.data)
export const createCategory = (data) => api.post('/categories', data).then((r) => r.data)
export const createBrand = (data) => api.post('/brands', data).then((r) => r.data)
export const createColor = (data) => api.post('/colors', data).then((r) => r.data)
export const createSize = (data) => api.post('/sizes', data).then((r) => r.data)
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data).then((r) => r.data)
export const deleteCategory = (id) => api.delete(`/categories/${id}`).then((r) => r.data)

export const getInvoices = (page = 0, size = 20) => api.get('/invoices', { params: { page, size } }).then((r) => r.data)
export const getInvoiceDetail = (id) => api.get(`/invoices/${id}`).then((r) => r.data)
export const generateInvoice = (orderId) => api.post(`/invoices/generate/${orderId}`).then((r) => r.data)

export const getAllReviews = () => api.get('/admin/reviews').then((r) => r.data)
export const deleteReview = (id) => api.delete(`/admin/reviews/${id}`).then((r) => r.data)
export const restoreReview = (id) => api.put(`/admin/reviews/${id}/restore`).then((r) => r.data)

export const getCustomers = () => api.get('/admin/customers').then((r) => r.data)
export const getCustomerDetail = (id) => api.get(`/admin/customers/${id}`).then((r) => r.data)
export const toggleCustomerStatus = (id) => api.put(`/admin/customers/${id}/status`).then((r) => r.data)
export const searchCustomers = (q) => api.get('/admin/customers/search', { params: { q } }).then((r) => r.data)
export const createCustomer = (data) => api.post('/admin/customers', data).then((r) => r.data)

export const getEmployees = () => api.get('/admin/employees').then((r) => r.data)
export const createEmployee = (data) => api.post('/admin/employees', data).then((r) => r.data)
export const updateEmployee = (id, data) => api.put(`/admin/employees/${id}`, data).then((r) => r.data)
export const toggleEmployeeStatus = (id) => api.put(`/admin/employees/${id}/status`).then((r) => r.data)


export const getRevenueByDay = (tuNgay, denNgay) => api.get('/dashboard/revenue/day', { params: { tuNgay, denNgay } }).then(r => r.data)
export const getRevenueByMonth = (thang, nam) => 
  api.get('/dashboard/revenue/month', { params: { thang, nam } }).then(r => r.data)
export const getRevenueByYear = () => api.get('/dashboard/revenue/year').then(r => r.data)
export const getBestSelling = (limit = 10) => api.get('/dashboard/best-selling', { params: { limit } }).then(r => r.data)
export const getOrderStats = () => api.get('/dashboard/order-stats').then(r => r.data)
export const exportAndSendEmail = (tuNgay, denNgay) => 
  api.post('/dashboard/export-email', { tuNgay, denNgay }).then(r => r.data)
export const filterCoupons = (queryString) =>
  api.get(`/coupons/filter?${queryString}`).then((r) => r.data);

export const toggleProductStatus = (id) => api.put(`/products/${id}/toggle-status`).then((r) => r.data)

export const getRevenueByDate = (days = 30) => api.get('/dashboard/revenue-by-date', { params: { days } }).then((r) => r.data)
export const getRecentOrders = (limit = 10) => api.get('/dashboard/recent-orders', { params: { limit } }).then((r) => r.data)

export const getShippingFees = () => api.get('/admin/shipping-fees').then((r) => r.data)
export const createShippingFee = (data) => api.post('/admin/shipping-fees', data).then((r) => r.data)
export const updateShippingFee = (id, data) => api.put(`/admin/shipping-fees/${id}`, data).then((r) => r.data)
export const deleteShippingFee = (id) => api.delete(`/admin/shipping-fees/${id}`).then((r) => r.data)

