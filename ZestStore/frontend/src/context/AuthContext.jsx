import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { loginApi, registerApi, refreshTokenApi } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const s = localStorage.getItem('user')
    return s ? JSON.parse(s) : null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => { setLoading(false) }, [])

  const login = useCallback(async (email, matKhau) => {
    const data = await loginApi({ email, matKhau })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data))
    setUser(data)
    return data
  }, [])

  const register = useCallback(async (hoTen, email, matKhau, soDienThoai, dongYDongThuan = false) => {
    const data = await registerApi({ hoTen, email, matKhau, soDienThoai, dongYDongThuan })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data))
    setUser(data)
    return data
  }, [])

  const refreshToken = useCallback(async () => {
    const oldToken = localStorage.getItem('token')
    if (!oldToken) throw new Error('No token')
    const data = await refreshTokenApi(oldToken)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data))
    setUser(data)
    return data.token
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
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
