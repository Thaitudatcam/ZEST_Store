import api from './axios'
export const getProducts = (params) => api.get('/products', { params }).then((r) => r.data)
export const getProductBySlug = (slug) => api.get(`/products/${slug}`).then((r) => r.data)
export const getProductImages = (id) => api.get(`/products/${id}/images`).then((r) => r.data)
export const getProductVariants = (id) => api.get(`/products/${id}/variants`).then((r) => r.data)
export const searchSuggestions = (q, limit = 5) => api.get('/products/search/suggestions', { params: { q, limit } }).then((r) => r.data)

export const uploadProductImage = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const token = localStorage.getItem('token')
  const res = await fetch('http://localhost:8080/api/upload/product', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Upload failed (${res.status})`)
  }
  return res.json()
}
