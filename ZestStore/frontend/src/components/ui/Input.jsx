/**
 * Input — ivory field with gold focus ring and optional leading icon.
 * Designed for the luxury fashion forms (auth, profile, checkout).
 */
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function Input({
  icon: Icon,
  type = 'text',
  className = '',
  containerClassName = '',
  ...props
}) {
  const [show, setShow] = useState(false)
  const isPw = type === 'password'
  const inputType = isPw ? (show ? 'text' : 'password') : type

  return (
    <div className={`relative ${containerClassName}`}>
      {Icon && (
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone pointer-events-none" />
      )}
      <input
        type={inputType}
        className={`w-full border border-noir-600/15 bg-white/70 rounded-xl px-3.5 py-3 text-sm text-ink placeholder-stone focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold focus:bg-white transition-all duration-200 ${Icon ? 'pl-10' : ''} ${isPw ? 'pr-10' : ''} ${className}`}
        {...props}
      />
      {isPw && (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone hover:text-gold transition-colors"
          aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      )}
    </div>
  )
}
