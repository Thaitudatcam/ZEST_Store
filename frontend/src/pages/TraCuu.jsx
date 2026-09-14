import { useState } from 'react'
import { Search, Package, MapPin, CreditCard, CheckCircle, Truck, Home, ShoppingBag, XCircle, AlertTriangle, Clock, X } from 'lucide-react'
import StatusBadge, { VND } from '../components/StatusBadge'
import SafeImg from '../components/SafeImg'
import api from '../api/axios'

const STATUS_STEPS = [
  { status: 1, label: 'Chờ xác nhận', icon: ShoppingBag },
  { status: 2, label: 'Đã xác nhận', icon: CheckCircle },
  { status: 3, label: 'Chờ lấy hàng', icon: Package },
  { status: 4, label: 'Chờ giao hàng', icon: Truck },
  { status: 6, label: 'Đã giao hàng', icon: Home },
]

const STATUS_LABELS = {
  1: 'Chờ xác nhận', 2: 'Đã xác nhận', 3: 'Chờ lấy hàng', 4: 'Chờ giao hàng',
  5: 'Đã hủy', 6: 'Đã giao hàng', 9: 'Không nhận hàng',
}

const PAYMENT_LABELS = { 1: 'COD', 2: 'VNPay', 3: 'Momo', 4: 'ZaloPay', 5: 'Tiền mặt', 6: 'VietQR' }
const PAYMENT_STATUS = { 1: 'Chờ thanh toán', 2: 'Đã thanh toán', 3: 'Thất bại' }

