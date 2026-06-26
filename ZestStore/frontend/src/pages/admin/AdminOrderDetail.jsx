import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/axios'
import StatusBadge from '../../components/StatusBadge'
import { ArrowLeft, Package, CreditCard, Truck, Clock, User } from 'lucide-react'

export default function AdminOrderDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    api.get(`/orders/admin/detail/${id}`)
      .then(r => setData(r.data))
      .catch(() => setError('Không thể tải chi tiết đơn hàng'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-center py-12 text-gray-400">Đang tải...</div>
  if (error) return <div className="text-center py-12 text-red-500">{error}</div>
  if (!data) return null

  const { order, items, payments, history } = data

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/admin/orders" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-4">
        <ArrowLeft className="h-4 w-4" /> Quay lại đơn hàng
      </Link>

      <div className="bg-white rounded-2xl border p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Đơn hàng #{order.maDonHang}</h1>
            <p className="text-sm text-gray-500">{order.ngayDat ? new Date(order.ngayDat).toLocaleString('vi-VN') : '-'}</p>
          </div>
          <StatusBadge status={order.trangThaiDon} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <User className="h-4 w-4" /> Khách hàng
            </div>
            <p className="text-sm">{order.tenNguoiNhan || order.nguoiDung?.hoTen}</p>
            <p className="text-xs text-gray-500">{order.sdtNguoiNhan || order.nguoiDung?.soDienThoai}</p>
            <p className="text-xs text-gray-500">{order.nguoiDung?.email}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Truck className="h-4 w-4" /> Địa chỉ giao hàng
            </div>
            <p className="text-sm">{order.diaChiGiaoHang}</p>
            {order.ghiChu && <p className="text-xs text-gray-500 mt-1">Ghi chú: {order.ghiChu}</p>}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border p-6 mb-6">
        <div className="flex items-center gap-2 font-bold text-lg mb-4">
          <Package className="h-5 w-5" /> Sản phẩm
        </div>
        <div className="divide-y">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                <img src={item.bienThe?.urlAnh || item.bienThe?.sanPham?.urlAnhDaiDien} alt="" className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = 'https://placehold.co/100x100/e2e8f0/475569?text=P' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.bienThe?.sanPham?.tenSanPham || 'Sản phẩm'}</p>
                <p className="text-xs text-gray-500">
                  {item.bienThe?.mauSac?.mauSac && <>Màu: {item.bienThe.mauSac.mauSac}</>}
                  {item.bienThe?.mauSac?.mauSac && item.bienThe?.kichCo?.kichCo && <> &middot; </>}
                  {item.bienThe?.kichCo?.kichCo && <>Size: {item.bienThe.kichCo.kichCo}</>}
                  {!item.bienThe?.mauSac && !item.bienThe?.kichCo && <>SKU: {item.bienThe?.sku || '—'}</>}
                </p>
                <p className="text-xs text-gray-500">Số lượng: {item.soLuong}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{VND(item.thanhTien || 0)}</p>
                <p className="text-xs text-gray-500">{VND(item.donGia || 0)} / cái</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border p-6">
          <div className="flex items-center gap-2 font-bold text-lg mb-4">
            <CreditCard className="h-5 w-5" /> Thanh toán
          </div>
          {payments.map((p, i) => (
            <div key={i} className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Phương thức:</span><span>{p.nhaCungCap || p.phuongThuc}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Số tiền:</span><span className="font-semibold">{VND(p.soTien || 0)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Trạng thái:</span>
                <span className={p.trangThaiThanhToan === 2 ? 'text-green-600 font-semibold' : p.trangThaiThanhToan === 3 ? 'text-red-500 font-semibold' : 'text-amber-600 font-semibold'}>
                  {p.trangThaiThanhToan === 2 ? 'Đã thanh toán' : p.trangThaiThanhToan === 3 ? 'Thất bại' : 'Chờ thanh toán'}
                </span>
              </div>
              {p.thoiGianTt && <div className="flex justify-between"><span className="text-gray-500">Thanh toán lúc:</span><span>{new Date(p.thoiGianTt).toLocaleString('vi-VN')}</span></div>}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border p-6">
          <div className="flex items-center gap-2 font-bold text-lg mb-4">
            <Clock className="h-5 w-5" /> Lịch sử trạng thái
          </div>
          <div className="space-y-3">
            {[...(history || [])].reverse().map((h, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{getStatusLabel(h.trangThaiMoi)}</p>
                  <p className="text-xs text-gray-500">
                    {h.nguoiCapNhat?.hoTen || 'Hệ thống'} &middot; {h.thoiGian ? new Date(h.thoiGian).toLocaleString('vi-VN') : '-'}
                  </p>
                  {h.ghiChu && <p className="text-xs text-gray-400">{h.ghiChu}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border p-6">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Tạm tính:</span><span>{VND(order.tongTien + (order.soTienGiam || 0) - (order.phiVanChuyen || 0))}</span></div>
          {order.soTienGiam > 0 && <div className="flex justify-between text-green-600"><span>Giảm giá:</span><span>-{VND(order.soTienGiam)}</span></div>}
          <div className="flex justify-between"><span className="text-gray-500">Phí vận chuyển:</span><span>{VND(order.phiVanChuyen || 0)}</span></div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Thành tiền:</span><span className="text-blue-700">{VND(order.tongTien || 0)}</span></div>
        </div>
      </div>
    </div>
  )
}

function getStatusLabel(s) {
  const labels = { 1: 'Chờ xác nhận', 2: 'Đã xác nhận', 3: 'Chờ lấy hàng', 4: 'Chờ giao hàng', 5: 'Đã hủy', 6: 'Đã giao hàng', 7: 'Yêu cầu trả hàng', 8: 'Đã trả hàng' }
  return labels[s] || `Trạng thái ${s}`
}

function VND(n) { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }