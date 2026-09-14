import api from './axios'

export const getBestSelling = (limit = 10) =>
  api.get('/recommendations/best-selling', { params: { limit } }).then((r) => r.data)

export const getPopular = (limit = 10) =>
  api.get('/recommendations/popular', { params: { limit } }).then((r) => r.data)

export const getPersonalized = (limit = 10) =>
  api.get('/recommendations/personalized', { params: { limit } }).then((r) => r.data)
