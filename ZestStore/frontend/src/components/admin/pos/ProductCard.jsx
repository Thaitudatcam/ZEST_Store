import { useState } from 'react'
import { Plus, Minus, Check } from 'lucide-react'
import SafeImg from '../../../components/SafeImg'

const VND = (n) => { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }

export default function ProductCard({ variant, mode = 'grid', onAdd, onQtyChange, cartQty = 0 }) {
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    onAdd?.(variant)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const img = variant.urlAnhDaiDien || variant.urlAnh || ''
  const name = variant.tenSanPham || ''
  const color = variant.mauSac || ''
  const size = variant.kichCo || ''
  const sku = variant.sku || variant.maCTSP || ''
  const gia = Number(variant.gia) || 0
  const giaNhap = Number(variant.giaNhap) || 0
  const ton = variant.tonKho ?? 0

  const isSale = giaNhap > 0 && gia < giaNhap

  if (mode === 'modal') {
    return (
      <div data-testid={`product-card-${sku || 'unknown'}`} className={`flex items-center gap-3 bg-white rounded-xl border p-3 transition-all relative ${cartQty > 0 ? 'border-[var(--primary-color)] ring-1 ring-[var(--primary-color)]/20' : 'border-stone/10 hover:border-stone/20 hover:shadow-sm'}`}>
        <div className="w-14 h-14 rounded-lg overflow-hidden bg-ivory-100 shrink-0">
          <SafeImg src={img} className="w-full h-full object-cover" fallback="https://placehold.co/100x100/e2e8f0/475569?text=P" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-ink truncate">{name}</p>
          <p className="text-[11px] text-stone mt-0.5">
            Màu <span className="font-medium text-ink-soft">{color}</span> | Kích cỡ <span className="font-medium text-ink-soft">{size}</span>
          </p>
          <p className="text-[11px] text-stone">Mã: <span className="font-mono font-medium text-ink-soft">{sku}</span></p>
          <p className="text-[11px] text-stone">Kho: <span className={`font-semibold ${ton > 0 ? 'text-emerald-deep' : 'text-bordeaux'}`}>{ton}</span></p>
          <div className="flex items-center gap-2 mt-1">
            {isSale && <span className="text-[11px] text-stone line-through">{VND(giaNhap)}</span>}
            <span className="text-sm font-bold text-[var(--primary-color)]">{VND(gia)}</span>
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          {cartQty > 0 ? (
            <>
              <div className="flex items-center gap-1.5 text-emerald-deep">
                <Check className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold">Đã thêm</span>
              </div>
              <div className="flex items-center gap-1 bg-[var(--primary-bg)] rounded-lg px-1">
                <button onClick={() => onQtyChange?.(variant, -1)} className="p-1 text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10 rounded transition" aria-label="Giảm">
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center text-xs font-bold text-[var(--primary-color)]">{cartQty}</span>
                <button onClick={() => onQtyChange?.(variant, 1)} className="p-1 text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10 rounded transition" aria-label="Tăng">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <button onClick={() => onQtyChange?.(variant, -cartQty)}
                className="text-[10px] font-medium text-bordeaux hover:underline transition">
                Xóa
              </button>
            </>
          ) : (
            <button onClick={handleAdd} disabled={ton <= 0}
              className="px-3 py-1.5 bg-[var(--primary-color)] text-white text-xs font-semibold rounded-lg hover:bg-[var(--primary-hover)] transition disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap">
              Thêm vào giỏ
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div data-testid={`product-card-${sku || 'unknown'}`} className="bg-white rounded-xl border border-stone/10 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group relative">
      <div className="aspect-square bg-ivory-100 overflow-hidden relative">
        <SafeImg src={img} alt={name}
          className={`w-full h-full object-cover group-hover:scale-105 transition duration-500 ${ton <= 0 ? 'opacity-50 grayscale' : ''}`}
          fallback="https://placehold.co/200x200/e2e8f0/475569?text=P" />
        {ton <= 0 && <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white font-bold text-sm">Hết hàng</span>}
        {isSale && <span className="absolute top-2 left-2 px-2 py-0.5 bg-bordeaux text-white text-[10px] font-bold rounded-full">GIẢM</span>}
        {cartQty > 0 && (
          <span className="absolute top-2 right-2 w-6 h-6 bg-[var(--primary-color)] text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md">{cartQty}</span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm text-ink truncate">{name}</h3>
        <p className="text-[11px] text-stone mt-0.5">{color} {size ? `- ${size}` : ''}</p>
        <p className="text-[10px] text-stone font-mono mt-0.5">CTSP: {variant.maCTSP || sku || '—'}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-bold text-[var(--primary-color)]">{VND(gia)}</span>
          {cartQty > 0 ? (
            <div className="flex items-center gap-1 bg-[var(--primary-bg)] rounded-lg px-1">
              <button onClick={() => onQtyChange?.(variant, -1)} className="p-1 text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10 rounded" aria-label="Giảm">
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-5 text-center text-xs font-bold text-[var(--primary-color)]">{cartQty}</span>
              <button onClick={() => onQtyChange?.(variant, 1)} className="p-1 text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10 rounded" aria-label="Tăng">
                <Plus className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button onClick={handleAdd} disabled={ton <= 0}
              className="px-3 py-1.5 bg-[var(--primary-color)] text-white text-xs font-semibold rounded-lg hover:bg-[var(--primary-hover)] transition disabled:opacity-40"
              aria-label={`Thêm ${name} vào giỏ`}>
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
