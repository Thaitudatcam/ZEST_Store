import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

let isRefreshing = false
let failedQueue = []

const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token')
const getStorage = () => (localStorage.getItem('token') ? localStorage : sessionStorage)
const clearAuth = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('user')
}

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  failedQueue = []
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config
    const hasToken = !!getToken()
    // 401: thử refresh token. 403 + có token: token đã invalid (vd: đổi email)
    // -> không refresh được nữa, đăng xuất về login.
    if (err.response?.status === 403 && hasToken && !originalRequest.url?.includes('/auth/')) {
      clearAuth()
      window.location.href = '/login'
      return Promise.reject(err)
    }
    if (err.response?.status === 401 && !originalRequest.url?.includes('/auth/')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      isRefreshing = true
      try {
        const oldToken = getToken()
        if (!oldToken) throw new Error('No token')
        const { default: auth } = await import('./auth')
        const data = await auth.refreshTokenApi(oldToken)
        const newToken = data.token
        getStorage().setItem('token', newToken)
        getStorage().setItem('user', JSON.stringify(data))
        processQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch {
        processQueue(new Error('Refresh failed'))
        clearAuth()
        window.location.href = '/login'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(err)
  }
)

export default api
