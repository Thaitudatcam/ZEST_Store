import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { loginApi, registerApi, refreshTokenApi } from '../api/auth'

const AuthContext = createContext(null)

const getAuthStorage = () => (localStorage.getItem('token') ? localStorage : sessionStorage)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const s = localStorage.getItem('user') || sessionStorage.getItem('user')
    return s ? JSON.parse(s) : null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => { setLoading(false) }, [])

  const saveAuth = useCallback((storage, data) => {
    storage.setItem('token', data.token)
    storage.setItem('user', JSON.stringify(data))
    setUser(data)
  }, [])

  const login = useCallback(async (email, matKhau, remember = true) => {
    const data = await loginApi({ email, matKhau })
    saveAuth(remember ? localStorage : sessionStorage, data)
    return data
  }, [saveAuth])

  const register = useCallback(async (hoTen, email, matKhau, soDienThoai) => {
    const data = await registerApi({ hoTen, email, matKhau, soDienThoai })
    saveAuth(localStorage, data)
    return data
  }, [saveAuth])

  const refreshToken = useCallback(async () => {
    const storage = getAuthStorage()
    const oldToken = storage.getItem('token')
    if (!oldToken) throw new Error('No token')
    const data = await refreshTokenApi(oldToken)
    saveAuth(storage, data)
    return data.token
  }, [saveAuth])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, refreshToken, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
