import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/axios'
import StatusBadge from '../../components/StatusBadge'
import SafeImg from '../../components/SafeImg'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { ArrowLeft, Package, CreditCard, Truck, Clock, User, MapPin, CheckCircle, AlertTriangle, XCircle, ShoppingBag, Home, Loader, X, Printer, Copy, Store } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog'
import { getOrderPrintData, registerOrderPrint } from '../../api/admin'
import InvoicePrint from '../../components/InvoicePrint'

const STATUS_STEPS = [
  { status: 1, label: 'Chưa xác nhận', icon: ShoppingBag },
  { status: 2, label: 'Đã xác nhận', icon: CheckCircle },
  { status: 3, label: 'Chờ giao', icon: Package },
  { status: 4, label: 'Đang giao', icon: Truck },
  { status: 6, label: 'Đã hoàn thành', icon: Home },
]

const STATUS_LABELS = {
  1: 'Chờ xác nhận', 2: 'Đã xác nhận', 3: 'Chờ lấy hàng', 4: 'Chờ giao hàng',
  5: 'Đã hủy', 6: 'Giao hàng thành công', 9: 'Giao hàng không thành công',
}

const PAYMENT_LABELS = { 1: 'COD', 2: 'VNPay', 3: 'Momo', 4: 'ZaloPay', 5: 'Tiền mặt', 6: 'VietQR' }

function OrderStatusStepper({ currentStatus, history, loaiDonHang, onShowHistory }) {
  const isPos = loaiDonHang === 2

  const POS_STEPS = [
    { status: 1, label: 'Tạo đơn', icon: ShoppingBag },
    { status: 6, label: 'Hoàn thành', icon: CheckCircle },
  ]

  const steps = isPos ? [1, 6] : [1, 2, 3, 4, 6]
  const stepDefs = isPos ? POS_STEPS : STATUS_STEPS
  const isSpecial = [5, 9].includes(currentStatus)

  let maxNormalStatus = currentStatus
  if (isSpecial) {
    const normalHistory = (history || [])
      .filter(h => ![5, 9].includes(h.trangThaiMoi))
      .map(h => h.trangThaiMoi)
    maxNormalStatus = normalHistory.length > 0 ? Math.max(...normalHistory) : -1
  }
  const maxIdx = steps.indexOf(maxNormalStatus)
  const visibleSteps = maxIdx >= 0 ? steps.slice(0, maxIdx + 1) : []

  const getTimeForStatus = (status) => {
    const h = history?.find(item => item.trangThaiMoi === status)
    return h ? { time: new Date(h.thoiGian).toLocaleString('vi-VN'), by: h.nguoiCapNhat?.hoTen || 'Hệ thống' } : null
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <h2 className="font-bold text-sm text-gray-800 mb-5 flex items-center gap-2">
        <span className="w-1 h-5 bg-[var(--primary-color)] rounded-full inline-block" />
        Trạng thái đơn hàng
      </h2>
      <div className="flex items-start justify-between relative">
        {/* Connector line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 z-0" />
        <div className="absolute top-5 left-0 h-0.5 bg-[var(--primary-color)] z-0 transition-all duration-500"
          style={{ width: `${(visibleSteps.length / steps.length) * 100}%` }} />

        {stepDefs.map((step, i) => {
          const isVisible = visibleSteps.includes(step.status)
          const isCurrent = !isSpecial && step.status === currentStatus
          const isCompleted = visibleSteps.includes(step.status) && !isCurrent
          const info = getTimeForStatus(step.status)
          const StepIcon = step.icon

          return (
            <div key={step.status} className="flex flex-col items-center relative z-10 flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                isCurrent ? 'bg-[var(--primary-color)] text-white ring-4 ring-[var(--primary-color)]/20' :
                isCompleted ? 'bg-[var(--primary-color)] text-white' :
                'bg-gray-200 text-gray-400'
              }`}>
                {isCompleted ? <CheckCircle className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
              </div>
              <p className={`text-xs font-semibold mt-2 text-center ${isCurrent ? 'text-[var(--primary-color)]' : isCompleted ? 'text-gray-700' : 'text-gray-400'}`}>
                {step.label}
              </p>
              {info && (
                <div className="text-center mt-1">
                  <p className="text-[10px] text-gray-500">{info.time}</p>
                  <p className="text-[10px] text-gray-400">{info.by}</p>
                </div>
              )}
              {isCurrent && !info && (
                <p className="text-[10px] text-[var(--primary-color)] font-medium mt-1">Đang xử lý...</p>
              )}
            </div>
          )
        })}

        {isSpecial && (
          <div className="flex flex-col items-center relative z-10">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100 text-red-500">
              <XCircle className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold mt-2 text-red-500">{STATUS_LABELS[currentStatus]}</p>
            {getTimeForStatus(currentStatus) && (
              <p className="text-[10px] text-gray-500 mt-1">{getTimeForStatus(currentStatus).time}</p>
            )}
          </div>
        )}
      </div>

      {/* History button */}
      {history && history.length > 0 && (
        <div className="mt-5 text-right">
          <button onClick={onShowHistory}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary-color)] hover:underline">
            <Clock className="h-4 w-4" /> Lịch sử thao tác
          </button>
        </div>
      )}
    </div>
  )
}

