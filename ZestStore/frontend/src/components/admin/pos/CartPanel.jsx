import { useState, useEffect, useRef } from 'react'
import { ShoppingCart, Trash2, Minus, Plus, User, Ticket, X, ChevronDown, Truck, Store } from 'lucide-react'
import SafeImg from '../../../components/SafeImg'

const VND = (n) => { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }

export default function CartPanel({
  cart, customer, coupon, couponMsg,
  onRemoveItem, onUpdateQty, onClearCart, onSelectCustomer, onClearCustomer,
  onApplyCoupon, onClearCoupon,
  onCheckout, placing, thanhTien, total, soLuongSanPham,
  onOpenCustomerPicker, onOpenPayment, availableCoupons, onOpenCouponDropdown,
  loaiDon, onLoaiDonChange, shippingInfo, onShippingInfoChange, shippingFee, shippingLoading,
  provinces, districts, wards, onProvinceChange, onDistrictChange, onWardChange,
  mienPhiVanChuyen, onToggleMienPhiVanChuyen, mienPhiThreshold,
}) {
  const [couponCode, setCouponCode] = useState(coupon?.maCode || '')
  const [showShipping, setShowShipping] = useState(loaiDon === 'GIAO_HANG')

  useEffect(() => { setShowShipping(loaiDon === 'GIAO_HANG') }, [loaiDon])

  const handleApply = () => {
    if (couponCode.trim()) onApplyCoupon(couponCode.trim())
  }

  const handleShippingField = (field, value) => {
    onShippingInfoChange({ ...shippingInfo, [field]: value })
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

      <div className="px-4 py-3 border-b border-stone/10">
        <div className="flex gap-1 p-1 bg-ivory-100 rounded-xl">
          <button onClick={() => onLoaiDonChange('TAI_QUAY')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition ${
              loaiDon === 'TAI_QUAY' ? 'bg-[var(--primary-color)] text-white shadow-sm' : 'text-stone hover:text-ink'
            }`}>
            <Store className="h-3.5 w-3.5" /> Tại quầy
          </button>
          <button onClick={() => onLoaiDonChange('GIAO_HANG')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition ${
              loaiDon === 'GIAO_HANG' ? 'bg-[var(--primary-color)] text-white shadow-sm' : 'text-stone hover:text-ink'
            }`}>
            <Truck className="h-3.5 w-3.5" /> Giao hàng
          </button>
        </div>
      </div>

      {loaiDon === 'GIAO_HANG' && (
        <div className="px-4 py-3 border-b border-stone/10 space-y-2.5">
          <div>
            <label className="text-[11px] font-semibold text-stone mb-1 block">Họ tên người nhận <span className="text-bordeaux">*</span></label>
            <input value={shippingInfo?.hoTen || ''} onChange={e => handleShippingField('hoTen', e.target.value)}
              placeholder="Nguyễn Văn A" className="w-full border border-stone/20 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-stone mb-1 block">Số điện thoại <span className="text-bordeaux">*</span></label>
            <input value={shippingInfo?.soDienThoai || ''} onChange={e => handleShippingField('soDienThoai', e.target.value)}
              placeholder="0912345678" className="w-full border border-stone/20 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-stone mb-1 block">Địa chỉ chi tiết <span className="text-bordeaux">*</span></label>
            <input value={shippingInfo?.diaChi || ''} onChange={e => handleShippingField('diaChi', e.target.value)}
              placeholder="Số nhà, đường..." className="w-full border border-stone/20 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-stone mb-1 block">Tỉnh/TP <span className="text-bordeaux">*</span></label>
              <select value={shippingInfo?.tinhThanh || ''} onChange={e => { handleShippingField('tinhThanh', e.target.value); onProvinceChange?.(e.target.value) }}
                className="w-full border border-stone/20 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]">
                <option value="">Chọn</option>
                {provinces?.map(p => <option key={p.ma || p} value={p.ma || p}>{p.ten || p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-stone mb-1 block">Quận/Huyện <span className="text-bordeaux">*</span></label>
              <select value={shippingInfo?.quanHuyen || ''} onChange={e => { handleShippingField('quanHuyen', e.target.value); onDistrictChange?.(e.target.value) }}
                disabled={!shippingInfo?.tinhThanh}
                className="w-full border border-stone/20 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] disabled:opacity-50">
                <option value="">Chọn</option>
                {districts?.map(d => <option key={d.ma || d} value={d.ma || d}>{d.ten || d}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-stone mb-1 block">Phường/Xã <span className="text-bordeaux">*</span></label>
              <select value={shippingInfo?.phuongXa || ''} onChange={e => { handleShippingField('phuongXa', e.target.value); onWardChange?.(e.target.value) }}
                disabled={!shippingInfo?.quanHuyen}
                className="w-full border border-stone/20 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] disabled:opacity-50">
                <option value="">Chọn</option>
                {wards?.map(w => <option key={w.ma || w} value={w.ma || w}>{w.ten || w}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-stone mb-1 block">Vận chuyển</label>
              <select value={shippingInfo?.phuongThuc || 'GHN'} onChange={e => handleShippingField('phuongThuc', e.target.value)}
                className="w-full border border-stone/20 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]">
                <option value="GHN">Giao hàng nhanh</option>
                <option value="GHTK">Giao hàng tiết kiệm</option>
              </select>
            </div>
          </div>

          {mienPhiThreshold && total >= mienPhiThreshold && (
            <label className="flex items-center gap-2 text-xs text-emerald-deep cursor-pointer">
              <input type="checkbox" checked={mienPhiVanChuyen} onChange={onToggleMienPhiVanChuyen}
                className="rounded border-stone/30 text-emerald-deep focus:ring-emerald-deep" />
              Miễn phí vận chuyển (đơn từ {VND(mienPhiThreshold)})
            </label>
          )}

          <div className="flex justify-between items-center text-sm bg-ivory-100 rounded-lg px-3 py-2">
            <span className="text-stone">Phí vận chuyển</span>
            <span className="font-semibold text-ink">
              {shippingLoading ? 'Đang tính...' : (mienPhiVanChuyen ? (
                <span className="text-emerald-deep">Miễn phí</span>
              ) : VND(shippingFee || 0))}
            </span>
          </div>
        </div>
      )}

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
                  <span className="flex items-center gap-1.5">
                    {Number(c.phanTramGiamGia) > 0 && (
                      <span className="text-[9px] font-bold text-white bg-bordeaux rounded-full px-1.5 py-0.5">-{c.phanTramGiamGia}%</span>
                    )}
                    <span className="text-xs font-bold text-[var(--primary-color)]">{VND(c.gia)}</span>
                    {c.giaGoc != null && Number(c.giaGoc) > Number(c.gia) && (
                      <span className="text-[10px] text-stone line-through">{VND(c.giaGoc)}</span>
                    )}
                  </span>
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

        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-stone">
            <span>Tạm tính ({soLuongSanPham} SP)</span><span>{VND(total)}</span>
          </div>
          {coupon && (
            <div className="flex justify-between text-emerald-deep">
              <span>Giảm giá</span><span>-{VND(coupon.soTienGiam)}</span>
            </div>
          )}
          {loaiDon === 'GIAO_HANG' && (
            <div className="flex justify-between text-stone">
              <span>Phí vận chuyển</span>
              <span>{mienPhiVanChuyen ? <span className="text-emerald-deep">Miễn phí</span> : VND(shippingFee || 0)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-stone/10">
            <span className="font-bold text-ink">Phải thanh toán</span>
            <span className="text-xl font-bold text-[var(--primary-color)]">{VND(thanhTien)}</span>
          </div>
        </div>

        <button onClick={onOpenPayment} disabled={cart.length === 0 || placing}
          className="w-full py-3 bg-[var(--primary-color)] text-white font-bold rounded-xl hover:bg-[var(--primary-hover)] transition disabled:opacity-50 text-sm tracking-wide">
          {placing ? 'Đang xử lý...' : 'Thanh toán'}
        </button>
      </div>
    </div>
  )
}
