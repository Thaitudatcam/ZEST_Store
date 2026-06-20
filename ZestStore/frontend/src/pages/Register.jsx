import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { UserPlus } from 'lucide-react'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ hoTen: '', email: '', matKhau: '', xacNhan: '', soDienThoai: '' })
  const [err, setErr] = useState('')
  const [sub, setSub] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr('')
    if (form.matKhau !== form.xacNhan) return setErr('Mật khẩu xác nhận không khớp')
    setSub(true)
    try {
      await register(form.hoTen, form.email, form.matKhau, form.soDienThoai || undefined)
      navigate('/')
    } catch (err) {
      setErr(err.response?.data?.message || Object.values(err.response?.data?.errors || {}).join(', ') || 'Đăng ký thất bại')
    } finally { setSub(false) }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-xl shadow-sm border p-8">
        <div className="text-center mb-6">
          <UserPlus className="h-10 w-10 mx-auto text-blue-700 mb-2" />
          <h1 className="text-2xl font-bold">Đăng ký</h1>
        </div>
        {err && <p className="text-red-500 text-sm mb-4 text-center">{err}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="hoTen" value={form.hoTen} onChange={handleChange} placeholder="Họ tên" required className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" required className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input name="soDienThoai" value={form.soDienThoai} onChange={handleChange} placeholder="Số điện thoại" className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input name="matKhau" type="password" value={form.matKhau} onChange={handleChange} placeholder="Mật khẩu" required className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input name="xacNhan" type="password" value={form.xacNhan} onChange={handleChange} placeholder="Xác nhận mật khẩu" required className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="submit" disabled={sub} className="w-full bg-blue-700 text-white font-semibold py-3 rounded-lg hover:bg-blue-800 transition disabled:opacity-50">
            {sub ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>
        <p className="text-sm text-center mt-4 text-gray-500">
          Đã có tài khoản? <a href="/login" className="text-blue-700 hover:underline">Đăng nhập</a>
        </p>
      </div>
    </div>
  )
}
