import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getOrderDetail, cancelOrder, requestReturn } from '../api/orders'
import { createVnPayPayment, createMomoPayment, createZaloPayPayment, retryPayment } from '../api/payment'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusBadge from '../components/StatusBadge'
import { VND } from '../components/ProductCard'
import { Package, MapPin, CreditCard, ArrowLeft, ExternalLink } from 'lucide-react'

const PAYMENT_LABELS = {
  1: 'Thanh toán khi nhận hàng (COD)',
  2: 'VNPay',
  3: 'Momo',
  4: 'ZaloPay',
}

const PAYMENT_STATUS = {
  1: 'Chờ thanh toán',
  2: 'Đã thanh toán',
  3: 'Thất bại',
}

const PAYMENT_METHOD_NAMES = { 1: 'cod', 2: 'vnpay', 3: 'momo', 4: 'zalopay' }

export default function OrderDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [paying, setPaying] = useState(false)
  const [returnOpen, setReturnOpen] = useState(false)
  const [returnLyDo, setReturnLyDo] = useState('')
  const [returning, setReturning] = useState(false)

  const load = () => getOrderDetail(id).then(setData).finally(() => setLoading(false))
  useEffect(() => { load() }, [id])

  const handleCancel = async () => {
    if (!confirm('Bạn có chắc muốn hủy đơn hàng này?')) return
    setCancelling(true)
    try {
      await cancelOrder(id)
      load()
    } catch {} finally {
      setCancelling(false)
    }
  }

  const handleRequestReturn = async () => {
    if (!returnLyDo.trim()) return alert('Vui lòng nhập lý do trả hàng')
    setReturning(true)
    try {
      await requestReturn(id, returnLyDo.trim())
      setReturnOpen(false)
      setReturnLyDo('')
      load()
    } catch { alert('Yêu cầu trả hàng thất bại') }
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
      alert(err.response?.data?.message || 'Không thể tạo yêu cầu thanh toán')
    } finally {
      setPaying(false)
    }
  }

  if (loading) return <LoadingSpinner className="py-20" />

  if (!data) return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-center text-gray-500">
      <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
      <p>Không tìm thấy đơn hàng</p>
      <Link to="/orders" className="text-blue-700 font-semibold hover:underline mt-2 inline-block">Quay lại</Link>
    </div>
  )

  const order = data.order || data
  const items = data.items || []
  const payments = data.payments || []

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/orders" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4" /> Quay lại đơn hàng
      </Link>

      <div className="bg-white rounded-xl border p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">Đơn hàng #{order.maDonHang}</h1>
            <p className="text-sm text-gray-500">{order.ngayDat ? new Date(order.ngayDat).toLocaleString('vi-VN') : '—'}</p>
          </div>
          <StatusBadge status={order.trangThaiDon || order.trangThai} />
        </div>

        {order.trangThaiDon === 1 && (
          <button onClick={handleCancel} disabled={cancelling} className="text-sm text-red-500 hover:underline disabled:opacity-50">
            {cancelling ? 'Đang hủy...' : 'Hủy đơn hàng'}
          </button>
        )}

        {(order.trangThaiDon === 4 || order.trangThaiDon === 6) && (
          <button onClick={() => setReturnOpen(true)} disabled={returnOpen}
            className="text-sm text-orange-600 border border-orange-300 px-4 py-1.5 rounded-lg hover:bg-orange-50 transition">
            Yêu cầu trả hàng
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border p-6 mb-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Package className="h-5 w-5 text-blue-700" /> Sản phẩm</h2>
        <div className="space-y-4">
          {items.map((item) => {
            const variant = item.bienThe || {}
            const product = variant.sanPham || {}
            const anh = variant.urlAnh || product.urlAnhDaiDien || ''
            return (
              <div key={item.maMucDonHang} className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                  <img src={anh || 'https://placehold.co/100x100/e2e8f0/475569?text=Polo'} alt="" className="w-full h-full object-cover object-center" />
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
                {order.trangThaiDon === 4 && (
                  <button onClick={() => { setReviewModal(item); setReviewForm({ soSao: 5, binhLuan: '' }); setReviewMsg('') }}
                    className="text-xs text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 shrink-0 flex items-center gap-1">
                    <Star className="h-3.5 w-3.5" /> Đánh giá
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <div className="border-t mt-4 pt-4 space-y-1 text-sm">
          <div className="flex justify-between text-gray-600"><span>Tạm tính</span><span>{VND(items.reduce((s, i) => s + Number(i.thanhTien), 0))}</span></div>
          {(order.soTienGiam || 0) > 0 && <div className="flex justify-between text-green-600"><span>Giảm giá</span><span>-{VND(order.soTienGiam)}</span></div>}
          {(order.phiVanChuyen || 0) > 0 && <div className="flex justify-between text-gray-600"><span>Phí vận chuyển</span><span>{VND(order.phiVanChuyen)}</span></div>}
          <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Tổng cộng</span><span className="text-blue-700">{VND(order.tongTien)}</span></div>
        </div>
      </div>

      {payments.length > 0 && (
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><CreditCard className="h-5 w-5 text-blue-700" /> Thanh toán</h2>
          <div className="space-y-3 text-sm">
            {payments.map((p) => {
              const isOnline = p.phuongThuc > 1
              const canRetry = p.phuongThuc > 1 && (p.trangThaiThanhToan === 1 || p.trangThaiThanhToan === 3)
              return (
                <div key={p.maThanhToan} className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-600">{PAYMENT_LABELS[p.phuongThuc] || p.phuongThuc}</span>
                    <span className="ml-2 font-medium">{PAYMENT_STATUS[p.trangThaiThanhToan] || p.trangThaiThanhToan}</span>
                    {p.maGiaoDich && p.trangThaiThanhToan === 2 && (
                      <p className="text-xs text-gray-400 mt-0.5">GD: {p.maGiaoDich}</p>
                    )}
                  </div>
                  {canRetry && order.trangThaiDon === 1 && (
                    <button
                      onClick={() => handlePayNow(p)}
                      disabled={paying}
                      className="flex items-center gap-1 text-xs bg-blue-700 text-white px-3 py-1.5 rounded-lg hover:bg-blue-800 transition disabled:opacity-50"
                    >
                      <ExternalLink className="h-3 w-3" /> {paying ? 'Đang xử lý...' : 'Thanh toán ngay'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><MapPin className="h-5 w-5 text-blue-700" /> Thông tin giao hàng</h2>
        <div className="text-sm space-y-1">
          <p><span className="text-gray-500">Người nhận:</span> {order.tenNguoiNhan}</p>
          <p><span className="text-gray-500">SĐT:</span> {order.sdtNguoiNhan}</p>
          <p><span className="text-gray-500">Địa chỉ:</span> {order.diaChiGiaoHang}</p>
          {order.ghiChu && <p><span className="text-gray-500">Ghi chú:</span> {order.ghiChu}</p>}
        </div>
      </div>

      {returnOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 animate-fade-in" onClick={() => setReturnOpen(false)}>
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
    </div>
  )
}