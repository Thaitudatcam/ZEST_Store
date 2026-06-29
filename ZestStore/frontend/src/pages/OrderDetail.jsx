import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getOrderDetail, cancelOrder, requestReturn, confirmReceived } from '../api/orders'
import { createVnPayPayment, createMomoPayment, createZaloPayPayment, retryPayment } from '../api/payment'
import { useOrderStream } from '../hooks/useOrderStream'
import { useToast } from '../context/ToastContext'
import { SkeletonPage, SkeletonCard } from '../components/Skeleton'
import StatusBadge from '../components/StatusBadge'
import { VND } from '../components/ProductCard'
import SafeImg from '../components/SafeImg'
import { Package, MapPin, CreditCard, ArrowLeft, ExternalLink, ShoppingBag, CheckCircle, Truck, Home, AlertTriangle, XCircle, RefreshCw, Clock, Phone, MessageCircle, Loader, X } from 'lucide-react'

const STATUS_STEPS = [
  { status: 1, label: 'Chờ xác nhận', icon: ShoppingBag },
  { status: 2, label: 'Đã xác nhận', icon: CheckCircle },
  { status: 3, label: 'Chờ lấy hàng', icon: Package },
  { status: 4, label: 'Chờ giao hàng', icon: Truck },
  { status: 6, label: 'Đã giao hàng', icon: Home },
]

const STATUS_LABELS = {
  1: 'Chờ xác nhận', 2: 'Đã xác nhận', 3: 'Chờ lấy hàng', 4: 'Chờ giao hàng',
  5: 'Đã hủy', 6: 'Đã giao hàng', 7: 'Yêu cầu trả hàng', 8: 'Đã trả hàng', 9: 'Không nhận hàng',
}

const PAYMENT_LABELS = { 1: 'COD', 2: 'VNPay', 3: 'Momo', 4: 'ZaloPay', 6: 'VietQR' }
const PAYMENT_STATUS = { 1: 'Chờ thanh toán', 2: 'Đã thanh toán', 3: 'Thất bại' }

