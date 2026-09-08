import { useState, useEffect, useRef } from 'react'
import { X, Search, Filter } from 'lucide-react'
import ProductCard from './ProductCard'

export default function AddProductModal({ open, onClose, variants, colors, sizes, cart, onAdd, onQtyChange }) {
  const [search, setSearch] = useState('')
  const [filterColor, setFilterColor] = useState('')
  const [filterSize, setFilterSize] = useState('')
  const searchRef = useRef(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 200)
      setSearch('')
      setFilterColor('')
      setFilterSize('')
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const filtered = variants.filter(v => {
    if (search) {
      const q = search.toLowerCase()
      if (!(v.tenSanPham || '').toLowerCase().includes(q) && !(v.sku || '').toLowerCase().includes(q)) return false
    }
    if (filterColor && v.mauSac !== filterColor) return false
    if (filterSize && v.kichCo !== filterSize) return false
    return true
  })

  const getCartQty = (v) => cart.filter(c => c.maBienThe === v.maBienThe).reduce((s, c) => s + c.soLuong, 0)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose} role="dialog" aria-modal="true" aria-label="Thêm sản phẩm vào giỏ hàng">
      <div className="bg-ivory rounded-2xl w-full max-w-[820px] mx-4 max-h-[85vh] flex flex-col shadow-2xl animate-scale-in"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone/10">
          <h2 className="text-lg font-bold text-ink">Thêm sản phẩm vào giỏ hàng</h2>
          <button onClick={onClose} className="p-2 text-stone hover:text-ink hover:bg-ivory-100 rounded-xl transition" aria-label="Đóng">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-stone/10">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
              <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Tìm theo tên sản phẩm, mã vạch..."
                className="w-full pl-10 pr-4 py-2.5 border border-stone/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent bg-white"
                onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }} />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-stone" />
              <select value={filterColor} onChange={e => setFilterColor(e.target.value)}
                className="border border-stone/20 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]">
                <option value="">Chọn màu sắc</option>
                {colors.map(c => <option key={c.maMauSac || c} value={c.mauSac || c}>{c.mauSac || c}</option>)}
              </select>
              <select value={filterSize} onChange={e => setFilterSize(e.target.value)}
                className="border border-stone/20 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]">
                <option value="">Chọn kích cỡ</option>
                {sizes.map(s => <option key={s.maKichCo || s} value={s.kichCo || s}>{s.kichCo || s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-stone">
              <p className="text-sm">Không tìm thấy sản phẩm phù hợp</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filtered.map(v => (
                <ProductCard key={v.maBienThe || v.sku} variant={v} mode="modal"
                  cartQty={getCartQty(v)} onAdd={onAdd} onQtyChange={onQtyChange} />
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-stone/10">
          <button onClick={onClose}
            className="w-full py-2.5 border border-stone/20 rounded-xl text-sm font-semibold text-stone hover:bg-ivory-100 transition">
            Đóng lại
          </button>
        </div>
      </div>
    </div>
  )
}
