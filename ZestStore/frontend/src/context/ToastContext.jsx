import { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'

const typeMap = {
  success: { bg: 'bg-emerald-deep/10 border-emerald-deep/20', icon: CheckCircle, color: 'text-emerald-deep', bar: 'bg-emerald-deep' },
  error: { bg: 'bg-bordeaux/10 border-bordeaux/20', icon: XCircle, color: 'text-bordeaux', bar: 'bg-bordeaux' },
  info: { bg: 'bg-gold/10 border-gold/20', icon: Info, color: 'text-gold', bar: 'bg-gold' },
  warning: { bg: 'bg-gold/10 border-gold/20', icon: AlertTriangle, color: 'text-gold', bar: 'bg-gold' },
}

const MAX_TOASTS = 3

const ToastContext = createContext(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

function ProgressBar({ duration, leaving }) {
  const [width, setWidth] = useState(100)
  const startRef = useRef(Date.now())

  useEffect(() => {
    if (leaving) { setWidth(0); return }
    startRef.current = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startRef.current
      const pct = Math.max(0, 100 - (elapsed / duration) * 100)
      setWidth(pct)
      if (pct <= 0) clearInterval(interval)
    }, 50)
    return () => clearInterval(interval)
  }, [duration, leaving])

  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-ivory-100 rounded-b-xl overflow-hidden">
      <div className={`h-full transition-all duration-100 ease-linear rounded-b-xl ${width > 0 ? '' : ''}`}
        style={{ width: `${width}%`, backgroundColor: 'currentColor' }} />
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)))
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 300)
  }, [])

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = ++idRef.current
    setToasts((prev) => {
      const next = [...prev, { id, message, type, duration }]
      return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next
    })
    setTimeout(() => removeToast(id), duration)
  }, [removeToast])

  const toast = useMemo(() => ({
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
  }), [addToast])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => {
          const cfg = typeMap[t.type] || typeMap.info
          const Icon = cfg.icon
          return (
            <div key={t.id} className={`pointer-events-auto transition-all duration-300 ${t.leaving ? 'translate-x-10 opacity-0' : 'translate-x-0 opacity-100'}`}>
              <div className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${cfg.bg} min-w-[280px] max-w-sm overflow-hidden`}>
                <Icon className={`h-5 w-5 shrink-0 ${cfg.color}`} />
                <span className="text-sm text-ink flex-1">{t.message}</span>
                <button onClick={() => removeToast(t.id)} className="text-stone hover:text-ink-soft shrink-0">
                  <X className="h-4 w-4" />
                </button>
                <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-xl overflow-hidden`}>
                  <div className={`h-full rounded-b-xl ${cfg.bar} ${t.leaving ? 'w-0' : ''}`}
                    style={{ transition: `width ${t.duration}ms linear`, width: t.leaving ? '0%' : '100%' }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