function OrderStatusStepper({ currentStatus, history, loaiDonHang }) {
  const isPos = loaiDonHang === 2;

  const POS_STEPS = [
    { status: 1, label: 'Tạo đơn', icon: ShoppingBag },
    { status: 6, label: 'Hoàn thành', icon: CheckCircle },
  ];

  const steps = isPos ? [1, 6] : [1, 2, 3, 4, 6];
  const stepDefs = isPos ? POS_STEPS : STATUS_STEPS;
  const isSpecial = [5, 7, 8, 9].includes(currentStatus);

  let maxNormalStatus = currentStatus;
  if (isSpecial) {
    const normalHistory = (history || [])
      .filter(h => ![5, 7, 8, 9].includes(h.trangThaiMoi))
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 overflow-x-auto">
      <div className="flex items-center min-w-fit">
        {visibleSteps.map((s, i) => {
          const stepDef = stepDefs.find(st => st.status === s);
          const Icon = stepDef.icon;
          const isCurrent = !isSpecial && s === currentStatus;
          const time = getTimeForStatus(s);

          return (
            <div key={s} className="flex items-center">
              {i > 0 && (
                <div className="w-8 sm:w-12 h-0.5 bg-blue-500 mx-1 sm:mx-2" />
              )}
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 transition-all duration-300
                  ${isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-200 animate-pulse' : 'bg-blue-600 text-white'}`}>
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <p className="text-[10px] sm:text-xs font-semibold mt-1.5 text-center whitespace-nowrap text-gray-800">
                  {stepDef.label}
                </p>
                {time && (
                  <p className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5">{time}</p>
                )}
                {isCurrent && !time && (
                  <p className="text-[9px] sm:text-[10px] text-blue-600 font-medium mt-0.5">Đang xử lý...</p>
                )}
              </div>
            </div>
          );
        })}
        {isSpecial && (
          <div className="flex items-center ml-2">
            <div className="w-8 sm:w-12 h-0.5 bg-red-300 mx-1 sm:mx-2" />
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${currentStatus === 8 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {currentStatus === 5 || currentStatus === 9 ? <XCircle className="h-5 w-5 sm:h-6 sm:w-6" /> : currentStatus === 8 ? <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" /> : <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />}
              </div>
              <p className={`text-[10px] sm:text-xs font-semibold mt-1.5 whitespace-nowrap ${currentStatus === 8 ? 'text-green-600' : 'text-red-600'}`}>{STATUS_LABELS[currentStatus]}</p>
              <p className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5">{getTimeForStatus(currentStatus)}</p>
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
  const [returnOpen, setReturnOpen] = useState(false)
  const [returnLyDo, setReturnLyDo] = useState('')
  const [returning, setReturning] = useState(false)
  const [confirmingReceived, setConfirmingReceived] = useState(false)
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

  const handleRequestReturn = async () => {
    if (!returnLyDo.trim()) return toast.error('Vui lòng nhập lý do trả hàng')
    setReturning(true)
    try {
      await requestReturn(id, returnLyDo.trim())
      setReturnOpen(false)
      setReturnLyDo('')
      await load()
      toast.success('Yêu cầu trả hàng đã gửi')
    } catch (err) { toast.error(err?.response?.data?.message || 'Yêu cầu trả hàng thất bại') }
    finally { setReturning(false) }
  }

  const handlePayNow = async (payment) => {
    if (paying) return
    setPaying(true)
    try {
      const method = payment.phuongThuc
      if (payment.trangThaiThanhToan === 3) {
        await retryPayment(payment.maThanhToan)
      }
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
      <div className="max-w-3xl mx-auto px-4 py-8 text-center text-gray-500">
        <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <p>Không tìm thấy đơn hàng</p>
        <Link to="/orders" className="text-blue-700 font-semibold hover:underline mt-2 inline-block">Quay lại</Link>
      </div>
    )
  }

  const order = data.order || data
  const items = data.items || []
  const payments = data.payments || []
  const history = data.history || []

  const canCancel = order.trangThaiDon === 1 || order.trangThaiDon === 2 || order.trangThaiDon === 4
  const canConfirmReceived = order.trangThaiDon === 4
  const hasRequestedReturn = history?.some(h => h.trangThaiMoi === 7)
  const canRequestReturn = (order.trangThaiDon === 4 || order.trangThaiDon === 6) && !hasRequestedReturn
  const canPayNow = payments.some(p => (p.phuongThuc > 1 && (p.trangThaiThanhToan === 1 || p.trangThaiThanhToan === 3)) && order.trangThaiDon === 1)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-28 lg:pb-8">
      <Link to="/orders" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4" /> Quay lại đơn hàng
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">Đơn hàng #{order.maDonHang}</h1>
            <p className="text-sm text-gray-500">{order.ngayDat ? new Date(order.ngayDat).toLocaleString('vi-VN') : '—'}</p>
            {order.maDonHangCode && <p className="text-xs text-gray-400 mt-0.5">Mã: {order.maDonHangCode}</p>}
          </div>
          <StatusBadge status={order.trangThaiDon || order.trangThai} loaiDonHang={order.loaiDonHang} />
        </div>
      </div>

      <OrderStatusStepper currentStatus={order.trangThaiDon} history={history} loaiDonHang={order.loaiDonHang} />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <Package className="h-5 w-5 text-blue-700" /> Sản phẩm
        </h2>
        <div className="space-y-4">
          {items.map((item) => {
            const variant = item.bienThe || {}
            const product = variant.sanPham || {}
            const anh = variant.urlAnh || product.urlAnhDaiDien || ''
            return (
              <div key={item.maMucDonHang} className="flex items-center gap-4 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded-lg transition" onClick={() => setSelectedItem(item)}>
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                  <SafeImg src={anh} alt="" className="w-full h-full object-cover object-center" fallback="https://placehold.co/100x100/e2e8f0/475569?text=Polo" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{product.tenSanPham || `SP #${product.maSanPham}`}</p>
                  <p className="text-xs text-gray-500">{[variant.kichCo?.kichCo, variant.mauSac?.mauSac].filter(Boolean).join(' - ') || '—'}</p>
                  <p className="text-xs text-gray-500">x{item.soLuong}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{VND(item.thanhTien)}</p>
                  <p className="text-xs text-gray-400">{VND(item.donGia)} / cái</p>
                </div>
              </div>
            )
          })}
        </div>
        <hr className="border-t mt-4" />
        <div className="pt-4 space-y-1 text-sm">
          <div className="flex justify-between text-gray-600"><span>Tạm tính</span><span>{VND(items.reduce((s, i) => s + Number(i.thanhTien), 0))}</span></div>
          {(order.soTienGiam || 0) > 0 && <div className="flex justify-between text-green-600"><span>Giảm giá</span><span>-{VND(order.soTienGiam)}</span></div>}
          {(order.phiVanChuyen || 0) > 0 && <div className="flex justify-between text-gray-600"><span>Phí vận chuyển</span><span>{VND(order.phiVanChuyen)}</span></div>}
          <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Tổng cộng</span><span className="text-blue-700">{VND(order.tongTien)}</span></div>
        </div>
      </div>

      {payments.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-blue-700" /> Thanh toán
          </h2>
          <div className="space-y-3 text-sm">
            {payments.map((p) => {
              const isOnline = p.phuongThuc > 1
              const canRetry = p.phuongThuc > 1 && (p.trangThaiThanhToan === 1 || p.trangThaiThanhToan === 3) && order.trangThaiDon === 1
              return (
                <div key={p.maThanhToan} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">{PAYMENT_LABELS[p.phuongThuc] || p.phuongThuc}</span>
                      {p.trangThaiThanhToan === 2 && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                          <CheckCircle className="h-3 w-3" /> Đã thanh toán
                        </span>
                      )}
                      {p.trangThaiThanhToan === 1 && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          <Clock className="h-3 w-3" /> Chờ thanh toán
                        </span>
                      )}
                      {p.trangThaiThanhToan === 3 && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                          <XCircle className="h-3 w-3" /> Thất bại
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{VND(p.soTien)}</p>
                    {p.maGiaoDich && p.trangThaiThanhToan === 2 && (
                      <p className="text-xs text-gray-400 mt-0.5">GD: {p.maGiaoDich}</p>
                    )}
                    {p.thoiGianTt && p.trangThaiThanhToan === 2 && (
                      <p className="text-xs text-gray-400">{new Date(p.thoiGianTt).toLocaleString('vi-VN')}</p>
                    )}
                  </div>
                  {canRetry && (
                    <button onClick={() => handlePayNow(p)} disabled={paying}
                      className="flex items-center gap-1 text-xs bg-blue-700 text-white px-3 py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50 shrink-0">
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

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-blue-700" /> Thông tin giao hàng
        </h2>
        <div className="text-sm space-y-1">
          <p><span className="text-gray-500">Người nhận:</span> {order.tenNguoiNhan}</p>
          <p><span className="text-gray-500">SĐT:</span> {order.sdtNguoiNhan}</p>
          <p><span className="text-gray-500">Địa chỉ:</span> {order.diaChiGiaoHang}</p>
          {order.ghiChu && <p><span className="text-gray-500">Ghi chú:</span> {order.ghiChu}</p>}
        </div>
      </div>

      {/* Desktop action buttons */}
      <div className="hidden lg:flex fixed right-8 top-1/2 -translate-y-1/2 flex-col gap-2">
        {canCancel && (
          <button onClick={handleCancel} disabled={cancelling}
            className="flex items-center gap-2 bg-white border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 transition disabled:opacity-50 shadow-sm">
            {cancelling ? <Loader className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Hủy đơn
          </button>
        )}
        {canConfirmReceived && (
          <button onClick={handleConfirmReceived} disabled={confirmingReceived}
            className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-800 transition disabled:opacity-50 shadow-sm">
            {confirmingReceived ? <Loader className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Đã nhận hàng
          </button>
        )}
        {canPayNow && (
          <button onClick={() => handlePayNow(payments.find(p => p.phuongThuc > 1))} disabled={paying}
            className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-800 transition disabled:opacity-50 shadow-sm">
            {paying ? <Loader className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            Thanh toán ngay
          </button>
        )}
        {canRequestReturn && (
          <button onClick={() => setReturnOpen(true)}
            className="flex items-center gap-2 bg-white border border-orange-200 text-orange-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-orange-50 transition shadow-sm">
            <RefreshCw className="h-4 w-4" /> Yêu cầu trả hàng
          </button>
        )}
      </div>

      {/* Mobile sticky bottom action bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl p-4 z-50 flex gap-2">
        {canCancel && (
          <button onClick={handleCancel} disabled={cancelling}
            className="flex-1 flex items-center justify-center gap-1.5 border border-red-200 text-red-600 py-3 rounded-xl text-sm font-medium hover:bg-red-50 transition disabled:opacity-50">
            {cancelling ? <Loader className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Hủy đơn
          </button>
        )}
        {canConfirmReceived && (
          <button onClick={handleConfirmReceived} disabled={confirmingReceived}
            className="flex-1 flex items-center justify-center gap-1.5 bg-blue-700 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-800 transition disabled:opacity-50">
            {confirmingReceived ? <Loader className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Đã nhận hàng
          </button>
        )}
        {canPayNow && (
          <button onClick={() => handlePayNow(payments.find(p => p.phuongThuc > 1))} disabled={paying}
            className="flex-1 flex items-center justify-center gap-1.5 bg-blue-700 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-800 transition disabled:opacity-50">
            {paying ? <Loader className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            Thanh toán ngay
          </button>
        )}
        {canRequestReturn && (
          <button onClick={() => setReturnOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 border border-orange-200 text-orange-600 py-3 rounded-xl text-sm font-medium hover:bg-orange-50 transition">
            <RefreshCw className="h-4 w-4" /> Trả hàng
          </button>
        )}
      </div>

      {returnOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setReturnOpen(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full mx-4 p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-3">Yêu cầu trả hàng</h3>
            <textarea value={returnLyDo} onChange={e => setReturnLyDo(e.target.value)}
              placeholder="Vui lòng nhập lý do trả hàng..."
              className="w-full border rounded-lg p-3 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setReturnOpen(false)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50">Hủy</button>
              <button onClick={handleRequestReturn} disabled={returning}
                className="flex-1 bg-orange-600 text-white rounded-lg py-2 text-sm hover:bg-orange-700 transition disabled:opacity-50">
                {returning ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedItem && (() => {
        const v = selectedItem.bienThe || {}
        const p = v.sanPham || {}
        const anh = v.urlAnh || p.urlAnhDaiDien || ''
        return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4" onClick={() => setSelectedItem(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full animate-scale-in shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="relative">
              <img src={anh} alt={p.tenSanPham} className="w-full h-72 object-cover object-center bg-gray-100"
                onError={(e) => { e.target.src = 'https://placehold.co/600x400/e2e8f0/475569?text=Polo' }} />
              <button onClick={() => setSelectedItem(null)} className="absolute top-3 right-3 bg-white/90 rounded-full p-1.5 hover:bg-white transition shadow-sm">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <h3 className="font-bold text-lg">{p.tenSanPham || 'Sản phẩm'}</h3>
                <p className="text-xs text-gray-400">SKU: {v.sku || '—'}</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-blue-700 font-bold text-xl">{VND(selectedItem.donGia || 0)}</span>
                <span className="text-gray-400">x{selectedItem.soLuong}</span>
                <span className="text-gray-600 font-semibold">= {VND(selectedItem.thanhTien || 0)}</span>
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                {v.mauSac?.mauSac && (
                  <span className="bg-gray-100 px-3 py-1 rounded-full text-gray-700">
                    Màu: <span className="font-medium">{v.mauSac.mauSac}</span>
                  </span>
                )}
                {v.kichCo?.kichCo && (
                  <span className="bg-gray-100 px-3 py-1 rounded-full text-gray-700">
                    Size: <span className="font-medium">{v.kichCo.kichCo}</span>
                  </span>
                )}
              </div>
              {p.moTa && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Mô tả</p>
                  <p className="text-sm text-gray-600 line-clamp-4">{p.moTa}</p>
                </div>
              )}
              {(p.slug || p.maSanPham) && (
                <a href={`/products/${p.slug || p.maSanPham}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-700 font-medium hover:underline mt-1">
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
