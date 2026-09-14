import { Loader } from 'lucide-react'

export default function ConfirmDialog({
  open,
  title = 'Xác nhận',
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  const btnClass = variant === 'gold'
    ? 'bg-gold text-noir hover:bg-gold-hover'
    : 'bg-bordeaux text-noir hover:bg-bordeaux'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onCancel}>
      <div className="bg-ivory rounded-2xl max-w-sm w-full mx-4 p-6 animate-scale-in shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        <div className="text-sm text-stone mb-5">{message}</div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 border rounded-xl text-sm font-medium hover:bg-ivory-100 transition">Hủy</button>
          <button onClick={onConfirm} disabled={loading} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 ${btnClass}`}>
            {loading ? <Loader className="h-4 w-4 animate-spin mx-auto" /> : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
