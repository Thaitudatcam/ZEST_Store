import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, X } from 'lucide-react'
import SafeImg from './SafeImg'

export default function CartAddedToast({ product, variant, qty, imageUrl, onClose }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setShow(true))
    const t = setTimeout(() => { setShow(false); setTimeout(onClose, 300) }, 5000)
    return () => clearTimeout(t)
  }, [])

  const size = variant?.kichCo?.kichCo || ''
  const color = variant?.mauSac?.mauSac || ''
  const detail = [size && `Size: ${size}`, color && `Màu: ${color}`].filter(Boolean).join(', ')

  return (
    <div className={`fixed top-20 right-4 sm:right-6 z-[999] w-[calc(100%-2rem)] max-w-[380px] transition-all duration-300 ${show ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-8 opacity-0 scale-95'}`}>
      <div className="relative flex items-start gap-3 overflow-hidden rounded-2xl border border-noir/10 bg-ivory/95 px-4 py-3.5 shadow-[0_16px_40px_rgba(15,15,18,0.22)] backdrop-blur-md">
        {/* Accent bar */}
        <div className="absolute bottom-0 left-0 top-0 w-1 bg-emerald-deep" />

        {/* Product image */}
        <div className="mt-0.5 w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-ivory-100">
          <SafeImg src={imageUrl} alt="" className="w-full h-full object-cover" fallback="https://placehold.co/80x80/e2e8f0/475569?text=P" />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <ShoppingCart className="h-4 w-4 text-emerald-deep shrink-0" />
            <p className="text-sm font-bold text-emerald-deep">ĐÃ THÊM VÀO GIỎ HÀNG</p>
          </div>
          <p className="mt-1 text-sm font-semibold text-ink truncate">
            Đã thêm {qty > 1 ? `${qty}x ` : ''}"{product?.tenSanPham || 'Sản phẩm'}"
          </p>
          {detail && <p className="text-xs text-stone mt-0.5">({detail})</p>}

          {/* Buttons */}
          <div className="flex gap-2 mt-3">
            <Link to="/cart" onClick={() => { setShow(false); setTimeout(onClose, 300) }}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[var(--primary-color)] text-white text-xs font-bold py-2.5 rounded-xl hover:opacity-90 transition">
              <ShoppingCart className="h-3.5 w-3.5" /> XEM GIỎ HÀNG
            </Link>
            <button onClick={() => { setShow(false); setTimeout(onClose, 300) }}
              className="flex-1 flex items-center justify-center gap-1.5 border-2 border-[var(--primary-color)] text-[var(--primary-color)] text-xs font-bold py-2.5 rounded-xl hover:bg-[var(--primary-color)]/5 transition">
              TIẾP TỤC MUA
            </button>
          </div>
        </div>

        {/* Close */}
        <button onClick={() => { setShow(false); setTimeout(onClose, 300) }}
          className="-mr-1 rounded-lg p-1 text-stone hover:bg-noir/5 hover:text-noir transition" aria-label="Đóng">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
