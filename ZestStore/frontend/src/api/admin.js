import api from './axios'

export const getStats = () => api.get('/dashboard/stats').then((r) => r.data)
export const getRevenue = (tuNgay, denNgay) => api.get('/dashboard/revenue', { params: { tuNgay, denNgay } }).then((r) => r.data)
export const getTopProducts = (hanhDong = 'view', limit = 10) => api.get('/dashboard/top-products', { params: { hanhDong, limit } }).then((r) => r.data)
export const getAllOrders = () => api.get('/orders/admin/all').then((r) => r.data)
export const updateOrderStatus = (id, trangThai) => api.put(`/orders/admin/${id}/status`, { trangThai }).then((r) => r.data)
export const getCoupons = () => api.get('/coupons').then((r) => r.data)
export const createCoupon = (data) => api.post('/coupons', data).then((r) => r.data)
export const deleteCoupon = (id) => api.delete(`/coupons/${id}`).then((r) => r.data)
export const createCategory = (data) => api.post('/categories', data).then((r) => r.data)
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data).then((r) => r.data)
export const deleteCategory = (id) => api.delete(`/categories/${id}`).then((r) => r.data)

export const getInvoices = () => api.get('/invoices').then((r) => r.data)
export const getInvoiceDetail = (id) => api.get(`/invoices/${id}`).then((r) => r.data)
export const generateInvoice = (orderId) => api.post(`/invoices/generate/${orderId}`).then((r) => r.data)

export const getAllReviews = () => api.get('/admin/reviews').then((r) => r.data)
export const deleteReview = (id) => api.delete(`/admin/reviews/${id}`).then((r) => r.data)
export const restoreReview = (id) => api.put(`/admin/reviews/${id}/restore`).then((r) => r.data)

export const getCustomers = () => api.get('/admin/customers').then((r) => r.data)
export const getCustomerDetail = (id) => api.get(`/admin/customers/${id}`).then((r) => r.data)
export const toggleCustomerStatus = (id) => api.put(`/admin/customers/${id}/status`).then((r) => r.data)

export const getEmployees = () => api.get('/admin/employees').then((r) => r.data)
export const createEmployee = (data) => api.post('/admin/employees', data).then((r) => r.data)
export const updateEmployee = (id, data) => api.put(`/admin/employees/${id}`, data).then((r) => r.data)
export const toggleEmployeeStatus = (id) => api.put(`/admin/employees/${id}/status`).then((r) => r.data)
