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

const PAYMENT_LABELS = { 1: 'COD', 2: 'VNPay', 3: 'Momo', 4: 'ZaloPay', 5: 'Tiền mặt', 6: 'VietQR' }

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
  const visibleSteps = steps;

  const getTimeForStatus = (status) => {
    const h = history?.find(item => item.trangThaiMoi === status);
    return h ? new Date(h.thoiGian).toLocaleString('vi-VN') : null;
  };

  return (
    <div className="overflow-x-auto mb-6">
      <div className="flex items-center min-w-fit">
        {visibleSteps.map((s, i) => {
          const stepDef = stepDefs.find(st => st.status === s);
          const Icon = stepDef.icon;
          const isCurrent = !isSpecial && s === currentStatus;
          const isCompleted = maxIdx >= i;
          const time = getTimeForStatus(s);

          return (
            <div key={s} className="flex items-center">
              {i > 0 && (
                <div className={`w-8 sm:w-12 h-0.5 mx-1 sm:mx-2 ${maxIdx >= i ? 'bg-gold' : 'bg-stone/15'}`} />
              )}
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 transition-all duration-300
                  ${isCurrent ? 'bg-gold text-noir ring-4 ring-gold/30 animate-pulse' : isCompleted ? 'bg-gold text-noir' : 'bg-white border-2 border-stone/25 text-stone'}`}>
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <p className={`text-[10px] sm:text-xs font-semibold mt-1.5 text-center whitespace-nowrap ${isCompleted ? 'text-ink' : 'text-stone'}`}>
                  {stepDef.label}
                </p>
                {time && isCompleted && (
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
                <XCircle className="h-5 w-5 sm:h-6 sm:w-6" />
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

export default function AdminOrderDetail() {
  const { id } = useParams()
  const toast = useToast()
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(null)
  const [confirmStatus, setConfirmStatus] = useState(null)
  const [statusNote, setStatusNote] = useState('')
  const [reconcileMode, setReconcileMode] = useState(null)
  const [reconciling, setReconciling] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [printData, setPrintData] = useState(null)
  const [printLoading, setPrintLoading] = useState(false)
  const [showPrint, setShowPrint] = useState(false)

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

  if (loading) return <div className="text-center py-12 text-stone">Đang tải...</div>
  if (error) return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">📦</div>
      <p className="text-stone font-medium mb-1">Không tìm thấy đơn hàng #{id}</p>
      <p className="text-sm text-stone-light mb-6">{error}</p>
      <Link to="/admin/orders" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-noir font-semibold hover:bg-gold-hover transition">
        <ArrowLeft className="h-4 w-4" /> Quay lại danh sách đơn hàng
      </Link>
    </div>
  )
  if (!data) return null

  const { order, items, payments, history } = data
  const backTo = '/admin/orders'

  const ONLINE_NEXT_STATUS = { 1: [2, 5], 2: [3, 5], 3: [4], 4: [6, 9] }
  const POS_NEXT_STATUS = { 1: [6, 5] }
  const NEXT_STATUS = order.loaiDonHang === 2 ? POS_NEXT_STATUS : ONLINE_NEXT_STATUS
  const baseNextStatuses = NEXT_STATUS[order.trangThaiDon] || []
  const hasUnpaidOnline = payments.some(p => p.phuongThuc > 1 && p.trangThaiThanhToan !== 2)
  const nextStatuses = baseNextStatuses.filter(s => {
    if (hasUnpaidOnline && (s === 2 || s === 3 || s === 4 || s === 6)) return false
    return true
  })

  const isAdmin = typeof user?.vaiTro === 'object' ? user?.vaiTro?.tenVaiTro === 'ADMIN' : user?.vaiTro === 'ADMIN'
  const isPos = order.loaiDonHang === 2
  const copyText = async (value, label) => { try { await navigator.clipboard.writeText(value); toast.success(`Đã sao chép ${label}`) } catch { toast.error('Không thể sao chép') } }
  const status = order.trangThaiDon
  const canPrint = isPos
    ? true
    : status === 5
      ? isAdmin
      : status > 1
  const printBlockReason = !canPrint
    ? status === 1
      ? 'Đơn hàng chưa được xác nhận nên chưa thể in.'
      : status === 5
        ? 'Đơn hàng đã hủy. Chỉ quản lý mới được in hóa đơn.'
        : ''
    : ''

  const handleUpdateStatus = async (trangThai, ghiChu = '') => {
    setUpdating(trangThai)
    try {
      await api.put(`/orders/admin/${id}/status`, { trangThai, ghiChu: ghiChu.trim() || null })
      const updated = await api.get(`/orders/admin/detail/${id}`).then(r => r.data)
      setData(updated)
      setStatusNote('')
      toast.success(`Đã cập nhật sang: ${STATUS_LABELS[trangThai]}`)
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại')
      return false
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
      toast.success('Đã đối soát tồn kho. Bạn có thể tiếp tục chuyển trạng thái đơn hàng.')
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
      const data = await registerOrderPrint(updated.order.maDonHang)
      setPrintData(data)
      setShowPrint(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể in hóa đơn')
    } finally {
      setPrintLoading(false)
    }
  }

  const handlePreview = async () => {
    setPrintLoading(true)
    try {
      const data = await getOrderPrintData(id)
      setPrintData(data)
      setShowPrint(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tải dữ liệu hóa đơn')
    } finally {
      setPrintLoading(false)
    }
  }

  return (
    <div className="max-w-[1440px] mx-auto pb-28 lg:pb-8">
      <Link to={backTo} className="inline-flex items-center gap-1 text-sm text-stone hover:text-ink-soft mb-4">
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </Link>

      <div className="bg-ivory rounded-2xl border border-stone/10 shadow-sm p-5 sm:p-6 mb-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2"><h1 className="text-xl font-bold">Đơn hàng #{order.maDonHang}</h1><span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-gold/15 text-noir"><Store className="h-3 w-3" />{isPos ? 'Tại quầy POS' : 'Website'}</span></div>
            <p className="text-sm text-stone">{order.ngayDat ? new Date(order.ngayDat).toLocaleString('vi-VN') : '—'}</p>
            {order.maDonHangCode && <p className="text-xs text-stone mt-0.5">Mã: {order.maDonHangCode}</p>}
          </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={order.trangThaiDon} loaiDonHang={order.loaiDonHang} />
              <button onClick={handlePrintOrder} disabled={printLoading || !canPrint} title={printBlockReason}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold text-noir text-sm font-semibold hover:bg-gold-hover transition disabled:opacity-40 disabled:cursor-not-allowed">
                {printLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                {(order.soLanIn || 0) > 0 ? 'In lại hóa đơn' : 'In ngay'}
              </button>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-stone">
            {!canPrint ? (
              <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
                <AlertTriangle className="h-3.5 w-3.5" /> {printBlockReason}
              </span>
            ) : (order.soLanIn || 0) > 0 ? (
              <>Đã in <span className="font-semibold text-gold">{order.soLanIn}</span> lần</>
            ) : (
              'Chưa in hóa đơn'
            )}
          </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-5 mb-5">
        <section className="rounded-2xl border border-stone/10 bg-ivory p-5 sm:p-6 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 text-base font-bold text-ink"><Truck className="h-5 w-5 text-gold" /> Trạng thái đơn hàng</h2>
          <OrderStatusStepper currentStatus={order.trangThaiDon} history={history} loaiDonHang={order.loaiDonHang} />
        </section>
        <aside className="rounded-2xl border border-stone/10 bg-ivory p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-ink"><CreditCard className="h-5 w-5 text-gold" /> Tổng kết thanh toán</h2>
          <div className="space-y-3 text-sm"><div className="flex justify-between text-stone"><span>Tổng tiền hàng</span><span className="font-medium text-ink">{VND(items.reduce((sum, item) => sum + Number(item.thanhTien || 0), 0))}</span></div>{(order.soTienGiam || 0) > 0 && <div className="flex justify-between text-emerald-deep"><span>Giảm giá</span><span>-{VND(order.soTienGiam)}</span></div>}<div className="flex justify-between text-stone"><span>Phí vận chuyển</span><span>{Number(order.phiVanChuyen || 0) > 0 ? `+${VND(order.phiVanChuyen)}` : 'Miễn phí'}</span></div><div className="border-t border-stone/10 pt-3 flex justify-between text-base font-bold"><span>TỔNG TIỀN</span><span className="text-gold">{VND(order.tongTien || 0)}</span></div></div>
        </aside>
      </div>

      {order.stockState === 'LEGACY' && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 mb-6 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-700 mt-0.5 shrink-0" />
            <div>
              <h2 className="font-semibold text-amber-950">Đối soát tồn kho đơn cũ</h2>
              <p className="text-sm text-amber-900/80 mt-1">Đơn này được tạo trước khi hệ thống theo dõi tồn kho. Chọn theo tình trạng thực tế để không làm lệch kho.</p>
              <div className="flex flex-wrap gap-3 mt-4">
                <button onClick={() => setReconcileMode(false)} disabled={reconciling}
                  className="px-4 py-2 rounded-xl bg-white border border-amber-300 text-amber-950 text-sm font-semibold hover:bg-amber-100 transition disabled:opacity-50">
                  Hàng chưa được trừ
                </button>
                <button onClick={() => setReconcileMode(true)} disabled={reconciling}
                  className="px-4 py-2 rounded-xl bg-amber-700 text-white text-sm font-semibold hover:bg-amber-800 transition disabled:opacity-50">
                  Hàng đã được trừ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {nextStatuses.length > 0 && (
        <div className="bg-ivory rounded-2xl border border-stone/10 shadow-sm p-6 mb-6">
          <h2 className="text-base font-semibold text-ink flex items-center gap-2 mb-4">
            <Truck className="h-5 w-5 text-gold" /> Cập nhật trạng thái
          </h2>
          <div className="flex gap-3 flex-wrap">
            {nextStatuses.map((s) => (
              <button key={s} onClick={() => { setStatusNote(''); setConfirmStatus(s) }} disabled={updating !== null}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 ${s === 5 ? 'bg-bordeaux/10 text-bordeaux border border-bordeaux/20 hover:bg-bordeaux/20' : 'bg-gold text-noir hover:bg-gold-hover'}`}>
                {updating === s && <Loader className="h-4 w-4 animate-spin" />}
                {STATUS_LABELS[s] || s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 mb-5">
        <section className="rounded-2xl border border-stone/10 bg-ivory p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-ink"><User className="h-5 w-5 text-gold" /> Thông tin khách hàng</h2>
          <dl className="space-y-3 text-sm"><div className="flex items-start justify-between gap-4 border-b border-stone/10 pb-2"><dt className="text-stone">Tên khách hàng</dt><dd className="text-right font-semibold">{order.tenNguoiNhan || order.nguoiDung?.hoTen || 'Khách lẻ'}</dd></div><div className="flex items-center justify-between gap-4 border-b border-stone/10 pb-2"><dt className="text-stone">Số điện thoại</dt><dd className="flex items-center gap-1.5 text-right font-medium">{order.sdtNguoiNhan || order.nguoiDung?.soDienThoai || '—'}{(order.sdtNguoiNhan || order.nguoiDung?.soDienThoai) && <button onClick={() => copyText(order.sdtNguoiNhan || order.nguoiDung?.soDienThoai, 'số điện thoại')} className="rounded p-1 text-gold hover:bg-gold/10" title="Sao chép"><Copy className="h-3.5 w-3.5" /></button>}</dd></div><div className="flex items-start justify-between gap-4"><dt className="text-stone">Email</dt><dd className="max-w-[65%] break-all text-right text-xs font-medium">{order.nguoiDung?.email || '—'}</dd></div></dl>
        </section>
        <section className="rounded-2xl border border-stone/10 bg-ivory p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-ink"><MapPin className="h-5 w-5 text-gold" /> Thông tin giao hàng</h2>
          <dl className="space-y-3 text-sm"><div className="flex items-start justify-between gap-4 border-b border-stone/10 pb-2"><dt className="text-stone">Loại đơn</dt><dd className="font-semibold">{isPos ? 'Tại quầy POS' : 'Online'}</dd></div>{!isPos && <div className="flex items-start justify-between gap-3 border-b border-stone/10 pb-2"><dt className="shrink-0 text-stone">Địa chỉ</dt><dd className="flex items-start gap-1 text-right text-xs leading-5 font-medium">{order.diaChiGiaoHang || '—'}{order.diaChiGiaoHang && <button onClick={() => copyText(order.diaChiGiaoHang, 'địa chỉ')} className="shrink-0 rounded p-1 text-gold hover:bg-gold/10" title="Sao chép"><Copy className="h-3.5 w-3.5" /></button>}</dd></div>}<div className="flex items-start justify-between gap-4"><dt className="text-stone">Ghi chú</dt><dd className="max-w-[65%] text-right text-xs font-medium">{order.ghiChu || '—'}</dd></div></dl>
        </section>
        <section className="rounded-2xl border border-stone/10 bg-ivory p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-ink"><Clock className="h-5 w-5 text-gold" /> Lịch sử thanh toán</h2>
          {payments.length === 0 ? <div className="flex h-24 items-center justify-center rounded-xl bg-ivory-100 text-sm text-stone">Chưa có giao dịch thanh toán</div> : <div className="space-y-2.5">{payments.map(p => <div key={p.maThanhToan || p.id} className="rounded-xl border border-stone/10 bg-white px-3 py-2.5"><div className="flex items-center justify-between gap-3"><span className="font-semibold text-sm">{PAYMENT_LABELS[p.phuongThuc] || p.nhaCungCap || p.phuongThuc}</span><span className={`text-xs font-bold ${p.trangThaiThanhToan === 2 ? 'text-emerald-deep' : p.trangThaiThanhToan === 3 ? 'text-bordeaux' : 'text-gold'}`}>{p.trangThaiThanhToan === 2 ? 'Đã thanh toán' : p.trangThaiThanhToan === 3 ? 'Thất bại' : 'Chờ thanh toán'}</span></div><div className="mt-1 flex justify-between text-xs text-stone"><span>{p.thoiGianTt ? new Date(p.thoiGianTt).toLocaleString('vi-VN') : 'Chưa có thời gian'}</span><span className="font-semibold text-ink">{VND(p.soTien || 0)}</span></div></div>)}</div>}
        </section>
      </div>

      {(history || []).length > 0 && (
        <div className="bg-ivory rounded-2xl border border-stone/10 shadow-sm p-6 mb-6">
          <h2 className="text-base font-semibold text-ink flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-gold" /> Lịch sử trạng thái
          </h2>
          <div className="space-y-3">
            {[...(history || [])].reverse().map((h, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-gold/100 mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{STATUS_LABELS[h.trangThaiMoi] || h.trangThaiMoi}</p>
                  <p className="text-xs text-stone">
                    {h.nguoiCapNhat?.hoTen || 'Hệ thống'} &middot; {h.thoiGian ? new Date(h.thoiGian).toLocaleString('vi-VN') : '-'}
                  </p>
                  {h.ghiChu && <p className="text-xs text-stone">{h.ghiChu}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-ivory rounded-2xl border border-stone/10 shadow-sm p-6 mb-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <Package className="h-5 w-5 text-gold" /> Danh sách sản phẩm
          </h2>
          <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold-hover">
            {items.length} mặt hàng
          </span>
        </div>
        <div className="overflow-x-auto rounded-xl border border-stone/15">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="bg-noir text-ivory">
              <tr>
                <th className="w-14 px-4 py-3 text-center font-semibold">STT</th>
                <th className="w-20 px-3 py-3 font-semibold">Ảnh</th>
                <th className="px-3 py-3 font-semibold">SKU</th>
                <th className="min-w-[220px] px-3 py-3 font-semibold">Tên sản phẩm</th>
                <th className="px-3 py-3 font-semibold">Màu sắc</th>
                <th className="px-3 py-3 text-center font-semibold">Kích cỡ</th>
                <th className="px-3 py-3 text-center font-semibold">Số lượng</th>
                <th className="px-3 py-3 text-right font-semibold">Đơn giá</th>
                <th className="px-4 py-3 text-right font-semibold">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone/15">
              {items.map((item, index) => {
                const variant = item.bienThe || {}
                const product = variant.sanPham || {}
                const anh = variant.urlAnh || product.urlAnhDaiDien || ''
                const lineTotal = item.thanhTien ?? Number(item.donGia || 0) * Number(item.soLuong || 0)
                return (
                  <tr
                    key={item.maMucDonHang || item.id || index}
                    className="cursor-pointer bg-white/40 transition hover:bg-gold/5"
                    onClick={() => setSelectedItem(item)}
                    title="Nhấn để xem chi tiết sản phẩm"
                  >
                    <td className="px-4 py-3 text-center font-medium text-stone">{index + 1}</td>
                    <td className="px-3 py-3">
                      <div className="h-14 w-14 overflow-hidden rounded-lg border border-stone/10 bg-ivory-100">
                        <SafeImg src={anh} alt={product.tenSanPham || 'Sản phẩm'} className="h-full w-full object-cover object-center" fallback="https://placehold.co/100x100/e2e8f0/475569?text=Polo" />
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs font-semibold text-ink">{variant.sku || '—'}</td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-ink">{product.tenSanPham || `Sản phẩm #${product.maSanPham || '—'}`}</p>
                      <p className="mt-0.5 text-xs text-stone">Mã SP: {product.maSanPhamCode || product.maSanPham || '—'}</p>
                    </td>
                    <td className="px-3 py-3 text-ink-soft">{variant.mauSac?.mauSac || '—'}</td>
                    <td className="px-3 py-3 text-center font-medium">{variant.kichCo?.kichCo || '—'}</td>
                    <td className="px-3 py-3 text-center font-semibold">{item.soLuong || 0}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">{VND(item.donGia || 0)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-gold-hover">{VND(lineTotal)}</td>
                  </tr>
                )
              })}
              {items.length === 0 && (
                <tr><td colSpan="9" className="px-4 py-10 text-center text-stone">Đơn hàng chưa có sản phẩm</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <hr className="border-t mt-4" />
        <div className="pt-4 space-y-1 text-sm">
          <div className="flex justify-between text-stone"><span>Tạm tính</span><span>{VND(items.reduce((s, i) => s + Number(i.thanhTien), 0))}</span></div>
          {(order.soTienGiam || 0) > 0 && <div className="flex justify-between text-emerald-deep"><span>Giảm giá {order.phieuGiamGia?.maCode ? <span className="text-xs">({order.phieuGiamGia.maCode})</span> : ''}</span><span>-{VND(order.soTienGiam)}</span></div>}
          {(order.phiVanChuyen || 0) > 0 && <div className="flex justify-between text-stone"><span>Phí vận chuyển</span><span>{VND(order.phiVanChuyen)}</span></div>}
          <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Tổng cộng</span><span className="text-gold">{VND(order.tongTien || 0)}</span></div>
        </div>
      </div>

      {payments.length > 0 && (
        <div className="hidden bg-ivory rounded-2xl border border-stone/10 shadow-sm p-6 mb-6">
          <h2 className="text-base font-semibold text-ink flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-gold" /> Thanh toán
          </h2>
          <div className="space-y-3 text-sm">
            {payments.map((p) => (
              <div key={p.maThanhToan || p.id} className="flex items-center justify-between p-3 bg-ivory-100 rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink-soft">{PAYMENT_LABELS[p.phuongThuc] || p.nhaCungCap || p.phuongThuc}</span>
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
                  <p className="text-xs text-stone mt-0.5">{VND(p.soTien || 0)}</p>
                  {p.maGiaoDich && p.trangThaiThanhToan === 2 && (
                    <p className="text-xs text-stone mt-0.5">GD: {p.maGiaoDich}</p>
                  )}
                  {p.thoiGianTt && p.trangThaiThanhToan === 2 && (
                    <p className="text-xs text-stone">{new Date(p.thoiGianTt).toLocaleString('vi-VN')}</p>
                  )}
                  {p.refunded && <p className="text-xs font-semibold text-bordeaux mt-1">Đã hoàn tiền {VND(p.soTien || 0)} vào ví</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="hidden bg-ivory rounded-2xl border border-stone/10 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-ink flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-gold" /> Thông tin giao hàng
        </h2>
        <div className="text-sm space-y-1">
          <p><span className="text-stone">Khách hàng:</span> {order.tenNguoiNhan || order.nguoiDung?.hoTen || 'Khách lẻ'}</p>
          <p className="flex items-center gap-2"><span className="text-stone">SĐT:</span> {order.sdtNguoiNhan || order.nguoiDung?.soDienThoai || '—'}{(order.sdtNguoiNhan || order.nguoiDung?.soDienThoai) && <button onClick={() => copyText(order.sdtNguoiNhan || order.nguoiDung?.soDienThoai, 'số điện thoại')} className="text-gold hover:bg-gold/10 p-1 rounded" title="Sao chép"><Copy className="h-3.5 w-3.5" /></button>}</p>
          <p><span className="text-stone">Email:</span> {order.nguoiDung?.email || '—'}</p>
          {(order.loaiDonHang !== 2) && <p className="flex items-start gap-2"><span className="text-stone shrink-0">Địa chỉ:</span> {order.diaChiGiaoHang || '—'}{order.diaChiGiaoHang && <button onClick={() => copyText(order.diaChiGiaoHang, 'địa chỉ')} className="text-gold hover:bg-gold/10 p-1 rounded" title="Sao chép"><Copy className="h-3.5 w-3.5" /></button>}</p>}
          {order.ghiChu && <p><span className="text-stone">Ghi chú:</span> {order.ghiChu}</p>}
        </div>
      </div>

      {confirmStatus !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm animate-fade-in" onClick={() => { if (!updating) { setConfirmStatus(null); setStatusNote('') } }}>
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-stone/10 bg-ivory shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-stone/10 px-6 py-5">
              <div>
                <h3 className="text-lg font-bold text-ink">Cập nhật trạng thái</h3>
                <p className="mt-1 text-xs text-stone">Đơn hàng #{order.maDonHang}</p>
              </div>
              <button type="button" disabled={updating !== null} onClick={() => { setConfirmStatus(null); setStatusNote('') }} className="rounded-lg p-1.5 text-stone transition hover:bg-stone/10 hover:text-ink disabled:opacity-40" aria-label="Đóng">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-5 px-6 py-5">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone">Trạng thái mới</label>
                <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${confirmStatus === 5 ? 'border-bordeaux/20 bg-bordeaux/5 text-bordeaux' : 'border-gold/30 bg-gold/10 text-gold-hover'}`}>
                  {STATUS_LABELS[confirmStatus]}
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="status-note" className="text-xs font-semibold uppercase tracking-wide text-stone">Ghi chú thao tác <span className="normal-case font-normal">(không bắt buộc)</span></label>
                  <span className="text-[11px] text-stone">{statusNote.length}/500</span>
                </div>
                <textarea
                  id="status-note"
                  value={statusNote}
                  maxLength={500}
                  rows={4}
                  autoFocus
                  onChange={e => setStatusNote(e.target.value)}
                  placeholder="Ví dụ: Đã kiểm tra hàng, bàn giao cho đơn vị vận chuyển..."
                  className="w-full resize-none rounded-xl border border-stone/20 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-stone/60 focus:border-gold focus:ring-2 focus:ring-gold/15"
                />
                <p className="mt-1.5 text-xs text-stone">Ghi chú sẽ được lưu trong lịch sử trạng thái của đơn hàng.</p>
              </div>
            </div>
            <div className="flex gap-3 border-t border-stone/10 bg-white/30 px-6 py-4">
              <button type="button" disabled={updating !== null} onClick={() => { setConfirmStatus(null); setStatusNote('') }} className="flex-1 rounded-xl border border-stone/20 py-2.5 text-sm font-semibold text-ink transition hover:bg-ivory-100 disabled:opacity-50">Hủy bỏ</button>
              <button
                type="button"
                disabled={updating !== null}
                onClick={async () => {
                  const saved = await handleUpdateStatus(confirmStatus, statusNote)
                  if (saved) setConfirmStatus(null)
                }}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition disabled:opacity-50 ${confirmStatus === 5 ? 'bg-bordeaux text-white hover:bg-bordeaux/90' : 'bg-gold text-noir hover:bg-gold-hover'}`}
              >
                {updating === confirmStatus ? <Loader className="mx-auto h-4 w-4 animate-spin" /> : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={reconcileMode !== null}
        title="Xác nhận đối soát tồn kho"
        message={reconcileMode
          ? <>Xác nhận hàng của đơn <span className="font-semibold">#{order.maDonHang}</span> <span className="font-semibold">đã được trừ khỏi tồn kho</span>. Khi hủy/trả hàng, hệ thống sẽ cộng hàng lại.</>
          : <>Xác nhận hàng của đơn <span className="font-semibold">#{order.maDonHang}</span> <span className="font-semibold">chưa được trừ khỏi tồn kho</span>. Khi xác nhận đơn, hệ thống sẽ trừ hàng một lần.</>}
        confirmText="Xác nhận đối soát"
        variant="gold"
        loading={reconciling}
        onConfirm={() => handleReconcileInventory(reconcileMode)}
        onCancel={() => setReconcileMode(null)}
      />

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

      {showPrint && printData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4" onClick={() => setShowPrint(false)}>
          <div className="bg-ivory rounded-2xl max-w-lg w-full shadow-xl overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone/10 sticky top-0 bg-ivory">
              <h3 className="font-bold flex items-center gap-2">
                <Printer className="h-5 w-5 text-gold" /> Hóa đơn {printData.maHoaDonCode}
              </h3>
              <button onClick={() => setShowPrint(false)} className="text-stone hover:text-ink transition">
                <X className="h-5 w-5" />
              </button>
            </div>
            <InvoicePrint data={printData} />
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setShowPrint(false)}
                className="flex-1 px-4 py-2.5 border rounded-xl text-sm font-medium hover:bg-ivory-100 transition">
                Đóng
              </button>
              <button onClick={() => { handlePrintOrder() }} disabled={printLoading}
                className="flex-1 px-4 py-2.5 bg-gold text-noir rounded-xl text-sm font-semibold hover:bg-gold-hover transition disabled:opacity-50">
                {printLoading ? <Loader className="h-4 w-4 animate-spin" /> : (printData.soLanIn || 0) > 0 ? 'In lại' : 'In ngay'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

function VND(n) { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }

