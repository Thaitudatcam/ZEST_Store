import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getOrderDetail, cancelOrder, confirmReceived } from '../api/orders'
import { createVnPayPayment, createVietQrPayment, createZaloPayPayment, retryPayment } from '../api/payment'
import { useOrderStream } from '../hooks/useOrderStream'
import { useToast } from '../context/ToastContext'
import { SkeletonPage, SkeletonCard } from '../components/Skeleton'
import StatusBadge from '../components/StatusBadge'
import { VND } from '../components/ProductCard'
import SafeImg from '../components/SafeImg'
import ConfirmDialog from '../components/ConfirmDialog'
import OrderCustomerNotes from '../components/OrderCustomerNotes'
import OrderStatusStepper from '../components/OrderStatusStepper'
import { Package, MapPin, CreditCard, ExternalLink, ShoppingBag, CheckCircle, Truck, Home, AlertTriangle, XCircle, Clock, Loader, X } from 'lucide-react'

const STATUS_LABELS = {
  1: 'Chờ xác nhận', 2: 'Đã xác nhận', 3: 'Chờ lấy hàng', 4: 'Chờ giao hàng',
  5: 'Đã hủy', 6: 'Giao hàng thành công', 9: 'Giao hàng không thành công',
}

const PAYMENT_LABELS = { 1: 'COD', 2: 'VNPay', 3: 'VietQR', 4: 'ZaloPay', 5: 'Tiền mặt', 6: 'VietQR' }
const PAYMENT_STATUS = { 1: 'Chờ thanh toán', 2: 'Đã thanh toán', 3: 'Thất bại' }

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
      else if (method === 3) paymentRes = await createVietQrPayment(orderIdNum)
      else if (method === 4) paymentRes = await createZaloPayPayment(orderIdNum)
      if (paymentRes?.paymentUrl) {
        window.location.href = paymentRes.paymentUrl
      } else if (paymentRes?.qrUrl) {
        window.location.href = paymentRes.qrUrl
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
  // Payment information is returned as a collection by the API.  Do not read
  // payment fields from the order entity (they are not persisted there).
  const primaryPayment = payments.find(p => p.trangThaiThanhToan === 2)
    || payments.find(p => p.trangThaiThanhToan === 1)
    || payments[0]
  const paymentMethod = primaryPayment?.phuongThuc
  const paymentStatus = primaryPayment?.trangThaiThanhToan

  const hasSuccessfulPayment = payments.some(p => p.trangThaiThanhToan === 2)
  const canCancel = !hasSuccessfulPayment && (order.trangThaiDon === 1 || order.trangThaiDon === 2 || order.trangThaiDon === 3)
  const hasUnpaidOnline = payments.some(p => p.phuongThuc > 1 && p.trangThaiThanhToan !== 2)
  const canConfirmReceived = order.trangThaiDon === 4 && !hasUnpaidOnline
  const canPayNow = payments.some(p => (p.phuongThuc > 1 && (p.trangThaiThanhToan === 1 || p.trangThaiThanhToan === 3)) && order.trangThaiDon === 1)

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-28 lg:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-noir via-noir/95 to-noir/80 rounded-2xl p-6 md:p-8 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-gold/10 rounded-full blur-[80px]" />
        </div>
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-ivory mb-1">CHI TIẾT ĐƠN HÀNG</h1>
            <p className="text-stone-light/60 text-sm">
              Mã đơn <span className="font-semibold text-gold">{order.maDonHangCode || `#${order.maDonHang}`}</span>
              {order.ngayDat && <span className="ml-2">• {new Date(order.ngayDat).toLocaleString('vi-VN')}</span>}
            </p>
          </div>
          <StatusBadge status={order.trangThaiDon || order.trangThai} loaiDonHang={order.loaiDonHang} />
        </div>
      </div>

      <OrderStatusStepper
        currentStatus={order.trangThaiDon || order.trangThai}
        history={data.history}
        loaiDonHang={order.loaiDonHang}
      />

      <OrderCustomerNotes history={data.history} />

      {/* Recipient Info */}
      <div className="bg-white rounded-xl border border-stone/10 p-5 mb-4">
        <h2 className="text-sm font-bold text-ink uppercase tracking-wide mb-3 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gold" /> THÔNG TIN NHẬN HÀNG
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-stone text-xs">Người nhận:</span>
            <p className="font-medium text-ink">{order.tenNguoiNhan}</p>
          </div>
          <div>
            <span className="text-stone text-xs">Số điện thoại:</span>
            <p className="font-medium text-ink">{order.sdtNguoiNhan}</p>
          </div>
          <div>
            <span className="text-stone text-xs">Email:</span>
            <p className="font-medium text-ink">{order.email || '—'}</p>
          </div>
          <div className="sm:col-span-2">
            <span className="text-stone text-xs">Địa chỉ giao hàng:</span>
            <p className="font-medium text-ink">{order.diaChiGiaoHang}</p>
          </div>
          {order.ghiChu && (
            <div className="sm:col-span-2">
              <span className="text-stone text-xs">Ghi chú:</span>
              <p className="font-medium text-ink">{order.ghiChu}</p>
            </div>
          )}
        </div>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-xl border border-stone/10 p-5 mb-4">
        <h2 className="text-sm font-bold text-ink uppercase tracking-wide mb-3 flex items-center gap-2">
          <Package className="h-4 w-4 text-gold" /> DANH SÁCH SẢN PHẨM ({items.length})
        </h2>
        <div className="space-y-3">
          {items.map((item) => {
            const variant = item.bienThe || {}
            const product = variant.sanPham || {}
            const anh = variant.urlAnh || product.urlAnhDaiDien || ''
            return (
              <div key={item.maMucDonHang} className="flex items-center gap-4 cursor-pointer hover:bg-ivory/50 -mx-2 px-2 py-2 rounded-lg transition" onClick={() => setSelectedItem(item)}>
                <div className="w-16 h-16 bg-ivory rounded-lg overflow-hidden shrink-0">
                  <SafeImg src={anh} alt="" className="w-full h-full object-cover object-center" fallback="https://placehold.co/100x100/e2e8f0/475569?text=Polo" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-ink">{product.tenSanPham || `SP #${product.maSanPham}`}</p>
                  <p className="text-xs text-stone">Phân loại: {variant.mauSac?.mauSac || '—'}, Size {variant.kichCo?.kichCo || '—'}</p>
                  <p className="text-xs text-stone">Mã: {product.maSanPhamCode || variant.sku || '—'} · Số lượng: {item.soLuong}</p>
                </div>
                <div className="text-right shrink-0">
                  {item.giaGoc && Number(item.giaGoc) > Number(item.donGia) && (
                    <p className="text-xs text-stone line-through">{VND(item.giaGoc)}</p>
                  )}
                  <p className="text-sm font-bold text-gold">{VND(item.donGia)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-white rounded-xl border border-stone/10 p-5 mb-4">
        <h2 className="text-sm font-bold text-ink uppercase tracking-wide mb-3 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-gold" /> TỔNG KẾT TÀI CHÍNH
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-stone">Tạm tính hàng</span>
            <span className="font-medium text-ink">{VND(items.reduce((s, i) => s + Number(i.thanhTien || i.donGia * (i.soLuong || 1)), 0))}</span>
          </div>
          {(order.soTienGiam || 0) > 0 && (
            <div className="flex justify-between text-emerald-deep">
              <span>Giảm giá Voucher / Điểm giảm giá</span>
              <span className="font-medium">-{VND(order.soTienGiam)}</span>
            </div>
          )}
          {(order.phiVanChuyen || 0) > 0 && (
            <div className="flex justify-between">
              <span className="text-stone">Phí vận chuyển</span>
              <span className="font-medium text-ink">+{VND(order.phiVanChuyen)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-stone">Loại đơn hàng</span>
            <span className="font-medium text-ink">{order.loaiDonHang === 2 ? 'Tại quầy' : 'Online'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone">Phương thức thanh toán</span>
            <span className="font-medium text-ink">{PAYMENT_LABELS[paymentMethod] || (order.loaiDonHang === 2 ? 'Tiền mặt' : 'COD')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone">Trạng thái thanh toán</span>
            <span className={`font-semibold ${paymentStatus === 2 ? 'text-emerald-deep' : paymentStatus === 3 ? 'text-bordeaux' : 'text-gold'}`}>
              {PAYMENT_STATUS[paymentStatus] || 'Chưa thanh toán'}
            </span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t border-stone/10 pt-3 mt-2">
            <span>TỔNG CỘNG THANH TOÁN:</span>
            <span className="text-gold">{VND(order.tongTien)}</span>
          </div>
        </div>
      </div>

      {/* Cancel Button */}
      {canCancel && (
        <div className="text-center">
          <button
            onClick={() => setConfirmAction('cancel')}
            disabled={cancelling}
            className="inline-flex items-center gap-2 border-2 border-bordeaux/30 text-bordeaux px-8 py-3 rounded-xl text-sm font-semibold hover:bg-bordeaux/5 transition disabled:opacity-50"
          >
            {cancelling ? <Loader className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            YÊU CẦU HỦY ĐƠN HÀNG NÀY
          </button>
        </div>
      )}

      {/* Confirm Received Button */}
      {canConfirmReceived && (
        <div className="text-center mt-3">
          <button
            onClick={() => setConfirmAction('received')}
            disabled={confirmingReceived}
            className="inline-flex items-center gap-2 bg-gold text-noir px-8 py-3 rounded-xl text-sm font-semibold hover:bg-gold-hover transition disabled:opacity-50"
          >
            {confirmingReceived ? <Loader className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            ĐÃ NHẬN HÀNG
          </button>
        </div>
      )}

      {/* Pay Now Button */}
      {canPayNow && (
        <div className="text-center mt-3">
          <button
            onClick={() => handlePayNow(payments.find(p => p.phuongThuc > 1))}
            disabled={paying}
            className="inline-flex items-center gap-2 bg-gold text-noir px-8 py-3 rounded-xl text-sm font-semibold hover:bg-gold-hover transition disabled:opacity-50"
          >
            {paying ? <Loader className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            THANH TOÁN NGAY
          </button>
        </div>
      )}

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
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-stone/10 bg-white/60 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-stone">Mã sản phẩm</p>
                  <p className="mt-0.5 text-xs font-bold text-ink">{p.maSanPhamCode || (p.maSanPham ? `SP${p.maSanPham}` : '—')}</p>
                </div>
                <div className="rounded-lg border border-stone/10 bg-white/60 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-stone">SKU biến thể</p>
                  <p className="mt-0.5 truncate text-xs font-bold text-ink">{v.sku || '—'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-stone">Giá sản phẩm</p>
                <p className="mt-0.5 text-gold font-bold text-xl">{VND(selectedItem.donGia || 0)}</p>
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
