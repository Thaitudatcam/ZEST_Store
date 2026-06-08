import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { loginApi } from '../api/auth'
import { LogIn } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [matKhau, setMatKhau] = useState('')
  const [err, setErr] = useState('')
  const [sub, setSub] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErr(''); setSub(true)
    try {
      await login(email, matKhau)
      navigate('/')
    } catch (err) {
      setErr(err.response?.data?.message || 'Đăng nhập thất bại')
    } finally { setSub(false) }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-xl shadow-sm border p-8">
        <div className="text-center mb-6">
          <LogIn className="h-10 w-10 mx-auto text-blue-700 mb-2" />
          <h1 className="text-2xl font-bold">Đăng nhập</h1>
        </div>
        {err && <p className="text-red-500 text-sm mb-4 text-center">{err}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="password" value={matKhau} onChange={(e) => setMatKhau(e.target.value)} placeholder="Mật khẩu" required className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="submit" disabled={sub} className="w-full bg-blue-700 text-white font-semibold py-3 rounded-lg hover:bg-blue-800 transition disabled:opacity-50">
            {sub ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
        <p className="text-sm text-center mt-4 text-gray-500">
          Chưa có tài khoản? <a href="/register" className="text-blue-700 hover:underline">Đăng ký</a>
        </p>
      </div>
    </div>
  )
}
