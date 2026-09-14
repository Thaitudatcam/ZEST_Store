import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

const typeMap = {
  success: { bg: 'bg-emerald-deep/5 border-emerald-deep/30', icon: CheckCircle, color: 'text-emerald-deep' },
  error: { bg: 'bg-bordeaux/5 border-bordeaux/30', icon: XCircle, color: 'text-bordeaux' },
  info: { bg: 'bg-gold-50 border-gold/30', icon: Info, color: 'text-gold-dark' },
}

export default function Toast({ message, type = 'info', onClose }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setShow(true))
    const t = setTimeout(() => { setShow(false); setTimeout(onClose, 300) }, 3000)
    return () => clearTimeout(t)
  }, [])

  const cfg = typeMap[type] || typeMap.info
  const Icon = cfg.icon

  return (
    <div className={`fixed top-5 right-5 z-[999] transition-all duration-300 ${show ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lux ${cfg.bg} min-w-[280px] max-w-sm`}>
        <Icon className={`h-5 w-5 shrink-0 ${cfg.color}`} />
        <span className="text-sm text-ink flex-1">{message}</span>
        <button onClick={() => { setShow(false); setTimeout(onClose, 300) }} className="text-stone hover:text-ink">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
