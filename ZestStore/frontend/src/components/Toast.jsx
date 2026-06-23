import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

const typeMap = {
  success: { bg: 'bg-green-50 border-green-300', icon: CheckCircle, color: 'text-green-600' },
  error: { bg: 'bg-red-50 border-red-300', icon: XCircle, color: 'text-red-600' },
  info: { bg: 'bg-blue-50 border-blue-300', icon: Info, color: 'text-blue-600' },
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
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${cfg.bg} min-w-[280px] max-w-sm`}>
        <Icon className={`h-5 w-5 shrink-0 ${cfg.color}`} />
        <span className="text-sm text-gray-800 flex-1">{message}</span>
        <button onClick={() => { setShow(false); setTimeout(onClose, 300) }} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
