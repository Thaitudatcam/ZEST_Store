import { useState, useEffect, useRef } from 'react'
import { getCart, removeCartItem, updateCartItem, clearCart, validateCart } from '../api/cart'
import { useCart } from '../context/CartContext'
import LoadingSpinner from '../components/LoadingSpinner'
import Toast from '../components/Toast'
import { Trash2, ShoppingBag, Plus, Minus, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { VND } from '../components/ProductCard'
import SafeImg from '../components/SafeImg'

export default function Cart() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [selectedItem, setSelectedItem] = useState(null)
  const { refreshCount } = useCart()

  const load = () => getCart().then(setItems).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const activeRef = useRef(true)
  useEffect(() => {
    const checkStock = async () => {
      if (!activeRef.current) return
      try {
        const issues = await validateCart()
        if (issues.length > 0) {
          let changed = false
          for (const issue of issues) {
            if (issue.type === 'insufficient') {
              await updateCartItem(issue.maBienThe, { soLuong: issue.availableStock })
              setItems(prev => prev.map(i =>
                i.maBienThe === issue.maBienThe
                  ? { ...i, soLuong: issue.availableStock, tonKho: issue.availableStock }
                  : i
              ))
              setToast({ message: issue.message, type: 'warning' })
              changed = true
            }
            if (issue.type === 'deleted') {
              changed = true
            }
          }
          if (changed) refreshCount()
        }
      } catch {}
    }

    const handleVisibility = () => { activeRef.current = !document.hidden }
    document.addEventListener('visibilitychange', handleVisibility)

    const timer = setInterval(checkStock, 15000)
    checkStock()

    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  const handleQty = async (vid, delta) => {
    const item = items.find((i) => i.maBienThe === vid)
    const stock = item.tonKho || 999
    const newQty = Math.max(1, Math.min(stock, (item.soLuong || 1) + delta))
    try {
      await updateCartItem(vid, { soLuong: newQty })
      setItems(prev => prev.map(i => i.maBienThe === vid ? { ...i, soLuong: newQty } : i))
      refreshCount()
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Không thể cập nhật số lượng', type: 'error' })
    }
  }

  const handleQtyInput = async (vid, val) => {
    const item = items.find(i => i.maBienThe === vid)
    const stock = item?.tonKho || 999
    const soLuong = Math.max(1, Math.min(stock, val))
    try {
      await updateCartItem(vid, { soLuong })
      setItems(prev => prev.map(i => i.maBienThe === vid ? { ...i, soLuong, thanhTien: i.donGia * soLuong } : i))
      refreshCount()
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Không thể cập nhật số lượng', type: 'error' })
    }
  }

  const handleItemClick = (item) => {
    setSelectedItem(item)
  }

  const handleRemove = async (vid) => {
    try {
      await removeCartItem(vid)
      setItems(prev => { const next = prev.filter(i => i.maBienThe !== vid); setSelectedIds(s => { const n = new Set(s); n.delete(vid); return n }); return next })
      refreshCount()
    } catch { setToast({ message: 'Không thể xóa sản phẩm', type: 'error' }) }
  }

  const handleClear = async () => {
    try {
      await clearCart()
      setItems([])
      setSelectedIds(new Set())
      refreshCount()
    } catch { setToast({ message: 'Không thể xóa giỏ hàng', type: 'error' }) }
  }

  const toggleSelect = (vid) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(vid)) next.delete(vid); else next.add(vid)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map(i => i.maBienThe)))
    }
  }

  const handleCheckout = () => {
    if (selectedIds.size === 0) {
      setToast({ message: 'Vui lòng chọn sản phẩm để thanh toán', type: 'info' })
      return
    }
    navigate('/checkout', { state: { selectedItems: items.filter(i => selectedIds.has(i.maBienThe)) } })
  }

  const groups = items.reduce((acc, i) => {
    const pid = i.maSanPham
    if (!acc[pid]) acc[pid] = { product: i.tenSanPham || `Sản phẩm #${pid}`, variants: [] }
    acc[pid].variants.push(i)
    return acc
  }, {})

  const isProductSelected = (pid) => groups[pid].variants.every(v => selectedIds.has(v.maBienThe))

  const toggleProduct = (pid) => {
    const g = groups[pid]
    const allSel = g.variants.every(v => selectedIds.has(v.maBienThe))
    setSelectedIds(prev => {
      const next = new Set(prev)
      g.variants.forEach(v => { if (allSel) next.delete(v.maBienThe); else next.add(v.maBienThe) })
      return next
    })
  }

  const selectedTotal = items.filter(i => selectedIds.has(i.maBienThe)).reduce((s, i) => s + ((i.donGia || 0) * (i.soLuong || 1)), 0)
  const allSelected = items.length > 0 && selectedIds.size === items.length

  if (loading) return <LoadingSpinner className="py-20" />

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Giỏ hàng ({items.length})</h1>
        {items.length > 0 && <button onClick={handleClear} className="text-sm text-bordeaux hover:underline">Xóa tất cả</button>}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 text-stone animate-fade-in">
          <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-stone" />
          <p className="mb-4">Giỏ hàng trống</p>
          <button onClick={() => navigate('/')} className="text-gold font-semibold hover:underline">Mua sắm ngay</button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 px-1 mb-3 text-sm text-stone">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={allSelected} onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-stone/30 text-gold focus:ring-gold" />
              <span className="font-medium text-ink-soft">Chọn tất cả</span>
            </label>
            <span className="text-stone">|</span>
            <button onClick={() => setSelectedIds(new Set())} className="hover:text-ink-soft">Bỏ chọn</button>
          </div>

          <div className="space-y-4">
            {Object.entries(groups).map(([pid, g]) => {
              const prodSel = isProductSelected(Number(pid))
              return (
                <div key={pid} className={`bg-ivory rounded-xl border overflow-hidden transition-all duration-300 hover:shadow-md ${prodSel ? 'border-gold shadow-sm' : ''}`}>
                  <div className="flex items-center gap-3 px-4 py-3 bg-ivory-100 border-b">
                    <input type="checkbox" checked={prodSel} onChange={() => toggleProduct(Number(pid))}
                      className="w-4 h-4 rounded border-stone/30 text-gold focus:ring-gold shrink-0" />
                    <span className={`font-semibold text-sm ${g.variants.some(v => v.sanPhamTrangThai === 0 || v.sanPhamNgayXoa) ? 'line-through text-stone' : ''}`}>
                      {g.product}
                    </span>
                    {g.variants.some(v => v.sanPhamTrangThai === 0 || v.sanPhamNgayXoa) && (
                      <span className="text-[10px] bg-bordeaux/20 text-bordeaux px-1.5 py-0.5 rounded font-medium">không tồn tại</span>
                    )}
                    <span className="text-xs text-stone ml-auto">{g.variants.length} biến thể</span>
                  </div>
                  <div className="divide-y">
                    {g.variants.map((i, vi) => (
                      <div key={i.maBienThe}
                        className={`flex items-center gap-3 px-4 py-3 transition ${selectedIds.has(i.maBienThe) ? 'bg-gold/10/40' : ''}`}
                        style={{ animationDelay: `${vi * 50}ms` }}>
                        <input type="checkbox" checked={selectedIds.has(i.maBienThe)} onChange={() => toggleSelect(i.maBienThe)}
                          className="w-4 h-4 rounded border-stone/30 text-gold focus:ring-gold shrink-0" />
                        <div className="flex-1 min-w-0 flex items-center gap-2 cursor-pointer" onClick={() => handleItemClick(i)}>
                          <p className={`text-sm min-w-[120px] ${i.ngayXoa ? 'line-through text-stone' : 'text-ink-soft'}`}>
                            {i.mauSac ? `${i.mauSac} / ${i.kichCo || ''}` : (i.kichCo || '')}
                            {i.ngayXoa && <span className="ml-1 text-[10px] bg-bordeaux/20 text-bordeaux px-1.5 py-0.5 rounded font-medium not-italic no-underline">không tồn tại</span>}
                          </p>
                          <p className="text-gold font-semibold text-sm">{VND(i.donGia || 0)}</p>
                        </div>
                        <div className="flex items-center border rounded-lg">
                          <button onClick={() => handleQty(i.maBienThe, -1)} disabled={i.soLuong <= 1 || i.ngayXoa}
                            className="px-2 py-1 hover:bg-ivory-100 transition active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"><Minus className="h-3 w-3" /></button>
                          <input type="number" value={i.soLuong || 1} min={1} max={i.tonKho || 999} disabled={!!i.ngayXoa}
                            onChange={e => { const v = parseInt(e.target.value); if (!v || v < 1) return; setItems(prev => prev.map(x => x.maBienThe === i.maBienThe ? { ...x, soLuong: Math.min(v, i.tonKho || 999) } : x)) }}
                            onBlur={e => { const v = parseInt(e.target.value); if (!v || v < 1) handleQtyInput(i.maBienThe, 1); else handleQtyInput(i.maBienThe, v) }}
                            className="w-10 px-1 py-1 border-x text-center text-xs outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:bg-ivory-100 disabled:cursor-not-allowed" />
                          <button onClick={() => handleQty(i.maBienThe, 1)} disabled={i.soLuong >= (i.tonKho || 999) || i.ngayXoa}
                            className="px-2 py-1 hover:bg-ivory-100 transition active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"><Plus className="h-3 w-3" /></button>
                        </div>
                        {i.tonKho !== undefined && <span className="text-[10px] text-stone w-12 text-right">Kho: {i.tonKho}</span>}
                        <button onClick={() => handleRemove(i.maBienThe)} className="text-bordeaux hover:text-bordeaux transition active:scale-90"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 bg-ivory rounded-xl border p-6 transition-all duration-300 hover:shadow-md">
            <div className="flex justify-between text-sm text-stone mb-1">
              <span>Đã chọn: <strong>{selectedIds.size}</strong> sản phẩm</span>
              <span>Tạm tính: <strong className="text-gold">{VND(selectedTotal)}</strong></span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-3 mt-2">
              <span>Tổng cộng ({selectedIds.size} sản phẩm):</span>
              <span className="text-gold">{VND(selectedTotal)}</span>
            </div>
            <button onClick={handleCheckout}
              className="mt-4 block w-full bg-gold text-noir text-center font-semibold py-3 rounded-lg hover:bg-gold-hover transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={selectedIds.size === 0 || items.some(i => selectedIds.has(i.maBienThe) && (i.ngayXoa || i.sanPhamTrangThai === 0 || i.sanPhamNgayXoa))}>
              Thanh toán ({selectedIds.size} sản phẩm)
            </button>
          </div>
        </>
      )}

      {selectedItem && (() => {
        const i = selectedItem
        return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4" onClick={() => setSelectedItem(null)}>
          <div className="bg-ivory rounded-2xl max-w-lg w-full animate-scale-in shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="relative">
              <img src={i.urlAnh} alt={i.tenSanPham} className="w-full h-72 object-cover object-center bg-ivory-100"
                onError={(e) => { e.target.src = 'https://placehold.co/600x400/e2e8f0/475569?text=Polo' }} />
              <button onClick={() => setSelectedItem(null)} className="absolute top-3 right-3 bg-ivory/90 rounded-full p-1.5 hover:bg-ivory transition shadow-sm">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <h3 className="font-bold text-lg">{i.tenSanPham || 'Sản phẩm'}</h3>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gold font-bold text-xl">{VND(i.donGia || 0)}</span>
                <span className="text-stone">x{i.soLuong}</span>
                <span className="text-stone font-semibold">= {VND((i.donGia || 0) * (i.soLuong || 1))}</span>
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                {i.mauSac && (
                  <span className="bg-ivory-100 px-3 py-1 rounded-full text-ink-soft">
                    Màu: <span className="font-medium">{i.mauSac}</span>
                  </span>
                )}
                {i.kichCo && (
                  <span className="bg-ivory-100 px-3 py-1 rounded-full text-ink-soft">
                    Size: <span className="font-medium">{i.kichCo}</span>
                  </span>
                )}
                <span className="bg-ivory-100 px-3 py-1 rounded-full text-ink-soft">
                  Kho: <span className="font-medium">{i.tonKho ?? '—'}</span>
                </span>
              </div>
              {(i.slug || i.maSanPham) && (
                <a href={`/products/${i.slug || i.maSanPham}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-gold font-medium hover:underline mt-1">
                  Xem chi tiết sản phẩm →
                </a>
              )}
            </div>
          </div>
        </div>
      )})()}

    </div>
  )
}
