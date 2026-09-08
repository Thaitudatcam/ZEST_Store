import { useEffect, useState } from 'react'
import { CheckCircle, X } from 'lucide-react'

export default function POSToast({ message, type = 'success', onClose, duration = 3000 }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onClose, 300) }, duration)
    return () => clearTimeout(t)
  }, [duration, onClose])

  const bg = type === 'error' ? 'bg-bordeaux text-white' : 'bg-emerald-deep text-white'

  return (
    <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl transition-all duration-300 ${bg} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <CheckCircle className="h-5 w-5 shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={() => { setVisible(false); setTimeout(onClose, 300) }} className="ml-2 opacity-70 hover:opacity-100 transition">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
