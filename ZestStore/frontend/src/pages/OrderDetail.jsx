import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getOrderDetail, cancelOrder, confirmReceived } from '../api/orders'
import { createVnPayPayment, createMomoPayment, createZaloPayPayment, retryPayment } from '../api/payment'
import { useOrderStream } from '../hooks/useOrderStream'
import { useToast } from '../context/ToastContext'
import { SkeletonPage, SkeletonCard } from '../components/Skeleton'
import StatusBadge from '../components/StatusBadge'
import { VND } from '../components/ProductCard'
import SafeImg from '../components/SafeImg'
import ConfirmDialog from '../components/ConfirmDialog'
import { Package, MapPin, CreditCard, ArrowLeft, ExternalLink, ShoppingBag, CheckCircle, Truck, Home, AlertTriangle, XCircle, Clock, Loader, X } from 'lucide-react'

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
  const isPos = loaiDonHang === 2;

  const POS_STEPS = [
    { status: 1, label: 'Tạo đơn', icon: ShoppingBag },
    { status: 6, label: 'Hoàn thành', icon: CheckCircle },
  ];

  const steps = isPos ? [1, 6] : [1, 2, 3, 4, 6];
  const stepDefs = isPos ? POS_STEPS : STATUS_STEPS;
  const isSpecial = [5, 9].includes(currentStatus);

  let maxNormalStatus = currentStatus;
  if (isSpecial) {
    const normalHistory = (history || [])
      .filter(h => ![5, 9].includes(h.trangThaiMoi))
      .map(h => h.trangThaiMoi);
    maxNormalStatus = normalHistory.length > 0 ? Math.max(...normalHistory) : -1;
  }
  const maxIdx = steps.indexOf(maxNormalStatus);
  const visibleSteps = maxIdx >= 0 ? steps.slice(0, maxIdx + 1) : [];

  const getTimeForStatus = (status) => {
    const h = history?.find(item => item.trangThaiMoi === status);
    return h ? new Date(h.thoiGian).toLocaleString('vi-VN') : null;
  };

  return (
    <div className="bg-ivory rounded-2xl border border-stone/10 shadow-sm p-6 mb-6 overflow-x-auto">
      <div className="flex items-center min-w-fit">
        {visibleSteps.map((s, i) => {
          const stepDef = stepDefs.find(st => st.status === s);
          const Icon = stepDef.icon;
          const isCurrent = !isSpecial && s === currentStatus;
          const time = getTimeForStatus(s);

          return (
            <div key={s} className="flex items-center">
              {i > 0 && (
                <div className="w-8 sm:w-12 h-0.5 bg-gold/100 mx-1 sm:mx-2" />
              )}
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 transition-all duration-300
                  ${isCurrent ? 'bg-gold text-noir ring-4 ring-blue-200 animate-pulse' : 'bg-gold text-noir'}`}>
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <p className="text-[10px] sm:text-xs font-semibold mt-1.5 text-center whitespace-nowrap text-ink">
                  {stepDef.label}
                </p>
                {time && (
                  <p className="text-[9px] sm:text-[10px] text-stone mt-0.5">{time}</p>
                )}
                {isCurrent && !time && (
                  <p className="text-[9px] sm:text-[10px] text-gold font-medium mt-0.5">Đang xử lý...</p>
                )}
              </div>
            </div>
          );
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
  );
}

export default function OrderDetail() {
  const { id } = useParams()
  const toast = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [paying, setPaying] = useState(false)
  const [confirmingReceived, setConfirmingReceived] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)

  const load = () => getOrderDetail(id).then(setData).finally(() => setLoading(false))
  useEffect(() => { load() }, [id])

  useOrderStream(id, {
    onUpdate: (update) => {
      if (update.trangThaiMoi) {
        setData(prev => {
          if (!prev) return prev
          return {
            ...prev,
            order: { ...prev.order, trangThaiDon: update.trangThaiMoi },
            history: [
              { trangThaiMoi: update.trangThaiMoi, thoiGian: update.thoiGian, nguoiCapNhat: { hoTen: update.nguoiCapNhat === 'admin' ? 'Quản trị viên' : 'Bạn' }, ghiChu: update.ghiChu },
              ...(prev.history || []),
            ],
          }
        })
        toast.info(`Đơn hàng đã chuyển sang: ${STATUS_LABELS[update.trangThaiMoi] || update.trangThaiMoi}`)
      }
    },
  })

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await cancelOrder(id)
      await load()
      toast.success('Đã hủy đơn hàng')
    } catch (err) { toast.error(err?.response?.data?.message || 'Hủy đơn hàng thất bại') }
    finally { setCancelling(false) }
  }

  const handleConfirmReceived = async () => {
    setConfirmingReceived(true)
    try {
      await confirmReceived(id)
      await load()
      toast.success('Xác nhận đã nhận hàng thành công')
    } catch (err) { toast.error(err?.response?.data?.message || 'Xác nhận thất bại') }
    finally { setConfirmingReceived(false) }
  }

  const handlePayNow = async (payment) => {
    if (paying) return
    setPaying(true)
    try {
      await retryPayment(payment.maThanhToan)
      const method = payment.phuongThuc
      const orderIdNum = Number(id)
      let paymentRes
      if (method === 2) paymentRes = await createVnPayPayment(orderIdNum)
      else if (method === 3) paymentRes = await createMomoPayment(orderIdNum)
      else if (method === 4) paymentRes = await createZaloPayPayment(orderIdNum)
      if (paymentRes?.paymentUrl) {
        window.location.href = paymentRes.paymentUrl
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tạo yêu cầu thanh toán')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <SkeletonPage />
        <div className="mt-6 space-y-6">
          <SkeletonCard className="h-64" />
          <SkeletonCard className="h-48" />
          <SkeletonCard className="h-32" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center text-stone">
        <Package className="h-16 w-16 mx-auto mb-4 text-stone" />
        <p>Không tìm thấy đơn hàng</p>
        <Link to="/orders" className="text-gold font-semibold hover:underline mt-2 inline-block">Quay lại</Link>
      </div>
    )
  }

  const order = data.order || data
  const items = data.items || []
  const payments = data.payments || []
  const history = data.history || []

  const canCancel = order.trangThaiDon === 1 || order.trangThaiDon === 2 || order.trangThaiDon === 3
  const hasUnpaidOnline = payments.some(p => p.phuongThuc > 1 && p.trangThaiThanhToan !== 2)
  const canConfirmReceived = order.trangThaiDon === 4 && !hasUnpaidOnline
  const canPayNow = payments.some(p => (p.phuongThuc > 1 && (p.trangThaiThanhToan === 1 || p.trangThaiThanhToan === 3)) && order.trangThaiDon === 1)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-28 lg:pb-8">
      <Link to="/orders" className="inline-flex items-center gap-1 text-sm text-stone hover:text-ink-soft mb-4">
        <ArrowLeft className="h-4 w-4" /> Quay lại đơn hàng
      </Link>

      <div className="bg-ivory rounded-2xl border border-stone/10 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">Đơn hàng #{order.maDonHang}</h1>
            <p className="text-sm text-stone">{order.ngayDat ? new Date(order.ngayDat).toLocaleString('vi-VN') : '—'}</p>
            {order.maDonHangCode && <p className="text-xs text-stone mt-0.5">Mã: {order.maDonHangCode}</p>}
          </div>
          <StatusBadge status={order.trangThaiDon || order.trangThai} loaiDonHang={order.loaiDonHang} />
        </div>
      </div>

      <OrderStatusStepper currentStatus={order.trangThaiDon} history={history} loaiDonHang={order.loaiDonHang} />

      <div className="bg-ivory rounded-2xl border border-stone/10 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-ink flex items-center gap-2 mb-4">
          <Package className="h-5 w-5 text-gold" /> Sản phẩm
        </h2>
        <div className="space-y-4">
          {items.map((item) => {
            const variant = item.bienThe || {}
            const product = variant.sanPham || {}
            const anh = variant.urlAnh || product.urlAnhDaiDien || ''
            return (
              <div key={item.maMucDonHang} className="flex items-center gap-4 cursor-pointer hover:bg-ivory-100 -mx-2 px-2 rounded-lg transition" onClick={() => setSelectedItem(item)}>
                <div className="w-16 h-16 bg-ivory-100 rounded-lg overflow-hidden shrink-0">
                  <SafeImg src={anh} alt="" className="w-full h-full object-cover object-center" fallback="https://placehold.co/100x100/e2e8f0/475569?text=Polo" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{product.tenSanPham || `SP #${product.maSanPham}`}</p>
                  <p className="text-xs text-stone">{[variant.kichCo?.kichCo, variant.mauSac?.mauSac].filter(Boolean).join(' - ') || '—'}</p>
                  <p className="text-xs text-stone">Mã SP: {product.maSanPhamCode || variant.sku || '—'} &middot; x{item.soLuong}</p>
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

      {payments.length > 0 && (
        <div className="bg-ivory rounded-2xl border border-stone/10 shadow-sm p-6 mb-6">
          <h2 className="text-base font-semibold text-ink flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-gold" /> Thanh toán
          </h2>
          <div className="space-y-3 text-sm">
            {payments.map((p) => {
              const isOnline = p.phuongThuc > 1
              const canRetry = p.phuongThuc > 1 && (p.trangThaiThanhToan === 1 || p.trangThaiThanhToan === 3) && order.trangThaiDon === 1
              return (
                <div key={p.maThanhToan} className="flex items-center justify-between p-3 bg-ivory-100 rounded-lg">
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
                    {p.maGiaoDich && p.trangThaiThanhToan === 2 && (
                      <p className="text-xs text-stone mt-0.5">GD: {p.maGiaoDich}</p>
                    )}
                    {p.thoiGianTt && p.trangThaiThanhToan === 2 && (
                      <p className="text-xs text-stone">{new Date(p.thoiGianTt).toLocaleString('vi-VN')}</p>
                    )}
                  </div>
                  {canRetry && (
                    <button onClick={() => handlePayNow(p)} disabled={paying}
                      className="flex items-center gap-1 text-xs bg-gold text-noir px-3 py-2 rounded-lg hover:bg-gold-hover transition disabled:opacity-50 shrink-0">
                      {paying ? <Loader className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3" />}
                      {paying ? 'Đang xử lý...' : p.trangThaiThanhToan === 3 ? 'Thử lại' : 'Thanh toán ngay'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="bg-ivory rounded-2xl border border-stone/10 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-ink flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-gold" /> Thông tin giao hàng
        </h2>
        <div className="text-sm space-y-1">
          <p><span className="text-stone">Người nhận:</span> {order.tenNguoiNhan}</p>
          <p><span className="text-stone">SĐT:</span> {order.sdtNguoiNhan}</p>
          <p><span className="text-stone">Địa chỉ:</span> {order.diaChiGiaoHang}</p>
          {order.ghiChu && <p><span className="text-stone">Ghi chú:</span> {order.ghiChu}</p>}
        </div>
      </div>

      {/* Desktop action buttons */}
      <div className="hidden lg:flex fixed right-8 top-1/2 -translate-y-1/2 flex-col gap-2">
        {canCancel && (
          <button onClick={() => setConfirmAction('cancel')} disabled={cancelling}
            className="flex items-center gap-2 bg-ivory border border-bordeaux/20 text-bordeaux px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-bordeaux/10 transition disabled:opacity-50 shadow-sm">
            {cancelling ? <Loader className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Hủy đơn
          </button>
        )}
        {canConfirmReceived && (
          <button onClick={() => setConfirmAction('received')} disabled={confirmingReceived}
            className="flex items-center gap-2 bg-gold text-noir px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gold-hover transition disabled:opacity-50 shadow-sm">
            {confirmingReceived ? <Loader className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Đã nhận hàng
          </button>
        )}
        {canPayNow && (
          <button onClick={() => handlePayNow(payments.find(p => p.phuongThuc > 1))} disabled={paying}
            className="flex items-center gap-2 bg-gold text-noir px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gold-hover transition disabled:opacity-50 shadow-sm">
            {paying ? <Loader className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            Thanh toán ngay
          </button>
        )}
      </div>

      {/* Mobile sticky bottom action bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-ivory border-t shadow-2xl p-4 z-50 flex gap-2">
        {canCancel && (
          <button onClick={() => setConfirmAction('cancel')} disabled={cancelling}
            className="flex-1 flex items-center justify-center gap-1.5 border border-bordeaux/20 text-bordeaux py-3 rounded-xl text-sm font-medium hover:bg-bordeaux/10 transition disabled:opacity-50">
            {cancelling ? <Loader className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Hủy đơn
          </button>
        )}
        {canConfirmReceived && (
          <button onClick={() => setConfirmAction('received')} disabled={confirmingReceived}
            className="flex-1 flex items-center justify-center gap-1.5 bg-gold text-noir py-3 rounded-xl text-sm font-medium hover:bg-gold-hover transition disabled:opacity-50">
            {confirmingReceived ? <Loader className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Đã nhận hàng
          </button>
        )}
        {canPayNow && (
          <button onClick={() => handlePayNow(payments.find(p => p.phuongThuc > 1))} disabled={paying}
            className="flex-1 flex items-center justify-center gap-1.5 bg-gold text-noir py-3 rounded-xl text-sm font-medium hover:bg-gold-hover transition disabled:opacity-50">
            {paying ? <Loader className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            Thanh toán ngay
          </button>
        )}
      </div>

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
                  <span className="bg-ivory-100 px-3 py-1 rounded-full text-ink-soft">
                    Màu: <span className="font-medium">{v.mauSac.mauSac}</span>
                  </span>
                )}
                {v.kichCo?.kichCo && (
                  <span className="bg-ivory-100 px-3 py-1 rounded-full text-ink-soft">
                    Size: <span className="font-medium">{v.kichCo.kichCo}</span>
                  </span>
                )}
              </div>
              {p.moTa && (
                <div>
                  <p className="text-xs font-semibold text-stone uppercase tracking-wide mb-1">Mô tả</p>
                  <p className="text-sm text-stone line-clamp-4">{p.moTa}</p>
                </div>
              )}
              {(p.slug || p.maSanPham) && (
                <a href={`/products/${p.slug || p.maSanPham}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-gold font-medium hover:underline mt-1">
                  Xem chi tiết sản phẩm →
                </a>
              )}
            </div>
          </div>
        </div>
      )})()}

      <ConfirmDialog
        open={confirmAction === 'cancel'}
        title="Hủy đơn hàng"
        message="Bạn chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác."
        confirmText="Hủy đơn"
        onConfirm={() => { setConfirmAction(null); handleCancel() }}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmAction === 'received'}
        title="Xác nhận đã nhận hàng"
        message="Bạn đã nhận được đơn hàng này?"
        confirmText="Đã nhận hàng"
        variant="gold"
        onConfirm={() => { setConfirmAction(null); handleConfirmReceived() }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  )
}
