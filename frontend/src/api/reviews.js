import api from './axios'

export const getProductReviews = (productId) =>
  api.get(`/reviews/product/${productId}`).then((r) => r.data)

export const addReview = (data) =>
  api.post('/reviews', data).then((r) => r.data)
