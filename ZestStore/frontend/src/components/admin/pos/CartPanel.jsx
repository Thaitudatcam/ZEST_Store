import { useState } from 'react'
import { ShoppingCart, Trash2, Minus, Plus, User, Ticket, Coins, X, ChevronDown } from 'lucide-react'
import SafeImg from '../../../components/SafeImg'

const VND = (n) => { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }

export default function CartPanel({
  cart, customer, coupon, couponMsg, customerDiem, dungDiem,
  onRemoveItem, onUpdateQty, onClearCart, onSelectCustomer, onClearCustomer,
  onApplyCoupon, onClearCoupon, onToggleDiem, paymentMethod, onPaymentMethodChange,
  tienKhachDua, onTienKhachDuaChange, tienThua,
  onCheckout, placing, thanhTien, total, soLuongSanPham, diemQuyTac,
  onOpenCustomerPicker, availableCoupons, onOpenCouponDropdown,
}) {
  const [couponCode, setCouponCode] = useState(coupon?.maCode || '')

  const handleApply = () => {
    if (couponCode.trim()) onApplyCoupon(couponCode.trim())
  }

  return (
    <div className="w-[380px] bg-ivory rounded-2xl border border-stone/10 flex flex-col shadow-sm">
      <div className="px-5 py-4 border-b border-stone/10 flex items-center gap-3">
        <div className="w-9 h-9 bg-[var(--primary-bg)] rounded-xl flex items-center justify-center">
          <ShoppingCart className="h-5 w-5 text-[var(--primary-color)]" />
        </div>
        <div>
          <span className="font-bold text-ink">Giỏ hàng</span>
          <span className="ml-2 text-xs text-stone">({cart.length} sản phẩm)</span>
        </div>
        {cart.length > 0 && (
          <button onClick={onClearCart} className="ml-auto text-xs text-bordeaux hover:text-bordeaux/80 font-medium transition" aria-label="Xóa hết">
            Xóa hết
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-0">
        {cart.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-12 w-12 text-stone/30 mx-auto mb-3" />
            <p className="text-sm text-stone">Chưa có sản phẩm</p>
          </div>
        ) : (
          cart.map((c, i) => (
            <div key={i} className="flex items-start gap-3 bg-white rounded-xl p-3 border border-stone/5 shadow-sm">
              <div className="w-12 h-12 bg-ivory-100 rounded-lg overflow-hidden shrink-0">
                <SafeImg src={c.urlAnh} alt="" className="w-full h-full object-cover" fallback="https://placehold.co/80x80/e2e8f0/475569?text=P" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-ink truncate">{c.tenSanPham}</p>
                <p className="text-[11px] text-stone">{[c.mauSac, c.kichCo].filter(Boolean).join(' - ')}</p>
                <p className="text-[10px] text-stone/70 font-mono">{c.sku || c.maSanPhamCode || ''}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs font-bold text-[var(--primary-color)]">{VND(c.gia)}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => onUpdateQty(i, -1)} className="w-6 h-6 flex items-center justify-center rounded-md bg-ivory-100 hover:bg-ivory text-stone transition" aria-label="Giảm">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold">{c.soLuong}</span>
                    <button onClick={() => onUpdateQty(i, 1)} className="w-6 h-6 flex items-center justify-center rounded-md bg-ivory-100 hover:bg-ivory text-stone transition" aria-label="Tăng">
                      <Plus className="h-3 w-3" />
                    </button>
                    <button onClick={() => onRemoveItem(i)} className="w-6 h-6 flex items-center justify-center rounded-md text-stone hover:text-bordeaux hover:bg-bordeaux/10 transition ml-1" aria-label="Xóa">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-stone/10 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-stone" />
          <span className="text-xs font-semibold text-stone">Khách hàng</span>
          {customer && (
            <button onClick={onClearCustomer} className="ml-auto text-[11px] text-bordeaux hover:text-bordeaux/80 font-medium">Bỏ chọn</button>
          )}
        </div>
        <button onClick={onOpenCustomerPicker}
          className="w-full flex items-center justify-between px-3 py-2.5 border border-stone/20 rounded-xl text-sm bg-white hover:border-[var(--primary-color)] transition">
          <span className={customer ? 'text-ink font-medium' : 'text-stone'}>
            {customer ? `${customer.hoTen}${customer.soDienThoai ? ` (${customer.soDienThoai})` : ''}` : 'Chọn khách hàng...'}
          </span>
          <ChevronDown className="h-4 w-4 text-stone" />
        </button>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-stone flex items-center gap-1">
            <Ticket className="h-3.5 w-3.5" /> Mã giảm giá
          </label>
          <div className="flex gap-2">
            <input value={couponCode} onChange={e => setCouponCode(e.target.value)}
              disabled={cart.length === 0}
              placeholder="Nhập mã..."
              className="flex-1 border border-stone/20 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] disabled:opacity-50"
              onKeyDown={e => { if (e.key === 'Enter') handleApply() }} />
            <button onClick={handleApply} disabled={cart.length === 0 || !couponCode.trim()}
              className="px-4 py-2 bg-[var(--primary-color)] text-white text-sm font-semibold rounded-xl hover:bg-[var(--primary-hover)] transition disabled:opacity-50">
              Áp dụng
            </button>
          </div>
          {couponMsg && <p className="text-[11px] text-bordeaux">{couponMsg}</p>}
          {coupon && (
            <div className="bg-emerald-deep/10 border border-emerald-deep/20 rounded-xl px-3 py-2 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-deep">{coupon.maCode}</span>
                <span className="text-[11px] text-emerald-deep ml-1">- {VND(coupon.soTienGiam)}</span>
              </div>
              <button onClick={onClearCoupon} className="text-emerald-deep hover:text-emerald-deep/70"><X className="h-3.5 w-3.5" /></button>
            </div>
          )}
        </div>

        {customer && customerDiem?.soDiem > 0 && (
          <div className="flex items-center justify-between gap-2 bg-gold-50 rounded-xl px-3 py-2">
            <span className="text-xs text-stone flex items-center gap-1"><Coins className="h-3.5 w-3.5 text-gold" /> Dùng {customerDiem.soDiem.toLocaleString()} điểm</span>
            <button onClick={onToggleDiem}
              className={`relative w-9 h-5 rounded-full transition-colors ${dungDiem ? 'bg-[var(--primary-color)]' : 'bg-stone/30'}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${dungDiem ? 'translate-x-4' : ''}`} />
            </button>
          </div>
        )}

        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-stone">
            <span>Tạm tính ({soLuongSanPham} SP)</span><span>{VND(total)}</span>
          </div>
          {coupon && (
            <div className="flex justify-between text-emerald-deep">
              <span>Giảm giá</span><span>-{VND(coupon.soTienGiam)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-stone/10">
            <span className="font-bold text-ink">Phải thanh toán</span>
            <span className="text-xl font-bold text-[var(--primary-color)]">{VND(thanhTien)}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <select value={paymentMethod} onChange={e => onPaymentMethodChange(Number(e.target.value))}
            className="border border-stone/20 rounded-xl px-3 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]">
            <option value={5}>💵 Tiền mặt</option>
            <option value={6}>🏦 VietQR</option>
          </select>
          <button onClick={onCheckout} disabled={cart.length === 0 || placing}
            className="flex-1 py-3 bg-[var(--primary-color)] text-white font-bold rounded-xl hover:bg-[var(--primary-hover)] transition disabled:opacity-50 text-sm tracking-wide">
            {placing ? 'Đang xử lý...' : paymentMethod === 6 ? 'XÁC NHẬN THANH TOÁN' : 'Thanh toán'}
          </button>
        </div>

        {paymentMethod === 5 && (
          <div className="space-y-1.5">
            <input value={tienKhachDua} onChange={e => onTienKhachDuaChange(e.target.value)} inputMode="numeric"
              placeholder="Tiền khách đưa"
              className="w-full border border-stone/20 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
            {tienThua !== null && (
              <p className={`text-sm font-semibold ${tienThua >= 0 ? 'text-emerald-deep' : 'text-bordeaux'}`}>
                {tienThua >= 0 ? `Tiền thừa: ${VND(tienThua)}` : `Thiếu ${VND(Math.abs(tienThua))}`}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
