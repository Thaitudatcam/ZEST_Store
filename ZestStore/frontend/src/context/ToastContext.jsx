import { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

const typeMap = {
  success: { bg: 'bg-green-50 border-green-300', icon: CheckCircle, color: 'text-green-600' },
  error: { bg: 'bg-red-50 border-red-300', icon: XCircle, color: 'text-red-600' },
  info: { bg: 'bg-blue-50 border-blue-300', icon: Info, color: 'text-blue-600' },
}

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

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++idRef.current
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => removeToast(id), duration)
  }, [removeToast])

  const toast = useMemo(() => ({
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
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
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${cfg.bg} min-w-[280px] max-w-sm`}>
                <Icon className={`h-5 w-5 shrink-0 ${cfg.color}`} />
                <span className="text-sm text-gray-800 flex-1">{t.message}</span>
                <button onClick={() => removeToast(t.id)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
