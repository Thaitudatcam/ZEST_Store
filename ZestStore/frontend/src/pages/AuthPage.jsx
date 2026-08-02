import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Check, User, Mail, Lock, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import Input from '../components/ui/Input'
import { useReducedMotion } from '../hooks/useReducedMotion'
import logoImg from '../pictures/ZS.png'
import bgImage from '../pictures/anhnen.png'

/* ── 3D page-turn animation keyframe name constants ── */
const ANIM_TURN_LEFT = 'turn-left'
const ANIM_TURN_RIGHT = 'turn-right'
const ANIM_DURATION = 860 // ms

export default function AuthPage() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const reduced = useReducedMotion()

  const isSignUp = pathname === '/register'
  const [animating, setAnimating] = useState(false)
  const [showSignUp, setShowSignUp] = useState(isSignUp)
  const [animKey, setAnimKey] = useState(0) // force re-trigger animation

  /* Sync with route on mount */
  useEffect(() => { setShowSignUp(isSignUp) }, [pathname])

  const toggle = useCallback((toSignUp) => {
    if (animating) return
    setAnimating(true)
    setShowSignUp(toSignUp)
    setAnimKey((k) => k + 1)
    setTimeout(() => setAnimating(false), ANIM_DURATION)
    navigate(toSignUp ? '/register' : '/login', { replace: true })
  }, [animating, navigate])

  /* ── Determine overlay animation class ── */
  const overlayAnimClass = showSignUp ? ANIM_TURN_LEFT : ANIM_TURN_RIGHT

  /* ── Inline style for animation (avoids Tailwind purge issues) ── */
  const overlayStyle = {
    animationName: overlayAnimClass,
    animationDuration: `${ANIM_DURATION}ms`,
    animationTimingFunction: 'linear',
    animationFillMode: 'forwards',
    // On reduced motion, just snap position without animation
    ...(reduced && {
      animation: 'none',
      transform: showSignUp ? 'translate3d(-100%, 0, 0)' : 'translate3d(0, 0, 0)',
    }),
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="absolute inset-0 bg-noir/70 backdrop-blur-sm" />

      {/* ─── Mobile Layout (visible below md) ─── */}
      <div className="w-full max-w-md rounded-2xl shadow-lux overflow-hidden relative border border-gold/20 md:hidden">
        <div className="bg-noir flex flex-col items-center pt-10 pb-6 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-gold/10 rounded-full blur-3xl" />
          <img src={logoImg} alt="ZestStore" className="w-16 h-16 object-contain rounded-md ring-1 ring-gold/30 mb-2 relative z-10" />
          <div className="w-6 h-px bg-gold/60 mx-auto mb-1.5" />
          <p className="text-xs text-gold/80 tracking-[0.25em] uppercase relative z-10">Tinh hoa thời trang Việt</p>
        </div>

        <div className="bg-ivory px-6 py-8">
          <AnimatePresence mode="wait">
            {showSignUp ? (
              <motion.div
                key="mobile-register"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}>
                <RegisterForm onSuccess={() => navigate('/')} onSwitch={() => toggle(false)} />
              </motion.div>
            ) : (
              <motion.div
                key="mobile-login"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}>
                <LoginForm
                  onSuccess={(data) => {
                    if (data.vaiTro === 'ADMIN') navigate('/admin')
                    else if (data.vaiTro === 'STAFF') navigate('/admin/pos')
                    else navigate('/')
                  }}
                  onSwitch={() => toggle(true)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Desktop Layout: 3D Flip Auth Card (hidden below md) ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="hidden md:flex w-full max-w-[920px] h-[540px] rounded-2xl shadow-lux overflow-hidden relative border border-gold/20"
        style={{ perspective: '1500px' }}>

        {/* ── Left Panel: LoginForm (visible when overlay is at right) ── */}
        <div className="relative w-1/2 h-full bg-ivory overflow-hidden">
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-gold/10 rounded-full blur-3xl" />
          <div className="relative z-10 w-full h-full flex flex-col justify-center px-10"
            aria-hidden={showSignUp} {...(showSignUp && { inert: '' })}>
            <LoginForm onSuccess={(data) => {
              if (data.vaiTro === 'ADMIN') navigate('/admin')
              else if (data.vaiTro === 'STAFF') navigate('/admin/pos')
              else navigate('/')
            }} />
          </div>
        </div>

        {/* ── Right Panel: RegisterForm (hidden behind overlay, revealed when it flips left) ── */}
        <div className="relative w-1/2 h-full bg-ivory overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gold/10 rounded-full blur-3xl" />
          <div className="relative z-10 w-full h-full flex flex-col justify-center px-10"
            aria-hidden={!showSignUp} {...(!showSignUp && { inert: '' })}>
            <RegisterForm onSuccess={() => navigate('/')} />
          </div>
        </div>

        {/* ── 3D Overlay: starts at right covering RegisterForm, flips left to cover LoginForm ── */}
        <div
          key={animKey}
          className="absolute top-0 right-0 w-1/2 h-full bg-noir flex flex-col items-center justify-center text-ivory p-10 overflow-hidden z-20"
          style={{
            ...overlayStyle,
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
            willChange: animating ? 'transform' : 'auto',
          }}>
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-gold/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-gold/5 rounded-full blur-3xl" />
          <div className="absolute top-6 left-6 w-8 h-8 border-t border-l border-gold/40" />
          <div className="absolute bottom-6 right-6 w-8 h-8 border-b border-r border-gold/40" />

          <div className="relative z-10 flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className="w-24 h-24 mb-1 flex items-center justify-center overflow-hidden rounded-md ring-1 ring-gold/30">
              <img src={logoImg} alt="ZestStore" className="w-full h-full object-contain" />
            </motion.div>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="w-8 h-px bg-gold/60 my-2 mx-auto origin-center" />
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="text-xs text-gold/80 tracking-[0.25em] uppercase mb-8">Tinh hoa thời trang Việt</motion.p>

            <AnimatePresence mode="wait">
              <motion.div
                key={showSignUp ? 'login-cta' : 'register-cta'}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="w-full">
                <h2 className="font-serif text-2xl font-bold mb-2.5 text-ivory">
                  {showSignUp ? 'Chào mừng trở lại!' : 'Chưa có tài khoản?'}
                </h2>
                <p className="text-sm text-stone-light/70 mb-6 max-w-xs mx-auto leading-relaxed">
                  {showSignUp
                    ? 'Đăng nhập để truy cập tủ đồ cá nhân và tiếp tục hành trình thời trang của bạn.'
                    : 'Tạo tài khoản ngay và bắt đầu hành trình thời trang cùng ZestStore hôm nay!'}
                </p>
                <button
                  onClick={() => toggle(!showSignUp)}
                  disabled={animating}
                  className="group inline-flex items-center gap-2 px-8 py-3 bg-gold text-noir font-semibold rounded-full text-sm shadow-gold hover:bg-gold-light hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed">
                  {showSignUp ? 'Đăng Nhập' : 'Tạo Tài Khoản'}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </motion.div>
            </AnimatePresence>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
              <span className={`w-2 h-2 rounded-full transition-all duration-300 ${showSignUp ? 'bg-gold/80' : 'bg-ivory/15'}`} />
              <span className={`w-2 h-2 rounded-full transition-all duration-300 ${showSignUp ? 'bg-ivory/15' : 'bg-gold/80'}`} />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   Register Form
   ══════════════════════════════════════════════════════════════════ */
function RegisterForm({ onSuccess, onSwitch }) {
  const { register } = useAuth()
  const [form, setForm] = useState({ hoTen: '', email: '', matKhau: '' })
  const [agree, setAgree] = useState(false)
  const [err, setErr] = useState('')
  const [sub, setSub] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr('')
    if (!agree) { setErr('Vui lòng đồng ý với Điều khoản & Điều kiện'); return }
    setSub(true)
    try {
      await register(form.hoTen, form.email, form.matKhau, undefined, agree)
      onSuccess?.()
    } catch (err) {
      setErr(err.response?.data?.message || Object.values(err.response?.data?.errors || {}).join(', ') || 'Đăng ký thất bại')
    } finally { setSub(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <div className="mb-2">
        <h2 className="font-serif text-2xl font-bold text-ink">Tạo Tài Khoản</h2>
        <p className="text-sm text-stone mt-1">Tham gia cộng đồng thời trang độc quyền của chúng tôi</p>
      </div>

      {err && (
        <div className="flex items-center gap-2 bg-bordeaux/5 border border-bordeaux/20 rounded-xl px-4 py-2.5 text-xs text-bordeaux">
          <span>{err}</span>
        </div>
      )}

      <Input icon={User} value={form.hoTen} onChange={e => setForm({ ...form, hoTen: e.target.value })} placeholder="Họ và Tên" required />
      <Input icon={Mail} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" required />
      <Input icon={Lock} type="password" value={form.matKhau} onChange={e => setForm({ ...form, matKhau: e.target.value })} placeholder="Mật Khẩu" required />

      <label className="flex items-start gap-2.5 cursor-pointer group pt-0.5">
        <button type="button" onClick={() => setAgree(!agree)}
          className={`w-4.5 h-4.5 mt-0.5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${agree ? 'bg-gold border-gold' : 'border-stone-light/40 group-hover:border-gold'}`}>
          {agree && <Check className="h-3 w-3 text-noir" strokeWidth={3} />}
        </button>
        <span className="text-xs text-stone leading-relaxed">Tôi đồng ý với <Link to="/policies/dieu-khoan-dich-vu" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-gold-dark hover:underline font-medium">Điều Khoản Dịch Vụ</Link> & <Link to="/policies/chinh-sach-su-dung" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-gold-dark hover:underline font-medium">Chính Sách Sử Dụng</Link></span>
      </label>

      <button type="submit" disabled={sub || !form.hoTen || !form.email || !form.matKhau}
        className="w-full bg-gradient-to-r from-gold to-gold-dark text-noir font-semibold py-3 rounded-full text-sm hover:from-gold-light hover:to-gold shadow-gold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
        {sub ? 'Đang tạo tài khoản...' : 'Tạo Tài Khoản'}
      </button>

      {onSwitch && (
        <p className="text-xs text-stone text-center pt-1">
          Đã có tài khoản?{' '}
          <button type="button" onClick={onSwitch} className="text-gold-dark hover:text-gold font-medium hover:underline">
            Đăng Nhập
          </button>
        </p>
      )}
    </form>
  )
}

/* ══════════════════════════════════════════════════════════════════
   Login Form
   ══════════════════════════════════════════════════════════════════ */
function LoginForm({ onSuccess, onSwitch }) {
  const { login } = useAuth()
  const [email, setEmail] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rememberedLogin') || 'null')?.email || '' } catch { return '' }
  })
  const [matKhau, setMatKhau] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rememberedLogin') || 'null')?.matKhau || '' } catch { return '' }
  })
  const [remember, setRemember] = useState(() => {
    try { return !!JSON.parse(localStorage.getItem('rememberedLogin') || 'null') } catch { return false }
  })
  const [err, setErr] = useState('')
  const [sub, setSub] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr(''); setSub(true)
    try {
      const data = await login(email, matKhau, remember)
      if (remember) {
        localStorage.setItem('rememberedLogin', JSON.stringify({ email, matKhau }))
      } else {
        localStorage.removeItem('rememberedLogin')
      }
      onSuccess?.(data)
    } catch (err) {
      setErr(err.response?.data?.message || 'Đăng nhập thất bại')
    } finally { setSub(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <div className="mb-2">
        <h2 className="font-serif text-2xl font-bold text-ink">Chào Mừng Trở Lại</h2>
        <p className="text-sm text-stone mt-1">Đăng nhập để tiếp tục hành trình thời trang</p>
      </div>

      {err && (
        <div className="flex items-center gap-2 bg-bordeaux/5 border border-bordeaux/20 rounded-xl px-4 py-2.5 text-xs text-bordeaux">
          <span>{err}</span>
        </div>
      )}

      <Input icon={Mail} type="text" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email hoặc Số Điện Thoại" required />
      <Input icon={Lock} type="password" value={matKhau} onChange={e => setMatKhau(e.target.value)} placeholder="Mật Khẩu" required />

      <div className="flex items-center justify-between pt-0.5">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="w-4 h-4 rounded border-stone-light/40 text-gold focus:ring-gold/30 cursor-pointer" />
          <span className="text-xs text-stone">Ghi nhớ đăng nhập</span>
        </label>
        <Link to="/quen-mat-khau" className="text-xs text-gold-dark hover:text-gold font-medium hover:underline">
          Quên Mật Khẩu?
        </Link>
      </div>

      <button type="submit" disabled={sub || !email || !matKhau}
        className="w-full bg-gradient-to-r from-gold to-gold-dark text-noir font-semibold py-3 rounded-full text-sm hover:from-gold-light hover:to-gold shadow-gold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
        {sub ? 'Đang đăng nhập...' : 'Đăng Nhập'}
      </button>

      {onSwitch && (
        <p className="text-xs text-stone text-center pt-1">
          Chưa có tài khoản?{' '}
          <button type="button" onClick={onSwitch} className="text-gold-dark hover:text-gold font-medium hover:underline">
            Tạo Ngay
          </button>
        </p>
      )}
    </form>
  )
}