function OrderStatusStepper({ currentStatus, history, loaiDonHang }) {
  const isPos = loaiDonHang === 2
  const steps = isPos ? [1, 6] : [1, 2, 3, 4, 6]
  const isSpecial = [5, 9].includes(currentStatus)

  let maxNormalStatus = currentStatus
  if (isSpecial) {
    const normalHistory = (history || []).filter(h => ![5, 9].includes(h.trangThaiMoi)).map(h => h.trangThaiMoi)
    maxNormalStatus = normalHistory.length > 0 ? Math.max(...normalHistory) : -1
  }
  const maxIdx = steps.indexOf(maxNormalStatus)
  const visibleSteps = maxIdx >= 0 ? steps.slice(0, maxIdx + 1) : []

  const getTimeForStatus = (status) => {
    const h = history?.find(item => item.trangThaiMoi === status)
    return h ? new Date(h.thoiGian).toLocaleString('vi-VN') : null
  }

  return (
    <div className="bg-ivory rounded-2xl border border-stone/10 shadow-sm p-6 mb-6 overflow-x-auto">
      <div className="flex items-center min-w-fit">
        {visibleSteps.map((s, i) => {
          const stepDef = STATUS_STEPS.find(st => st.status === s)
          const Icon = stepDef?.icon || Package
          const isCurrent = !isSpecial && s === currentStatus
          const time = getTimeForStatus(s)

          return (
            <div key={s} className="flex items-center">
              {i > 0 && <div className="w-8 sm:w-12 h-0.5 bg-gold/100 mx-1 sm:mx-2" />}
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 transition-all duration-300
                  ${isCurrent ? 'bg-gold text-noir ring-4 ring-blue-200 animate-pulse' : 'bg-gold text-noir'}`}>
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <p className="text-[10px] sm:text-xs font-semibold mt-1.5 text-center whitespace-nowrap text-ink">{stepDef?.label}</p>
                {time && <p className="text-[9px] sm:text-[10px] text-stone mt-0.5">{time}</p>}
              </div>
            </div>
          )
        })}
        {isSpecial && (
          <div className="flex items-center ml-2">
            <div className="w-8 sm:w-12 h-0.5 bg-bordeaux/30 mx-1 sm:mx-2" />
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-bordeaux/20 text-bordeaux">
                {currentStatus === 5 || currentStatus === 9 ? <XCircle className="h-5 w-5 sm:h-6 sm:w-6" /> : <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />}
              </div>
              <p className="text-[10px] sm:text-xs font-semibold mt-1.5 whitespace-nowrap text-bordeaux">{STATUS_LABELS[currentStatus]}</p>
              <p className="text-[9px] sm:text-[10px] text-stone mt-0.5">{getTimeForStatus(currentStatus)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function getTimeForStatus(status, history) {
  const h = history?.find(item => item.trangThaiMoi === status)
  return h ? new Date(h.thoiGian).toLocaleString('vi-VN') : null
}

export default function TraCuu() {
  const [maDonHang, setMaDonHang] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)

  const handleLookup = async (e) => {
    e.preventDefault()
    if (!maDonHang.trim() || !email.trim()) return
    setLoading(true)
    setError('')
    setData(null)
    try {
      const res = await api.get('/orders/lookup', { params: { maDonHangCode: maDonHang.trim(), email: email.trim() } })
      setData(res.data)
    } catch {
      setError('Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã đơn hàng và email.')
    } finally {
      setLoading(false)
    }
  }

  const order = data?.order
  const items = data?.items || []
  const payments = data?.payments || []
  const history = data?.history || []

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f0e8] to-[#faf7f2]">
      <div className="max-w-4xl mx-auto px-4 py-10 pb-28 lg:pb-10">
        {/* Form tra cứu */}
        <div className="max-w-2xl mx-auto mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-ink mb-2">TRA CỨU ĐƠN HÀNG</h1>
          <p className="text-center text-stone text-sm mb-8">Nhập mã hóa đơn và email đăng ký mua hàng để xem chi tiết.</p>

          <form onSubmit={handleLookup} className="bg-white rounded-2xl shadow-md border border-stone/10 p-6 sm:p-8 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Mã Đơn Hàng <span className="text-bordeaux">*</span></label>
                <input
                  value={maDonHang}
                  onChange={(e) => setMaDonHang(e.target.value)}
                  placeholder="Ví dụ: ORD00088"
                  className="w-full px-4 py-2.5 border border-stone/20 rounded-xl text-sm bg-ivory-50 text-ink placeholder-stone focus:outline-none focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)]/20 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Email Đặt Hàng <span className="text-bordeaux">*</span></label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ví dụ: cuong.lx@example.com"
                  className="w-full px-4 py-2.5 border border-stone/20 rounded-xl text-sm bg-ivory-50 text-ink placeholder-stone focus:outline-none focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)]/20 transition"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !maDonHang.trim() || !email.trim()}
              className="w-full flex items-center justify-center gap-2 bg-[var(--primary-color)] text-white font-semibold py-3 rounded-xl hover:bg-[var(--primary-hover)] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="h-4 w-4" />
              {loading ? 'Đang tìm...' : 'TRA CỨU NGAY'}
            </button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-bordeaux/10 border border-bordeaux/20 rounded-xl text-bordeaux text-sm text-center">
            {error}
          </div>
        )}

        {/* Kết quả */}
        {order && (
          <div className="space-y-6">
            {/* Header đơn hàng */}
            <div className="bg-white rounded-2xl border border-stone/10 shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold">Đơn hàng #{order.maDonHang}</h2>
                  <p className="text-sm text-stone">{order.ngayDat ? new Date(order.ngayDat).toLocaleString('vi-VN') : '—'}</p>
                  {order.maDonHangCode && <p className="text-xs text-stone mt-0.5">Mã: {order.maDonHangCode}</p>}
                </div>
                <StatusBadge status={order.trangThaiDon} loaiDonHang={order.loaiDonHang} />
              </div>
            </div>

            {/* Status stepper */}
            <OrderStatusStepper currentStatus={order.trangThaiDon} history={history} loaiDonHang={order.loaiDonHang} />

            {/* Sản phẩm */}
            <div className="bg-white rounded-2xl border border-stone/10 shadow-sm p-6">
              <h3 className="text-base font-semibold text-ink flex items-center gap-2 mb-4">
                <Package className="h-5 w-5 text-gold" /> Sản phẩm
              </h3>
              <div className="space-y-4">
                {items.map((item) => {
                  const variant = item.bienThe || {}
                  const product = variant.sanPham || {}
                  const anh = variant.urlAnh || product.urlAnhDaiDien || ''
                  return (
                    <div key={item.maMucDonHang} className="flex items-center gap-4 cursor-pointer hover:bg-ivory-50 -mx-2 px-2 rounded-lg transition" onClick={() => setSelectedItem(item)}>
                      <div className="w-16 h-16 bg-ivory-100 rounded-lg overflow-hidden shrink-0">
                        <SafeImg src={anh} alt="" className="w-full h-full object-cover object-center" fallback="https://placehold.co/100x100/e2e8f0/475569?text=Polo" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{product.tenSanPham || `SP #${product.maSanPham}`}</p>
                        <p className="text-xs text-stone">{[variant.kichCo?.kichCo, variant.mauSac?.mauSac].filter(Boolean).join(' - ') || '—'}</p>
                        <p className="text-xs text-stone">x{item.soLuong}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{VND(item.thanhTien)}</p>
                        <p className="text-xs text-stone">{VND(item.donGia)} / cái</p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <hr className="border-t mt-4" />
              <div className="pt-4 space-y-1 text-sm">
                <div className="flex justify-between text-stone"><span>Tạm tính</span><span>{VND(items.reduce((s, i) => s + Number(i.thanhTien), 0))}</span></div>
                {(order.soTienGiam || 0) > 0 && <div className="flex justify-between text-emerald-deep"><span>Giảm giá</span><span>-{VND(order.soTienGiam)}</span></div>}
                {(order.phiVanChuyen || 0) > 0 && <div className="flex justify-between text-stone"><span>Phí vận chuyển</span><span>{VND(order.phiVanChuyen)}</span></div>}
                <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Tổng cộng</span><span className="text-gold">{VND(order.tongTien)}</span></div>
              </div>
            </div>

            {/* Thanh toán */}
            {payments.length > 0 && (
              <div className="bg-white rounded-2xl border border-stone/10 shadow-sm p-6">
                <h3 className="text-base font-semibold text-ink flex items-center gap-2 mb-4">
                  <CreditCard className="h-5 w-5 text-gold" /> Thanh toán
                </h3>
                <div className="space-y-3 text-sm">
                  {payments.map((p) => (
                    <div key={p.maThanhToan} className="flex items-center justify-between p-3 bg-ivory-50 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ink-soft">{PAYMENT_LABELS[p.phuongThuc] || p.phuongThuc}</span>
                          {p.trangThaiThanhToan === 2 && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-deep bg-emerald-deep/20 px-2 py-0.5 rounded-full">
                              <CheckCircle className="h-3 w-3" /> Đã thanh toán
                            </span>
                          )}
                          {p.trangThaiThanhToan === 1 && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-gold-hover bg-gold/20 px-2 py-0.5 rounded-full">
                              <Clock className="h-3 w-3" /> Chờ thanh toán
                            </span>
                          )}
                          {p.trangThaiThanhToan === 3 && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-bordeaux bg-bordeaux/20 px-2 py-0.5 rounded-full">
                              <XCircle className="h-3 w-3" /> Thất bại
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone mt-0.5">{VND(p.soTien)}</p>
                        {p.maGiaoDich && p.trangThaiThanhToan === 2 && <p className="text-xs text-stone mt-0.5">GD: {p.maGiaoDich}</p>}
                        {p.thoiGianTt && p.trangThaiThanhToan === 2 && <p className="text-xs text-stone">{new Date(p.thoiGianTt).toLocaleString('vi-VN')}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Giao hàng */}
            <div className="bg-white rounded-2xl border border-stone/10 shadow-sm p-6">
              <h3 className="text-base font-semibold text-ink flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-gold" /> Thông tin giao hàng
              </h3>
              <div className="text-sm space-y-1">
                <p><span className="text-stone">Người nhận:</span> {order.tenNguoiNhan}</p>
                <p><span className="text-stone">SĐT:</span> {order.sdtNguoiNhan}</p>
                <p><span className="text-stone">Địa chỉ:</span> {order.diaChiGiaoHang}</p>
                {order.ghiChu && <p><span className="text-stone">Ghi chú:</span> {order.ghiChu}</p>}
              </div>
            </div>

            {/* Nút tra cứu mới */}
            <div className="text-center">
              <button onClick={() => { setData(null); setMaDonHang(''); setEmail('') }}
                className="inline-flex items-center gap-2 text-sm text-gold font-semibold hover:underline">
                Tra cứu đơn hàng khác
              </button>
            </div>
          </div>
        )}

        {/* Modal xem chi tiết sản phẩm */}
        {selectedItem && (() => {
          const v = selectedItem.bienThe || {}
          const p = v.sanPham || {}
          const anh = v.urlAnh || p.urlAnhDaiDien || ''
          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4" onClick={() => setSelectedItem(null)}>
              <div className="bg-ivory rounded-2xl max-w-lg w-full animate-scale-in shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="relative">
                  <img src={anh} alt={p.tenSanPham} className="w-full h-72 object-cover object-center bg-ivory-100"
                    onError={(e) => { e.target.src = 'https://placehold.co/600x400/e2e8f0/475569?text=Polo' }} />
                  <button onClick={() => setSelectedItem(null)} className="absolute top-3 right-3 bg-ivory/90 rounded-full p-1.5 hover:bg-ivory transition shadow-sm">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="font-bold text-lg">{p.tenSanPham || 'Sản phẩm'}</h3>
                    <p className="text-xs text-stone">SKU: {v.sku || '—'}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gold font-bold text-xl">{VND(selectedItem.donGia || 0)}</span>
                    <span className="text-stone">x{selectedItem.soLuong}</span>
                    <span className="text-stone font-semibold">= {VND(selectedItem.thanhTien || 0)}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    {v.mauSac?.mauSac && (
                      <span className="bg-ivory-100 px-3 py-1 rounded-full text-ink-soft">Màu: <span className="font-medium">{v.mauSac.mauSac}</span></span>
                    )}
                    {v.kichCo?.kichCo && (
                      <span className="bg-ivory-100 px-3 py-1 rounded-full text-ink-soft">Size: <span className="font-medium">{v.kichCo.kichCo}</span></span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
