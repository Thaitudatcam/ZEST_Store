import { useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { guiMaXacThuc, xacThucEmail, quenMatKhau, xacThucQuenMatKhau } from '../api/auth'
import { guiMaXacThucEmailMoi, xacNhanEmailMoi } from '../api/users'
import { useAuth } from '../context/AuthContext'
import OtpVerification from '../components/OtpVerification'

const maskEmail = (email) => {
  if (!email) return ''
  const idx = email.indexOf('@')
  if (idx <= 0) return email
  const local = email.slice(0, idx)
  const domain = email.slice(idx)
  const head = local.slice(0, Math.min(2, local.length))
  return `${head}***${domain}`
}

export default function OtpVerifyPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { logout } = useAuth()

  const type = searchParams.get('type')
  const email = searchParams.get('email') || ''
  const emailMoi = searchParams.get('emailMoi') || ''

  useEffect(() => {
    if (type !== 'verifyEmail' && type !== 'verifyNewEmail' && type !== 'forgotPassword') {
      navigate('/', { replace: true })
    }
  }, [type, navigate])

  const flow = useMemo(() => {
    if (type === 'verifyEmail') {
      return {
        title: 'Xác thực email',
        email: '',
        onConfirm: async (code) => {
          await xacThucEmail({ maXacThuc: code })
          navigate('/profile', { state: { msg: 'Xác thực email thành công' } })
        },
        onResend: () => guiMaXacThuc(),
        onBack: () => navigate('/profile'),
      }
    }
    if (type === 'verifyNewEmail') {
      return {
        title: 'Xác thực email mới',
        email: emailMoi,
        onConfirm: async (code) => {
          await xacNhanEmailMoi({ maXacThuc: code })
          logout()
          navigate('/login', { state: { message: 'Đổi email thành công. Vui lòng đăng nhập lại bằng email mới.' } })
        },
        onResend: () => guiMaXacThucEmailMoi({ emailMoi }),
        onBack: () => navigate('/profile'),
      }
    }
    if (type === 'forgotPassword') {
      return {
        title: 'Xác minh OTP',
        email,
        onConfirm: async (code) => {
          await xacThucQuenMatKhau({ email, maXacThuc: code })
          navigate('/quen-mat-khau', { state: { step: 3, email, otp: code } })
        },
        onResend: () => quenMatKhau({ email }),
        onBack: () => navigate('/quen-mat-khau', { state: { step: 1, email } }),
      }
    }
    return null
  }, [type, email, emailMoi, navigate, logout])

  if (!flow) return null

  return (
    <OtpVerification
      variant="page"
      title={flow.title}
      email={maskEmail(flow.email)}
      length={6}
      expireSeconds={600}
      onConfirm={flow.onConfirm}
      onResend={flow.onResend}
      onBack={flow.onBack}
    />
  )
}
