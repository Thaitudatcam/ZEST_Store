import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'

const typeMap = {
  success: { icon: CheckCircle, label: 'Thành công', iconWrap: 'bg-emerald-deep/12 text-emerald-deep', accent: 'bg-emerald-deep' },
  error: { icon: XCircle, label: 'Có lỗi xảy ra', iconWrap: 'bg-bordeaux/12 text-bordeaux', accent: 'bg-bordeaux' },
  info: { icon: Info, label: 'Thông báo', iconWrap: 'bg-gold/15 text-gold', accent: 'bg-gold' },
  warning: { icon: AlertTriangle, label: 'Lưu ý', iconWrap: 'bg-amber-100 text-amber-700', accent: 'bg-amber-500' },
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
    <div className={`fixed top-24 right-4 sm:right-6 z-[999] w-[calc(100%-2rem)] max-w-[380px] transition-all duration-300 ${show ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-8 opacity-0 scale-95'}`}>
      <div className="relative flex items-start gap-3 overflow-hidden rounded-2xl border border-noir/10 bg-ivory/95 px-4 py-3.5 shadow-[0_16px_40px_rgba(15,15,18,0.22)] backdrop-blur-md">
        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${cfg.iconWrap}`}><Icon className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1"><p className="text-sm font-bold text-noir">{cfg.label}</p><p className="mt-0.5 text-sm leading-5 text-stone">{message}</p></div>
        <button onClick={() => { setShow(false); setTimeout(onClose, 300) }} className="-mr-1 rounded-lg p-1 text-stone hover:bg-noir/5 hover:text-noir transition" aria-label="Đóng thông báo">
          <X className="h-4 w-4" />
        </button>
        <div className={`absolute bottom-0 left-0 top-0 w-1 ${cfg.accent}`} />
      </div>
    </div>
  )
}