export default function AdminOrderDetail() {
  const { id } = useParams()
  const toast = useToast()
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(null)
  const [confirmStatus, setConfirmStatus] = useState(null)
  const [reconcileMode, setReconcileMode] = useState(null)
  const [reconciling, setReconciling] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [printData, setPrintData] = useState(null)
  const [printLoading, setPrintLoading] = useState(false)
  const [showPrint, setShowPrint] = useState(false)
  const [statusModal, setStatusModal] = useState(false)
  const [selectedNextStatus, setSelectedNextStatus] = useState(null)
  const [statusNote, setStatusNote] = useState('')
  const [notifyCustomer, setNotifyCustomer] = useState(false)
  const [historyModal, setHistoryModal] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError('')
    api.get(`/orders/admin/detail/${id}`)
      .then(r => setData(r.data))
      .catch(() => setError('Đơn hàng không tồn tại hoặc đã bị xóa'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!showPrint || !printData) return
    const timer = setTimeout(() => window.print(), 300)
    return () => clearTimeout(timer)
  }, [showPrint, printData])

  if (loading) return <div className="text-center py-12 text-gray-500">Đang tải...</div>
  if (error) return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">📦</div>
      <p className="text-gray-600 font-medium mb-1">Không tìm thấy đơn hàng #{id}</p>
      <p className="text-sm text-gray-400 mb-6">{error}</p>
      <Link to="/admin/orders/online" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary-color)] text-white font-semibold hover:opacity-90 transition">
        <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
      </Link>
    </div>
  )
  if (!data) return null

  const { order, items, payments, history } = data
  const backTo = order?.loaiDonHang === 2 ? '/admin/orders/pos' : '/admin/orders/online'

  const ONLINE_NEXT_STATUS = { 1: [2, 5], 2: [3, 5], 3: [4], 4: [6, 9] }
  const POS_NEXT_STATUS = { 1: [6, 5] }
  const NEXT_STATUS = order.loaiDonHang === 2 ? POS_NEXT_STATUS : ONLINE_NEXT_STATUS
  const baseNextStatuses = NEXT_STATUS[order.trangThaiDon] || []
  const hasUnpaidOnline = payments.some(p => p.phuongThuc > 1 && p.trangThaiThanhToan !== 2)
  // Legacy orders have no trusted stock movement record. The API deliberately
  // blocks status changes until an admin reconciles inventory first.
  const needsInventoryReconciliation = order.stockState === 'LEGACY'
  const nextStatuses = (needsInventoryReconciliation ? [] : baseNextStatuses).filter(s => {
    if (hasUnpaidOnline && (s === 2 || s === 3 || s === 4 || s === 6)) return false
    return true
  })

  const isAdmin = typeof user?.vaiTro === 'object' ? user?.vaiTro?.tenVaiTro === 'ADMIN' : user?.vaiTro === 'ADMIN'
  const isPos = order.loaiDonHang === 2
  const status = order.trangThaiDon
  const canPrint = isPos ? true : status === 5 ? isAdmin : status > 1

  const handleUpdateStatus = async (trangThai, ghiChu, shouldNotify = notifyCustomer) => {
    setUpdating(trangThai)
    try {
      await api.put(`/orders/admin/${id}/status`, {
        trangThai,
        ghiChu: ghiChu || null,
        thongBaoKhachHang: Boolean(shouldNotify),
      })
      const updated = await api.get(`/orders/admin/detail/${id}`).then(r => r.data)
      setData(updated)
      toast.success(`Đã cập nhật sang: ${STATUS_LABELS[trangThai]}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại')
    } finally {
      setUpdating(null)
    }
  }

  const handleReconcileInventory = async (stockWasDeducted) => {
    setReconciling(true)
    try {
      await api.put(`/orders/admin/${id}/inventory-reconciliation`, { stockWasDeducted })
      const updated = await api.get(`/orders/admin/detail/${id}`).then(r => r.data)
      setData(updated)
      toast.success('Đã đối soát tồn kho.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể đối soát tồn kho')
    } finally {
      setReconciling(false)
      setReconcileMode(null)
    }
  }

  const handlePrintOrder = async () => {
    setPrintLoading(true)
    try {
      const updated = await api.get(`/orders/admin/detail/${id}`).then(r => r.data)
      setData(updated)
      const d = await registerOrderPrint(updated.order.maDonHang)
      setPrintData(d)
      setShowPrint(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể in hóa đơn')
    } finally {
      setPrintLoading(false)
    }
  }

  const subtotal = items.reduce((s, i) => s + Number(i.thanhTien || 0), 0)
  const discount = order.soTienGiam || 0
  const shipping = order.phiVanChuyen || 0

  return (
    <div className="max-w-6xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Chi tiết đơn hàng</h1>
          <p className="text-sm text-gray-500 mt-1">
            Mã đơn hàng: <span className="font-semibold text-gray-700">{order.maDonHangCode || `#${order.maDonHang}`}</span>
            <span className="mx-2">|</span>
            Ngày tạo: {order.ngayDat ? new Date(order.ngayDat).toLocaleString('vi-VN') : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Tạo bởi: {order.nguoiTao?.hoTen || '---'}
            <span className="mx-2">|</span>
            Cập nhật gần nhất: {order.ngayCapNhat ? new Date(order.ngayCapNhat).toLocaleString('vi-VN') : '---'} {order.nguoiCapNhat ? `- ${order.nguoiCapNhat.hoTen}` : 'Hệ thống'}
          </p>
        </div>
        <Link to={backTo} className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (2/3) */}
        <div className="lg:col-span-2 space-y-0">
          {/* Status Stepper */}
          <OrderStatusStepper currentStatus={order.trangThaiDon} history={history} loaiDonHang={order.loaiDonHang} onShowHistory={() => setHistoryModal(true)} />

          {/* Stock reconciliation warning */}
          {order.stockState === 'LEGACY' && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-amber-800 text-sm">Đối soát tồn kho đơn cũ</h3>
                  <p className="text-xs text-amber-700 mt-1">Đơn này được tạo trước khi hệ thống theo dõi tồn kho.</p>
                  <div className="flex gap-3 mt-3">
                    <button onClick={() => setReconcileMode(false)} disabled={reconciling}
                      className="px-4 py-2 rounded-lg bg-white border border-amber-300 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition disabled:opacity-50">
                      Hàng chưa được trừ
                    </button>
                    <button onClick={() => setReconcileMode(true)} disabled={reconciling}
                      className="px-4 py-2 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition disabled:opacity-50">
                      Hàng đã được trừ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Customer & Shipping Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Customer Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-[var(--primary-color)] rounded-full inline-block" />
                Thông tin khách hàng
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tên khách hàng</span>
                  <span className="font-semibold text-gray-800">{order.tenNguoiNhan || order.nguoiDung?.hoTen || 'Khách lẻ'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Số điện thoại</span>
                  <span className="text-gray-700">{order.sdtNguoiNhan || order.nguoiDung?.soDienThoai || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="text-gray-700">{order.nguoiDung?.email || '—'}</span>
                </div>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-[var(--primary-color)] rounded-full inline-block" />
                Thông tin giao hàng
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500 block mb-1">Địa chỉ</span>
                  <p className="text-gray-700">{order.diaChiGiaoHang || '—'}</p>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Loại đơn</span>
                  <span className="font-semibold text-gray-800">{isPos ? 'Tại quầy' : 'Online'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Ghi chú</span>
                  <p className="text-gray-700">{order.ghiChu || '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <h2 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-[var(--primary-color)] rounded-full inline-block" />
              Lịch sử thanh toán
            </h2>
            {payments.length === 0 ? (
              <p className="text-sm text-gray-400">Chưa có lịch sử thanh toán</p>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p.maThanhToan || p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">{PAYMENT_LABELS[p.phuongThuc] || p.phuongThuc}</span>
                      {p.thoiGianTt && <span className="text-xs text-gray-400 ml-2">{new Date(p.thoiGianTt).toLocaleString('vi-VN')}</span>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800">{VND(p.soTien || 0)}</p>
                      {p.trangThaiThanhToan === 2 && <span className="text-xs text-green-600">Đã thanh toán</span>}
                      {p.trangThaiThanhToan === 1 && <span className="text-xs text-amber-600">Chờ thanh toán</span>}
                      {p.trangThaiThanhToan === 3 && <span className="text-xs text-red-500">Thất bại</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product List */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <h2 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-[var(--primary-color)] rounded-full inline-block" />
              Danh sách sản phẩm ({items.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-center font-semibold text-gray-600 text-xs pb-3 px-2">STT</th>
                    <th className="text-center font-semibold text-gray-600 text-xs pb-3 px-2">Mã biến thể</th>
                    <th className="text-left font-semibold text-gray-600 text-xs pb-3 px-2">Tên sản phẩm</th>
                    <th className="text-center font-semibold text-gray-600 text-xs pb-3 px-2">Kích cỡ</th>
                    <th className="text-center font-semibold text-gray-600 text-xs pb-3 px-2">Màu sắc</th>
                    <th className="text-center font-semibold text-gray-600 text-xs pb-3 px-2">Số lượng</th>
                    <th className="text-right font-semibold text-gray-600 text-xs pb-3 px-2">Đơn giá</th>
                    <th className="text-right font-semibold text-gray-600 text-xs pb-3 px-2">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const variant = item.bienThe || {}
                    const product = variant.sanPham || {}
                    return (
                      <tr key={item.maMucDonHang || idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                        <td className="text-center py-3 px-2 text-gray-500">{idx + 1}</td>
                        <td className="text-center py-3 px-2 font-medium text-gray-700">{variant.sku || `CTSP${String(variant.maBienThe || '').padStart(3, '0')}`}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                              <SafeImg src={variant.urlAnh || product.urlAnhDaiDien} alt="" className="w-full h-full object-cover" fallback="https://placehold.co/80x80/e2e8f0/475569?text=Polo" />
                            </div>
                            <span className="font-medium text-gray-800">{product.tenSanPham || `SP #${product.maSanPham}`}</span>
                          </div>
                        </td>
                        <td className="text-center py-3 px-2 text-gray-700">{variant.kichCo?.kichCo || '—'}</td>
                        <td className="text-center py-3 px-2">
                          <div className="flex items-center justify-center gap-1.5">
                            {variant.mauSac?.maMauHex && <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: variant.mauSac.maMauHex }} />}
                            <span className="text-gray-700">{variant.mauSac?.mauSac || '—'}</span>
                          </div>
                        </td>
                        <td className="text-center py-3 px-2 text-gray-700">{item.soLuong}</td>
                        <td className="text-right py-3 px-2 text-gray-700">{VND(item.donGia || 0)}</td>
                        <td className="text-right py-3 px-2 font-semibold text-gray-800">{VND(item.thanhTien || 0)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={handlePrintOrder} disabled={printLoading || !canPrint}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                {printLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                In hóa đơn
              </button>
              {nextStatuses.length > 0 && (
                <button onClick={() => {
                    // Always open the form so every transition can carry an
                    // optional note and a customer-visibility choice.
                    setSelectedNextStatus(nextStatuses[0])
                    setStatusNote('')
                    setNotifyCustomer(false)
                    setStatusModal(true)
                  }} disabled={updating !== null}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary-color)] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition disabled:opacity-50">
                  {updating ? <Loader className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Cập nhật trạng thái
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Right column (1/3) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-4">
            <h2 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-[var(--primary-color)] rounded-full inline-block" />
              Tổng kết thanh toán
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Tổng tiền hàng</span>
                <span className="font-medium text-gray-700">{VND(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Giảm giá</span>
                  <span className="font-medium text-red-500">-{VND(discount)}</span>
                </div>
              )}
              {order.phieuGiamGia?.maCode && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-semibold">{order.phieuGiamGia.maCode}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Giảm {discount > 0 ? VND(discount) : `${order.phieuGiamGia.giaTriGiam || 0}%`}</p>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Phí vận chuyển</span>
                <span className="font-medium text-gray-700">{shipping > 0 ? VND(shipping) : '---'}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-800">TỔNG TIỀN</span>
                  <span className="font-bold text-lg text-[var(--primary-color)]">{VND(order.tongTien || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Selection Modal */}
      {statusModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setStatusModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold text-lg text-gray-800 mb-4">Cập nhật trạng thái</h2>
            <div className="mb-4">
              <label className="text-sm font-semibold text-gray-700 block mb-1">TRẠNG THÁI MỚI *</label>
              <select value={selectedNextStatus || ''} onChange={(e) => setSelectedNextStatus(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary-color)]">
                {nextStatuses.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div className="mb-6">
              <label className="text-sm font-semibold text-gray-700 block mb-1">GHI CHÚ</label>
              <textarea value={statusNote} onChange={(e) => setStatusNote(e.target.value)} rows={3} maxLength={500}
                placeholder="Nhập ghi chú (không bắt buộc)"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary-color)] resize-none" />
            </div>
            <label className="flex items-start gap-2.5 mb-6 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={notifyCustomer}
                onChange={(e) => setNotifyCustomer(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[var(--primary-color)]"
              />
              <span className="text-sm text-gray-700">
                <span className="font-semibold block">Thông báo cho khách hàng</span>
                <span className="text-xs text-gray-500">Khách hàng sẽ thấy ghi chú này trong lịch sử đơn hàng.</span>
              </span>
            </label>
            <div className="flex justify-end gap-3">
              <button onClick={() => setStatusModal(false)}
                className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
                Hủy bỏ
              </button>
              <button onClick={() => {
                  setStatusModal(false)
                  setConfirmStatus(selectedNextStatus)
                }}
                className="px-5 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 transition">
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Status Dialog */}
      <ConfirmDialog
        open={confirmStatus !== null}
        title="Xác nhận cập nhật"
        message={<>Bạn có chắc muốn chuyển đơn hàng <span className="font-semibold">#{order.maDonHang}</span> sang trạng thái <span className="font-semibold text-[var(--primary-color)]">{STATUS_LABELS[confirmStatus]}</span>?</>}
        confirmText="Xác nhận"
        variant={confirmStatus === 5 ? 'danger' : 'gold'}
        loading={updating === confirmStatus}
        onConfirm={() => {
          const note = statusNote
          const notify = notifyCustomer
          setConfirmStatus(null)
          setStatusNote('')
          setNotifyCustomer(false)
          handleUpdateStatus(confirmStatus, note, notify)
        }}
        onCancel={() => { setConfirmStatus(null); setStatusNote(''); setNotifyCustomer(false) }}
      />

      <ConfirmDialog
        open={reconcileMode !== null}
        title="Xác nhận đối soát tồn kho"
        message={reconcileMode
          ? <>Xác nhận hàng của đơn <span className="font-semibold">#{order.maDonHang}</span> <span className="font-semibold">đã được trừ khỏi tồn kho</span>.</>
          : <>Xác nhận hàng của đơn <span className="font-semibold">#{order.maDonHang}</span> <span className="font-semibold">chưa được trừ khỏi tồn kho</span>.</>}
        confirmText="Xác nhận đối soát"
        variant="gold"
        loading={reconciling}
        onConfirm={() => handleReconcileInventory(reconcileMode)}
        onCancel={() => setReconcileMode(null)}
      />

      {/* Print Dialog */}
      {showPrint && printData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4" onClick={() => setShowPrint(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="font-bold flex items-center gap-2">
                <Printer className="h-5 w-5 text-[var(--primary-color)]" /> Hóa đơn {printData.maHoaDonCode}
              </h3>
              <button onClick={() => setShowPrint(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X className="h-5 w-5" />
              </button>
            </div>
            <InvoicePrint data={printData} />
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setShowPrint(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                Đóng
              </button>
              <button onClick={() => handlePrintOrder()} disabled={printLoading}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                {printLoading ? <Loader className="h-4 w-4 animate-spin" /> : 'In lại'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setHistoryModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
              <h3 className="font-bold text-base text-gray-800 flex items-center gap-2">
                <Clock className="h-5 w-5 text-[var(--primary-color)]" /> Lịch sử thao tác hóa đơn
              </h3>
              <button onClick={() => setHistoryModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4 flex-1">
              {(history || []).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Chưa có lịch sử thao tác</p>
              ) : (
                <div className="space-y-5">
                  {[...(history || [])].map((h, i) => {
                    const oldLabel = h.trangThaiCu != null ? (STATUS_LABELS[h.trangThaiCu] || `Trạng thái ${h.trangThaiCu}`) : null
                    const newLabel = STATUS_LABELS[h.trangThaiMoi] || `Trạng thái ${h.trangThaiMoi}`
                    const timeStr = h.thoiGian ? new Date(h.thoiGian).toLocaleString('vi-VN') : '-'
                    const userStr = h.nguoiCapNhat?.maNhanVien
                      ? `${h.nguoiCapNhat.maNhanVien} - ${h.nguoiCapNhat.hoTen}`
                      : (h.nguoiCapNhat?.hoTen || 'Hệ thống')
                    return (
                      <div key={i} className="flex gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary-color)] mt-1.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">
                            Cập nhật trạng thái đơn hàng - Phân thay đổi: Trạng thái đơn hàng
                            {oldLabel ? <span> Từ <span className="font-semibold">{oldLabel}</span> - Thành <span className="font-semibold">{newLabel}</span></span> : <span> - Thành <span className="font-semibold">{newLabel}</span></span>}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Thời gian: {timeStr}</p>
                          <p className="text-xs text-gray-500">Người thực hiện: {userStr}</p>
                          {h.ghiChu && (
                            <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2">
                              <p className="text-xs text-gray-500 italic">"{h.ghiChu}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t border-gray-200 flex justify-end shrink-0">
              <button onClick={() => setHistoryModal(false)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold text-gray-700 transition">
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function VND(n) { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }
