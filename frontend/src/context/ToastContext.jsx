import { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'

const typeMap = {
  success: { icon: CheckCircle, label: 'Thành công', iconWrap: 'bg-emerald-deep/12 text-emerald-deep', accent: 'bg-emerald-deep' },
  error: { icon: XCircle, label: 'Có lỗi xảy ra', iconWrap: 'bg-bordeaux/12 text-bordeaux', accent: 'bg-bordeaux' },
  info: { icon: Info, label: 'Thông báo', iconWrap: 'bg-gold/15 text-gold', accent: 'bg-gold' },
  warning: { icon: AlertTriangle, label: 'Lưu ý', iconWrap: 'bg-amber-100 text-amber-700', accent: 'bg-amber-500' },
}

const MAX_TOASTS = 3

const ToastContext = createContext(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)))
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 300)
  }, [])

  const addToast = useCallback((message, type = 'info', duration = 5000, action = null) => {
    const id = ++idRef.current
    setToasts((prev) => {
      const next = [...prev, { id, message, type, duration, action }]
      return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next
    })
    setTimeout(() => removeToast(id), duration)
  }, [removeToast])

  const toast = useMemo(() => ({
    success: (msg, dur, action) => addToast(msg, 'success', dur, action),
    error: (msg, dur, action) => addToast(msg, 'error', dur, action),
    info: (msg, dur, action) => addToast(msg, 'info', dur, action),
    warning: (msg, dur, action) => addToast(msg, 'warning', dur, action),
  }), [addToast])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-24 right-4 sm:right-6 z-[999] flex w-[calc(100%-2rem)] max-w-[380px] flex-col gap-3 pointer-events-none">
        {toasts.map((t) => {
          const cfg = typeMap[t.type] || typeMap.info
          const Icon = cfg.icon
          return (
            <div key={t.id} className={`pointer-events-auto transition-all duration-300 ease-out ${t.leaving ? 'translate-x-8 -translate-y-1 opacity-0 scale-95' : 'translate-x-0 opacity-100 scale-100'}`}>
              <div className="relative flex items-start gap-3 overflow-hidden rounded-2xl border border-noir/10 bg-ivory/95 px-4 py-3.5 shadow-[0_16px_40px_rgba(15,15,18,0.22)] backdrop-blur-md">
                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${cfg.iconWrap}`}><Icon className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1 pr-1"><p className="text-sm font-bold text-noir">{cfg.label}</p><p className="mt-0.5 text-sm leading-5 text-stone">{t.message}</p></div>
                {t.action && (
                  <button onClick={() => { t.action.onClick?.(); removeToast(t.id) }}
                    className="text-sm font-bold shrink-0 text-gold hover:text-noir transition">
                    {t.action.label}
                  </button>
                )}
                <button onClick={() => removeToast(t.id)} className="-mr-1 rounded-lg p-1 text-stone hover:bg-noir/5 hover:text-noir shrink-0 transition" aria-label="Đóng thông báo">
                  <X className="h-4 w-4" />
                </button>
                <div className={`absolute bottom-0 left-0 top-0 w-1 ${cfg.accent}`} />
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
