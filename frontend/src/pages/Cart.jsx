import { useState, useEffect, useRef } from 'react'
import { getCart, removeCartItem, updateCartItem, clearCart, validateCart } from '../api/cart'
import { useCart } from '../context/CartContext'
import LoadingSpinner from '../components/LoadingSpinner'
import Toast from '../components/Toast'
import { Trash2, ShoppingBag, Plus, Minus, X, ShieldCheck, RotateCcw, Tag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { VND } from '../components/ProductCard'
import SafeImg from '../components/SafeImg'
import ConfirmDialog from '../components/ConfirmDialog'

const STEPS = [
  { label: 'Giỏ hàng', active: true },
  { label: 'Thanh toán', active: false },
  { label: 'Hoàn tất', active: false },
]

export default function Cart() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [selectedItem, setSelectedItem] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
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

  const handleRemove = async (vid) => {
    setConfirmAction(null)
    try {
      await removeCartItem(vid)
      setItems(prev => { const next = prev.filter(i => i.maBienThe !== vid); setSelectedIds(s => { const n = new Set(s); n.delete(vid); return n }); return next })
      refreshCount()
    } catch { setToast({ message: 'Không thể xóa sản phẩm', type: 'error' }) }
  }

  const handleClear = async () => {
    setConfirmAction(null)
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

  const selectedTotal = items.filter(i => selectedIds.has(i.maBienThe)).reduce((s, i) => s + ((i.donGia || 0) * (i.soLuong || 1)), 0)
  const allSelected = items.length > 0 && selectedIds.size === items.length

  if (loading) return <LoadingSpinner className="py-20" />

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((step, idx) => (
          <div key={step.label} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 ${step.active ? 'text-[var(--primary-color)]' : 'text-stone'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step.active ? 'bg-[var(--primary-color)] text-white' : 'bg-stone/15 text-stone'
              }`}>
                {idx + 1}
              </div>
              <span className={`text-sm font-semibold ${step.active ? 'text-[var(--primary-color)]' : 'text-stone'}`}>{step.label}</span>
            </div>
            {idx < STEPS.length - 1 && <div className="w-10 h-px bg-stone/20 mx-1" />}
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 text-stone animate-fade-in">
          <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-stone" />
          <p className="mb-4">Giỏ hàng trống</p>
          <button onClick={() => navigate('/')} className="text-[var(--primary-color)] font-semibold hover:underline">Mua sắm ngay</button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Cart Items */}
          <div className="flex-1">
            {/* Free Ship Banner */}

            {/* Trust */}
            <div className="bg-ivory rounded-xl border border-stone/10 p-4 mb-5">
              <p className="text-sm font-semibold text-ink mb-1.5">An tâm mua sắm hàng chính hàng tại <span className="text-[var(--primary-color)]">BeeStylish.vn</span></p>
              <ul className="text-xs text-stone space-y-0.5">
                <li>Được kiểm tra hàng trước khi thanh toán & hài lòng</li>
                <li>Được đổi trả trong 15 ngày theo chính sách (*)</li>
              </ul>
            </div>

            {/* Cart Header */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-ink uppercase">Giỏ hàng ({items.length} sản phẩm)</h2>
              {items.length > 1 && (
                <label className="flex items-center gap-2 cursor-pointer text-sm text-stone">
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-stone/30 text-[var(--primary-color)] focus:ring-[var(--primary-color)]" />
                  Chọn tất cả
                </label>
              )}
            </div>

            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-[1fr_120px_120px_110px_40px] gap-3 px-4 py-2 text-xs font-semibold text-stone uppercase tracking-wide border-b border-stone/15">
              <span>Tên hàng</span>
              <span className="text-center">Giá</span>
              <span className="text-center">Số lượng</span>
              <span className="text-right">Tổng tiền</span>
              <span />
            </div>

            {/* Cart Items */}
            <div className="divide-y divide-stone/10 border-b border-stone/15">
              {items.map((i) => (
                <div key={i.maBienThe}
                  className={`grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_120px_120px_110px_40px] gap-3 sm:gap-3 items-center px-4 py-4 transition ${
                    i.ngayXoa ? 'opacity-50' : ''
                  }`}>
                  {/* Checkbox + Image + Info */}
                  <div className="flex items-center gap-3 col-span-1 sm:col-span-1">
                    <input type="checkbox" checked={selectedIds.has(i.maBienThe)} onChange={() => toggleSelect(i.maBienThe)}
                      className="w-4 h-4 rounded border-stone/30 text-[var(--primary-color)] focus:ring-[var(--primary-color)] shrink-0" />
                    <div className="w-16 h-16 bg-ivory-100 rounded-lg overflow-hidden shrink-0 cursor-pointer" onClick={() => !i.ngayXoa && setSelectedItem(i)}>
                      <SafeImg src={i.urlAnh} alt="" className="w-full h-full object-cover" fallback="https://placehold.co/80x80/e2e8f0/475569?text=P" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{i.tenSanPham || `Sản phẩm #${i.maSanPham}`}</p>
                      <p className="text-[11px] text-stone">Mã sản phẩm: {i.maSanPhamCode || i.sku || '—'}</p>
                      {i.kichCo && <p className="text-xs text-stone">Kích thước: <span className="font-medium text-ink">{i.kichCo}</span></p>}
                      {i.mauSac && <p className="text-xs text-stone">Màu sắc: <span className="font-medium text-ink">{i.mauSac}</span></p>}
                      {i.ngayXoa && <span className="text-[10px] bg-bordeaux/20 text-bordeaux px-1.5 py-0.5 rounded font-medium">không tồn tại</span>}
                    </div>
                  </div>

                  {/* Giá */}
                  <div className="hidden sm:flex flex-col items-center text-center">
                    <span className="text-sm font-bold text-[var(--primary-color)]">{VND(i.donGia || 0)}</span>
                    {i.giaGoc && Number(i.giaGoc) > Number(i.donGia) && (
                      <span className="text-[11px] text-stone line-through">{VND(i.giaGoc)}</span>
                    )}
                  </div>
                  {/* Giá - Mobile */}
                  <div className="flex sm:hidden items-center gap-2 ml-16">
                    <span className="text-sm font-bold text-[var(--primary-color)]">{VND(i.donGia || 0)}</span>
                    {i.giaGoc && Number(i.giaGoc) > Number(i.donGia) && (
                      <span className="text-[11px] text-stone line-through">{VND(i.giaGoc)}</span>
                    )}
                  </div>

                  {/* Số lượng */}
                  <div className="hidden sm:flex justify-center">
                    <div className="flex items-center border border-stone/20 rounded-lg overflow-hidden">
                      <button onClick={() => handleQty(i.maBienThe, -1)} disabled={i.soLuong <= 1 || i.ngayXoa}
                        className="px-2.5 py-1.5 hover:bg-ivory-100 transition disabled:opacity-30 disabled:cursor-not-allowed">
                        <Minus className="h-3 w-3" />
                      </button>
                      <input type="number" value={i.soLuong || 1} min={1} max={i.tonKho || 999} disabled={!!i.ngayXoa}
                        onChange={e => { const v = parseInt(e.target.value); if (!v || v < 1) return; setItems(prev => prev.map(x => x.maBienThe === i.maBienThe ? { ...x, soLuong: Math.min(v, i.tonKho || 999) } : x)) }}
                        onBlur={e => { const v = parseInt(e.target.value); if (!v || v < 1) handleQtyInput(i.maBienThe, 1); else handleQtyInput(i.maBienThe, v) }}
                        className="w-10 px-1 py-1.5 border-x border-stone/20 text-center text-xs font-semibold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:bg-ivory-100" />
                      <button onClick={() => handleQty(i.maBienThe, 1)} disabled={i.soLuong >= (i.tonKho || 999) || i.ngayXoa}
                        className="px-2.5 py-1.5 hover:bg-ivory-100 transition disabled:opacity-30 disabled:cursor-not-allowed">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Tổng tiền */}
                  <div className="hidden sm:flex justify-end">
                    <span className="text-sm font-bold text-ink">{VND((i.donGia || 0) * (i.soLuong || 1))}</span>
                  </div>

                  {/* Xóa */}
                  <div className="hidden sm:flex justify-center">
                    <button onClick={() => setConfirmAction(i.maBienThe)} className="text-stone hover:text-bordeaux transition p-1" title="Xóa">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Mobile: Quantity + Price + Delete */}
                  <div className="flex sm:hidden items-center justify-between ml-16 mt-1">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-stone/20 rounded-lg overflow-hidden">
                        <button onClick={() => handleQty(i.maBienThe, -1)} disabled={i.soLuong <= 1 || i.ngayXoa}
                          className="px-2 py-1 hover:bg-ivory-100 transition disabled:opacity-30">
                          <Minus className="h-3 w-3" />
                        </button>
                        <input type="number" value={i.soLuong || 1} min={1} disabled={!!i.ngayXoa}
                          onChange={e => { const v = parseInt(e.target.value); if (!v || v < 1) return; setItems(prev => prev.map(x => x.maBienThe === i.maBienThe ? { ...x, soLuong: Math.min(v, i.tonKho || 999) } : x)) }}
                          onBlur={e => { const v = parseInt(e.target.value); if (!v || v < 1) handleQtyInput(i.maBienThe, 1); else handleQtyInput(i.maBienThe, v) }}
                          className="w-10 px-1 py-1 border-x border-stone/20 text-center text-xs font-semibold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                        <button onClick={() => handleQty(i.maBienThe, 1)} disabled={i.soLuong >= (i.tonKho || 999) || i.ngayXoa}
                          className="px-2 py-1 hover:bg-ivory-100 transition disabled:opacity-30">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button onClick={() => setConfirmAction(i.maBienThe)} className="text-stone hover:text-bordeaux transition p-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-ink">{VND((i.donGia || 0) * (i.soLuong || 1))}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="bg-ivory rounded-2xl border border-stone/10 shadow-sm p-6 sticky top-24">
              <h3 className="text-base font-bold text-ink uppercase mb-4">Đơn hàng</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-stone">
                  <span>Tạm tính ({selectedIds.size} sản phẩm)</span>
                  <span className="font-semibold text-ink">{VND(selectedTotal)}</span>
                </div>
                <div className="flex justify-between text-stone">
                  <span>Phí vận chuyển</span>
                  <span className="text-stone">Tính khi thanh toán</span>
                </div>
              </div>

              <hr className="border-stone/15 my-4" />

              <div className="flex justify-between text-lg font-bold">
                <span>Tổng giá trị đơn hàng</span>
                <span className="text-[var(--primary-color)]">{VND(selectedTotal)}</span>
              </div>

              <button onClick={handleCheckout}
                className="mt-5 w-full bg-[var(--primary-color)] text-white font-bold py-3.5 rounded-xl hover:bg-[var(--primary-hover)] transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                disabled={selectedIds.size === 0 || items.some(i => selectedIds.has(i.maBienThe) && (i.ngayXoa || i.sanPhamTrangThai === 0 || i.sanPhamNgayXoa))}>
                TIẾP TỤC THANH TOÁN <span className="text-lg">→</span>
              </button>

              <p className="text-xs text-stone text-center mt-3">
                Dùng mã giảm giá của <span className="font-semibold text-ink">BeeStylish</span> trong bước tiếp theo
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal xem chi tiết */}
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
                <p className="text-xs text-stone">SKU: {i.sku || '—'}</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-[var(--primary-color)] font-bold text-xl">{VND(i.donGia || 0)}</span>
                {i.giaGoc && Number(i.giaGoc) > Number(i.donGia) && (
                  <span className="text-sm text-stone line-through">{VND(i.giaGoc)}</span>
                )}
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
              </div>
              {(i.slug || i.maSanPham) && (
                <a href={`/products/${i.slug || i.maSanPham}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-[var(--primary-color)] font-medium hover:underline mt-1">
                  Xem chi tiết sản phẩm →
                </a>
              )}
            </div>
          </div>
        </div>
      )})()}

      <ConfirmDialog
        open={confirmAction === 'clear'}
        title="Xóa toàn bộ giỏ hàng"
        message="Bạn chắc chắn muốn xóa tất cả sản phẩm trong giỏ hàng?"
        confirmText="Xóa tất cả"
        onConfirm={() => handleClear()}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmAction !== null && confirmAction !== 'clear'}
        title="Xóa sản phẩm"
        message="Bạn chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?"
        confirmText="Xóa"
        onConfirm={() => handleRemove(confirmAction)}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  )
}
