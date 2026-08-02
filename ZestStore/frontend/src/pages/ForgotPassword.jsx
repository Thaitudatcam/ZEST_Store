import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { quenMatKhau, xacThucQuenMatKhau, datLaiMatKhau } from '../api/auth'
import OtpVerification from '../components/OtpVerification'
import { KeyRound, Mail, Lock } from 'lucide-react'

const maskEmail = (email) => {
  if (!email) return ''
  const idx = email.indexOf('@')
  if (idx <= 0) return email
  const local = email.slice(0, idx)
  const domain = email.slice(idx)
  const head = local.slice(0, Math.min(2, local.length))
  return `${head}***${domain}`
}

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [matKhauMoi, setMatKhauMoi] = useState('')
  const [xacNhan, setXacNhan] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [sub, setSub] = useState(false)

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setErr(''); setMsg(''); setSub(true)
    try {
      const res = await quenMatKhau({ email })
      setMsg(res.message)
      setStep(2)
    } catch (err) {
      setErr(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally { setSub(false) }
  }

  const handleResendOtp = async () => {
    await quenMatKhau({ email })
  }

  const handleXacThucOtp = async (code) => {
    await xacThucQuenMatKhau({ email, maXacThuc: code })
    setOtp(code)
    setMsg('')
    setStep(3)
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
        setOtp(''); setErr(''); setMsg('')
        setStep(2)
        quenMatKhau({ email }).catch(() => {})
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

      {step === 2 && (
        <OtpVerification
          title="Xác minh OTP"
          email={maskEmail(email)}
          length={6}
          expireSeconds={600}
          onConfirm={handleXacThucOtp}
          onResend={handleResendOtp}
          onBack={() => { setStep(1); setErr(''); setMsg('') }}
        />
      )}
    </div>
  )
}
