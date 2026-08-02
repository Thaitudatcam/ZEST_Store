import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { quenMatKhau, datLaiMatKhau } from '../api/auth'
import { KeyRound, Mail, Lock } from 'lucide-react'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [matKhauMoi, setMatKhauMoi] = useState('')
  const [xacNhan, setXacNhan] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [sub, setSub] = useState(false)

  useEffect(() => {
    const s = location.state
    if (s?.step === 3 && s?.email) {
      setEmail(s.email)
      setOtp(s.otp || '')
      setStep(3)
    } else if (s?.step === 1 && s?.email) {
      setEmail(s.email)
      setStep(1)
    }
    window.history.replaceState({}, document.title)
  }, [location.state])

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setErr(''); setMsg(''); setSub(true)
    try {
      await quenMatKhau({ email })
      navigate(`/xac-thuc-otp?type=forgotPassword&email=${encodeURIComponent(email)}`)
    } catch (err) {
      setErr(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally { setSub(false) }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setErr(''); setMsg('')
    if (matKhauMoi.length < 6) { setErr('Mật khẩu phải có ít nhất 6 ký tự'); return }
    if (matKhauMoi !== xacNhan) { setErr('Mật khẩu không khớp'); return }
    setSub(true)
    try {
      const res = await datLaiMatKhau({ email, maXacThuc: otp, matKhauMoi })
      setMsg(res.message)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      const msgErr = err.response?.data?.message || 'Có lỗi xảy ra'
      if (msgErr.includes('hết hạn')) {
        setErr('')
        navigate(`/xac-thuc-otp?type=forgotPassword&email=${encodeURIComponent(email)}`)
      } else {
        setErr(msgErr)
      }
    } finally { setSub(false) }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-ivory rounded-xl shadow-sm border p-8">
        <div className="text-center mb-6">
          <KeyRound className="h-10 w-10 mx-auto text-gold mb-2" />
          <h1 className="text-2xl font-bold">Quên mật khẩu</h1>
        </div>

        {err && <p className="text-bordeaux text-sm mb-4 text-center">{err}</p>}
        {msg && <p className="text-emerald-deep text-sm mb-4 text-center">{msg}</p>}

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Email của bạn" required
                className="w-full border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold" />
            </div>
            <button type="submit" disabled={sub}
              className="w-full bg-gold text-noir font-semibold py-3 rounded-lg hover:bg-gold-hover transition disabled:opacity-50">
              {sub ? 'Đang gửi...' : 'Gửi mã xác thực'}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleReset} className="space-y-4">
            <p className="text-sm text-stone text-center">Đặt lại mật khẩu cho <strong>{email}</strong></p>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
              <input type="password" value={matKhauMoi} onChange={(e) => setMatKhauMoi(e.target.value)}
                placeholder="Mật khẩu mới" required minLength={6}
                className="w-full border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
              <input type="password" value={xacNhan} onChange={(e) => setXacNhan(e.target.value)}
                placeholder="Xác nhận mật khẩu mới" required
                className="w-full border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold" />
            </div>
            <button type="submit" disabled={sub}
              className="w-full bg-gold text-noir font-semibold py-3 rounded-lg hover:bg-gold-hover transition disabled:opacity-50">
              {sub ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
            </button>
          </form>
        )}

        <p className="text-sm text-center mt-4 text-stone">
          <a href="/login" className="text-gold hover:underline">Quay lại đăng nhập</a>
        </p>
      </div>
    </div>
  )
}
