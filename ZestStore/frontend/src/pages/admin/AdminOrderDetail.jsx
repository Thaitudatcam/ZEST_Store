import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/axios'
import StatusBadge from '../../components/StatusBadge'
import SafeImg from '../../components/SafeImg'
import { useToast } from '../../context/ToastContext'
import { ArrowLeft, Package, CreditCard, Truck, Clock, User, MapPin, CheckCircle, AlertTriangle, XCircle, ShoppingBag, Home, Loader, X } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog'

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

const PAYMENT_LABELS = { 1: 'COD', 2: 'VNPay', 3: 'Momo', 4: 'ZaloPay', 5: 'Tiền mặt', 6: 'VietQR', 7: 'Ví' }

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
    <div className="overflow-x-auto mb-6">
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
                  ${isCurrent ? 'bg-gold text-noir ring-4 ring-gold/30 animate-pulse' : 'bg-gold text-noir'}`}>
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
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${currentStatus === 8 ? 'bg-emerald-deep/20 text-emerald-deep' : 'bg-bordeaux/20 text-bordeaux'}`}>
                {currentStatus === 5 ? <XCircle className="h-5 w-5 sm:h-6 sm:w-6" /> : currentStatus === 8 ? <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" /> : <XCircle className="h-5 w-5 sm:h-6 sm:w-6" />}
              </div>
              <p className={`text-[10px] sm:text-xs font-semibold mt-1.5 whitespace-nowrap ${currentStatus === 8 ? 'text-emerald-deep' : 'text-bordeaux'}`}>{STATUS_LABELS[currentStatus]}</p>
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
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(null)
  const [confirmStatus, setConfirmStatus] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    setLoading(true)
    api.get(`/orders/admin/detail/${id}`)
      .then(r => setData(r.data))
      .catch(() => setError('Không thể tải chi tiết đơn hàng'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-center py-12 text-stone">Đang tải...</div>
  if (error) return <div className="text-center py-12 text-bordeaux">{error}</div>
  if (!data) return null

  const { order, items, payments, history } = data
  const backTo = order?.loaiDonHang === 2 ? '/admin/orders/pos' : '/admin/orders/online'

  const ONLINE_NEXT_STATUS = { 1: [2, 5], 2: [3, 5], 3: [4], 4: [6, 9] }
  const POS_NEXT_STATUS = { 1: [6, 5] }
  const NEXT_STATUS = order.loaiDonHang === 2 ? POS_NEXT_STATUS : ONLINE_NEXT_STATUS
  const baseNextStatuses = NEXT_STATUS[order.trangThaiDon] || []
  const hasUnpaidOnline = payments.some(p => p.phuongThuc > 1 && p.trangThaiThanhToan !== 2)
  const nextStatuses = baseNextStatuses.filter(s => {
    if (hasUnpaidOnline && (s === 2 || s === 3 || s === 4 || s === 6)) return false
    return true
  })

  const handleUpdateStatus = async (trangThai) => {
    setUpdating(trangThai)
    try {
      await api.put(`/orders/admin/${id}/status`, { trangThai })
      const updated = await api.get(`/orders/admin/detail/${id}`).then(r => r.data)
      setData(updated)
      toast.success(`Đã cập nhật sang: ${STATUS_LABELS[trangThai]}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto pb-28 lg:pb-8">
      <Link to={backTo} className="inline-flex items-center gap-1 text-sm text-stone hover:text-ink-soft mb-4">
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </Link>

      <div className="bg-ivory rounded-2xl border border-stone/10 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">Đơn hàng #{order.maDonHang}</h1>
            <p className="text-sm text-stone">{order.ngayDat ? new Date(order.ngayDat).toLocaleString('vi-VN') : '—'}</p>
            {order.maDonHangCode && <p className="text-xs text-stone mt-0.5">Mã: {order.maDonHangCode}</p>}
          </div>
          <StatusBadge status={order.trangThaiDon} loaiDonHang={order.loaiDonHang} />
        </div>
      </div>

      <OrderStatusStepper currentStatus={order.trangThaiDon} history={history} loaiDonHang={order.loaiDonHang} />

      {nextStatuses.length > 0 && (
        <div className="bg-ivory rounded-2xl border border-stone/10 shadow-sm p-6 mb-6">
          <h2 className="text-base font-semibold text-ink flex items-center gap-2 mb-4">
            <Truck className="h-5 w-5 text-gold" /> Cập nhật trạng thái
          </h2>
          <div className="flex gap-3 flex-wrap">
            {nextStatuses.map((s) => (
              <button key={s} onClick={() => setConfirmStatus(s)} disabled={updating !== null}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 ${s === 5 ? 'bg-bordeaux/10 text-bordeaux border border-bordeaux/20 hover:bg-bordeaux/20' : 'bg-gold text-noir hover:bg-gold-hover'}`}>
                {updating === s && <Loader className="h-4 w-4 animate-spin" />}
                {STATUS_LABELS[s] || s}
              </button>
            ))}
          </div>
        </div>
      )}

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
        <h2 className="text-base font-semibold text-ink flex items-center gap-2 mb-4">
          <Package className="h-5 w-5 text-gold" /> Sản phẩm
        </h2>
        <div className="space-y-4">
          {items.map((item) => {
            const variant = item.bienThe || {}
            const product = variant.sanPham || {}
            const anh = variant.urlAnh || product.urlAnhDaiDien || ''
            return (
              <div key={item.maMucDonHang || item.id} className="flex items-center gap-4 cursor-pointer hover:bg-ivory-100 -mx-2 px-2 rounded-lg transition" onClick={() => setSelectedItem(item)}>
                <div className="w-16 h-16 bg-ivory-100 rounded-lg overflow-hidden shrink-0">
                  <SafeImg src={anh} alt="" className="w-full h-full object-cover object-center" fallback="https://placehold.co/100x100/e2e8f0/475569?text=Polo" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{product.tenSanPham || `SP #${product.maSanPham}`}</p>
                  <p className="text-xs text-stone">
                    {[variant.mauSac?.mauSac, variant.kichCo?.kichCo].filter(Boolean).join(' - ') || <>&middot; {variant.sku || '—'}</>}
                  </p>
                  <p className="text-xs text-stone">x{item.soLuong}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{VND(item.thanhTien || 0)}</p>
                  <p className="text-xs text-stone">{VND(item.donGia || 0)} / cái</p>
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
          <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Tổng cộng</span><span className="text-gold">{VND(order.tongTien || 0)}</span></div>
        </div>
      </div>

      {payments.length > 0 && (
        <div className="bg-ivory rounded-2xl border border-stone/10 shadow-sm p-6 mb-6">
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
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-ivory rounded-2xl border border-stone/10 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-ink flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-gold" /> Thông tin giao hàng
        </h2>
        <div className="text-sm space-y-1">
          <p><span className="text-stone">Khách hàng:</span> {order.tenNguoiNhan || order.nguoiDung?.hoTen || 'Khách lẻ'}</p>
          <p><span className="text-stone">SĐT:</span> {order.sdtNguoiNhan || order.nguoiDung?.soDienThoai || '—'}</p>
          <p><span className="text-stone">Email:</span> {order.nguoiDung?.email || '—'}</p>
          {(order.loaiDonHang !== 2) && <p><span className="text-stone">Địa chỉ:</span> {order.diaChiGiaoHang || '—'}</p>}
          {order.ghiChu && <p><span className="text-stone">Ghi chú:</span> {order.ghiChu}</p>}
        </div>
      </div>

      <ConfirmDialog
        open={confirmStatus !== null}
        title="Xác nhận cập nhật"
        message={<>Bạn có chắc muốn chuyển đơn hàng <span className="font-semibold">#{order.maDonHang}</span> sang trạng thái <span className="font-semibold text-gold">{STATUS_LABELS[confirmStatus]}</span>?</>}
        confirmText="Xác nhận"
        variant={confirmStatus === 5 ? 'danger' : 'gold'}
        loading={updating === confirmStatus}
        onConfirm={() => { setConfirmStatus(null); handleUpdateStatus(confirmStatus) }}
        onCancel={() => setConfirmStatus(null)}
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

    </div>
  )
}

function VND(n) { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }

