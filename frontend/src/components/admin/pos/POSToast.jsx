import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

export default function POSToast({ message, type = 'success', onClose, duration = 3000 }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onClose, 300) }, duration)
    return () => clearTimeout(t)
  }, [duration, onClose])

  const isError = type === 'error'
  const Icon = isError ? XCircle : CheckCircle

  return (
    <div className={`fixed bottom-6 right-4 sm:right-6 z-[200] flex w-[calc(100%-2rem)] max-w-[380px] items-start gap-3 overflow-hidden rounded-2xl border border-noir/10 bg-ivory/95 px-4 py-3.5 shadow-[0_16px_40px_rgba(15,15,18,0.22)] backdrop-blur-md transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isError ? 'bg-bordeaux/12 text-bordeaux' : 'bg-emerald-deep/12 text-emerald-deep'}`}><Icon className="h-5 w-5" /></div>
      <div className="flex-1"><p className="text-sm font-bold text-noir">{isError ? 'Có lỗi xảy ra' : 'Thành công'}</p><p className="mt-0.5 text-sm text-stone">{message}</p></div>
      <button onClick={() => { setVisible(false); setTimeout(onClose, 300) }} className="-mr-1 rounded-lg p-1 text-stone hover:bg-noir/5 hover:text-noir transition" aria-label="Đóng thông báo">
        <X className="h-4 w-4" />
      </button>
      <div className={`absolute bottom-0 left-0 top-0 w-1 ${isError ? 'bg-bordeaux' : 'bg-emerald-deep'}`} />
    </div>
  )
}
