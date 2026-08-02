import { useState, useRef, useEffect } from 'react'
import { X, ShieldCheck, ArrowLeft } from 'lucide-react'
import './OtpVerification.css'

export default function OtpVerification({
  title = 'Xác minh OTP',
  email = '',
  length = 6,
  expireSeconds = 600,
  variant = 'modal',
  onConfirm,
  onResend,
  onBack,
}) {
  const [digits, setDigits] = useState(Array(length).fill(''))
  const [remaining, setRemaining] = useState(expireSeconds)
  const [confirming, setConfirming] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [locked, setLocked] = useState(false)
  const inputsRef = useRef([])

  const code = digits.join('')
  const isComplete = code.length === length
  const expired = remaining <= 0

  const focusIndex = (i) => {
    const el = inputsRef.current[i]
    if (el) el.focus()
  }

  const getErr = (err) => err?.response?.data?.message || err?.message || 'Có lỗi xảy ra'

  useEffect(() => {
    focusIndex(0)
    const onKey = (e) => { if (e.key === 'Escape') onBack() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (remaining <= 0) return
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(t)
  }, [remaining])

  const handleChange = (i, val) => {
    if (locked) return
    const v = val.replace(/\D/g, '')
    if (!v) {
      setDigits((d) => d.map((x, idx) => (idx === i ? '' : x)))
      return
    }
    const chars = v.slice(0, length - i)
    setDigits((d) => {
      const next = [...d]
      chars.split('').forEach((c, j) => { next[i + j] = c })
      return next
    })
    const target = i + chars.length
    if (target < length) focusIndex(target)
    else inputsRef.current[length - 1]?.blur()
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      e.preventDefault()
      setDigits((d) => d.map((x, idx) => (idx === i - 1 ? '' : x)))
      focusIndex(i - 1)
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    if (locked) return
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    setDigits(Array.from({ length }, (_, j) => text[j] || ''))
    if (text.length < length) focusIndex(text.length)
    else inputsRef.current[length - 1]?.blur()
  }

  const handleConfirm = async () => {
    if (!isComplete || confirming) return
    setConfirming(true); setError('')
    try {
      await onConfirm(code)
    } catch (err) {
      const msg = getErr(err)
      setError(msg)
      if (msg.includes('5 lần') || msg.includes('hết hạn')) {
        setLocked(true)
        setDigits(Array(length).fill(''))
      }
    } finally {
      setConfirming(false)
    }
  }

  const handleResend = async () => {
    if (sending) return
    setSending(true); setError('')
    try {
      await onResend()
      setRemaining(expireSeconds)
      setLocked(false)
      setDigits(Array(length).fill(''))
      focusIndex(0)
    } catch (err) {
      setError(getErr(err))
    } finally {
      setSending(false)
    }
  }

  const mmss = (s) => {
    const m = Math.floor(Math.max(0, s) / 60)
    const ss = Math.max(0, s) % 60
    return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
  }

  return (
    <div
      className={variant === 'page' ? 'otp-page' : 'otp-backdrop'}
      onClick={() => variant !== 'page' && !confirming && !sending && onBack()}
    >
      <div className={variant === 'page' ? 'otp-page-inner' : ''}>
        {variant === 'page' && (
          <button type="button" className="otp-back" onClick={onBack} disabled={confirming || sending}>
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
        )}
        <div className="otp-card" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="otp-close" onClick={onBack} disabled={confirming || sending} aria-label="Đóng">
            <X className="w-4 h-4" />
          </button>

          <div className="otp-icon"><ShieldCheck className="w-6 h-6" /></div>
          <h3 className="otp-title">{title}</h3>
          <p className="otp-sub">Nhập mã 6 chữ số đã gửi đến</p>
          <p className="otp-email">{email}</p>
          {!locked && <p className="otp-hint">Mã có hiệu lực trong {Math.floor(expireSeconds / 60)} phút</p>}

          {locked ? (
            <>
              <p className="otp-locked-title">Bạn đã nhập sai quá 5 lần</p>
              <p className="otp-locked-text">Vui lòng yêu cầu gửi lại mã mới để tiếp tục.</p>
            </>
          ) : (
            <>
              <div className="otp-inputs">
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputsRef.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={length}
                    value={d}
                    disabled={confirming || expired}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={i === 0 ? handlePaste : undefined}
                    className="otp-input"
                  />
                ))}
              </div>
              {expired && (
                <p className="otp-error">Mã đã hết hạn. Vui lòng gửi lại mã mới.</p>
              )}
            </>
          )}

          {error && <p className="otp-error">{error}</p>}

          {!locked && (
            <button type="button" className="otp-btn" onClick={handleConfirm} disabled={!isComplete || confirming || expired}>
              {confirming ? 'Đang xác nhận...' : 'Xác nhận'}
            </button>
          )}

          <div className="otp-footer">
            <span>Không nhận được mã?</span>
            <span className="otp-timer">{mmss(remaining)}</span>
            <button type="button" className="otp-resend" onClick={handleResend} disabled={sending}>
              {sending ? 'Đang gửi...' : 'Gửi lại'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
