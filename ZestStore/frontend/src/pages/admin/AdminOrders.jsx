import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllOrders, updateOrderStatus, getAdminOrderDetail } from '../../api/admin'
import StatusBadge, { labels } from '../../components/StatusBadge'
import { Search, ChevronDown, Filter, Eye, X, CreditCard, MapPin, Phone, User, Package } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { SkeletonTable } from '../../components/Skeleton'

const NEXT_STATUS = {
  1: [2, 5],
  2: [3, 5],
  3: [4],
  4: [6],
  7: [4, 8],
}

const PAYMENT_LABELS = { 1: 'COD', 2: 'VNPay', 3: 'MoMo', 4: 'ZaloPay' }
const PAYMENT_STATUS_LABELS = { 1: 'Chờ TT', 2: 'Đã TT', 3: 'Thất bại' }

function PaymentInfo({ payments }) {
  if (!payments || payments.length === 0) return <span className="text-xs text-gray-400">—</span>
  const p = payments[0]
  const method = PAYMENT_LABELS[p.phuongThuc] || '?'
  const status = PAYMENT_STATUS_LABELS[p.trangThaiThanhToan] || '?'
  const color = p.trangThaiThanhToan === 2 ? 'text-green-600' : p.trangThaiThanhToan === 3 ? 'text-red-500' : 'text-amber-600'
  return (
    <div className="text-xs">
      <span>{method}</span>
      <br />
      <span className={`font-semibold ${color}`}>{status}</span>
    </div>
  )
}

const STATUS_LIST = [
  { value: 0, label: 'Tất cả' },
  { value: 1, label: 'Chờ xác nhận' },
  { value: 2, label: 'Đã xác nhận' },
  { value: 3, label: 'Chờ lấy hàng' },
  { value: 4, label: 'Chờ giao hàng' },
  { value: 5, label: 'Đã hủy' },
  { value: 6, label: 'Đã giao hàng' },
]

const LOAI_DON = [
  { value: 1, label: 'Online' },
  { value: 2, label: 'Tại quầy' },
]

export default function AdminOrders() {
  const toast = useToast()
  const [orders, setOrders] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loaiDonHang, setLoaiDonHang] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(0)
  const [openId, setOpenId] = useState(null)
  const [error, setError] = useState('')
  const [detailModal, setDetailModal] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadOrders = (p, loai) => {
    setLoading(true)
    const l = loai ?? loaiDonHang
    getAllOrders(p, 10, l).then(data => {
      setOrders(data.content || [])
      setTotalPages(data.totalPages || 0)
      setPage(data.number || 0)
    }).catch(() => setError('Không thể tải đơn hàng'))
    .finally(() => setLoading(false))
  }

  useEffect(() => { loadOrders(0, loaiDonHang) }, [loaiDonHang])

  const handleStatus = async (id, trangThai) => {
    try {
      await updateOrderStatus(id, trangThai)
      setOpenId(null)
      setError('')
      loadOrders(page, loaiDonHang)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại')
    }
  }

  const filtered = orders.filter((o) => {
    const matchSearch = !search || String(o.maDonHang).includes(search) || (o.nguoiDung?.email || '').toLowerCase().includes(search.toLowerCase()) || (o.nguoiDung?.soDienThoai || '').includes(search)
    const matchStatus = statusFilter === 0 || o.trangThaiDon === statusFilter
    return matchSearch && matchStatus
  })

  const handleViewDetail = async (id) => {
    setDetailLoading(true)
    try {
      const data = await getAdminOrderDetail(id)
      setDetailModal(data)
    } catch {
      setError('Không thể tải chi tiết đơn hàng')
    } finally {
      setDetailLoading(false)
    }
  }

  const hasActions = filtered.some((o) => NEXT_STATUS[o.trangThaiDon])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm đơn hàng..." className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <div className="flex gap-1">
          {LOAI_DON.map((l) => (
            <button key={l.value} onClick={() => { setLoaiDonHang(l.value); setStatusFilter(0); setSearch('') }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${loaiDonHang === l.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {l.label}
            </button>
          ))}
        </div>
        <Filter className="h-4 w-4 text-gray-400" />
        <div className="flex gap-1 flex-wrap">
          {STATUS_LIST.map((s) => (
            <button key={s.value} onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition ${statusFilter === s.value ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2 mb-4">{error}</div>}

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          {orders.length === 0 ? (
            <div className="p-6"><SkeletonTable rows={8} cols={6} /></div>
          ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Khách hàng</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Ngày</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Tổng tiền</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Thanh toán</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Trạng thái</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Chi tiết</th>
                {hasActions && <th className="text-center px-4 py-3 font-semibold text-gray-600">Hành động</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((o) => {
                const nextStatuses = NEXT_STATUS[o.trangThaiDon]
                return (
                  <tr key={o.maDonHang} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium">#{o.maDonHang}</td>
                    <td className="px-4 py-3">{o.nguoiDung?.hoTen || 'N/A'}<br /><span className="text-xs text-gray-400">{o.nguoiDung?.email}</span></td>
                    <td className="px-4 py-3">{o.ngayDat ? new Date(o.ngayDat).toLocaleDateString('vi-VN') : '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold">{VND(o.tongTien || 0)}</td>
                    <td className="px-4 py-3 text-center"><PaymentInfo payments={o.thanhToans} /></td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={o.trangThaiDon} /></td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleViewDetail(o.maDonHang)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg" title="Xem chi tiết">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                    {hasActions && (
                      <td className="px-4 py-3 text-center">
                        {nextStatuses ? (
                          <div className="relative inline-block">
                            <button onClick={() => setOpenId(openId === o.maDonHang ? null : o.maDonHang)} className="text-xs border rounded-lg px-3 py-1.5 hover:bg-gray-100 flex items-center gap-1 mx-auto">
                              Cập nhật <ChevronDown className="h-3 w-3" />
                            </button>
                            {openId === o.maDonHang && (
                              <div className="absolute right-0 mt-1 w-40 bg-white border rounded-lg shadow-lg z-20">
                                {nextStatuses.map((k) => (
                                  <button key={k} onClick={() => handleStatus(o.maDonHang, k)} className="block w-full text-left px-4 py-2 text-xs hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg">{labels[k] || k}</button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
          )}
        </div>
        {filtered.length === 0 && !loading && <p className="text-center text-gray-500 py-8">Không có đơn hàng</p>}
      </div>

      {totalPages > 0 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => loadOrders(0)} disabled={page === 0}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 disabled:opacity-30">Đầu</button>
          <button onClick={() => loadOrders(page - 1)} disabled={page === 0}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 disabled:opacity-30">Trước</button>
          {Array.from({ length: totalPages }, (_, i) => i).map(p => (
            <button key={p} onClick={() => loadOrders(p)}
              className={`px-3 py-1.5 text-sm border rounded-lg ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100'}`}>{p + 1}</button>
          ))}
          <button onClick={() => loadOrders(page + 1)} disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 disabled:opacity-30">Sau</button>
          <button onClick={() => loadOrders(totalPages - 1)} disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 disabled:opacity-30">Cuối</button>
        </div>
      )}

      {detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="h-8 w-8 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in p-4"
          onClick={() => setDetailModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold text-lg">Đơn hàng #{detailModal.order.maDonHang}</h2>
              <button onClick={() => setDetailModal(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p className="flex items-center gap-2"><User className="h-4 w-4 text-gray-400" /> <span className="font-semibold">Khách hàng:</span> {detailModal.order.nguoiDung?.hoTen || 'N/A'}</p>
                  <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-400" /> <span className="font-semibold">SĐT:</span> {detailModal.order.nguoiDung?.soDienThoai || '-'}</p>
                  <p><span className="font-semibold">Người nhận:</span> {detailModal.order.tenNguoiNhan}</p>
                  <p><span className="font-semibold">SĐT người nhận:</span> {detailModal.order.sdtNguoiNhan}</p>
                </div>
                <div className="space-y-2">
                  <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-400" /> <span className="font-semibold">Địa chỉ:</span> {detailModal.order.diaChiGiaoHang}</p>
                  <p><span className="font-semibold">Ngày đặt:</span> {detailModal.order.ngayDat ? new Date(detailModal.order.ngayDat).toLocaleString('vi-VN') : '-'}</p>
                  <p><span className="font-semibold">Trạng thái:</span> <StatusBadge status={detailModal.order.trangThaiDon} /></p>
                  <p><span className="font-semibold">Loại:</span> {detailModal.order.loaiDonHang === 2 ? 'Tại quầy' : 'Online'}</p>
                </div>
              </div>

              <div className="border-t pt-3">
                <h3 className="font-semibold mb-2 flex items-center gap-2"><Package className="h-4 w-4 text-gray-400" /> Sản phẩm</h3>
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-gray-50">
                    <th className="text-left px-2 py-1.5">Sản phẩm</th>
                    <th className="text-center px-2 py-1.5">SL</th>
                    <th className="text-right px-2 py-1.5">Đơn giá</th>
                    <th className="text-right px-2 py-1.5">Thành tiền</th>
                  </tr></thead>
                  <tbody className="divide-y">
                    {(detailModal.items || []).map((item, i) => (
                      <tr key={i}>
                        <td className="px-2 py-1.5">
                          <Link to={`/products/${item.bienThe?.sanPham?.slug || ''}`} className="text-blue-600 hover:underline font-medium" target="_blank">
                            {item.bienThe?.sanPham?.tenSanPham || 'SP'}
                          </Link>
                        </td>
                        <td className="px-2 py-1.5 text-center">{item.soLuong}</td>
                        <td className="px-2 py-1.5 text-right">{VND(item.donGia)}</td>
                        <td className="px-2 py-1.5 text-right font-semibold">{VND(item.thanhTien)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t pt-3 space-y-1 text-sm">
                <div className="flex justify-between"><span>Tạm tính:</span><span>{VND((detailModal.items || []).reduce((s, i) => s + Number(i.thanhTien), 0))}</span></div>
                {(detailModal.order.soTienGiam || 0) > 0 && <div className="flex justify-between text-green-600"><span>Giảm giá:</span><span>-{VND(detailModal.order.soTienGiam)}</span></div>}
                {(detailModal.order.phiVanChuyen || 0) > 0 && <div className="flex justify-between"><span>Phí vận chuyển:</span><span>{VND(detailModal.order.phiVanChuyen)}</span></div>}
                <div className="flex justify-between font-bold text-base border-t pt-2"><span>Tổng cộng:</span><span className="text-blue-700">{VND(detailModal.order.tongTien)}</span></div>
              </div>

              {(detailModal.payments || []).length > 0 && (
                <div className="border-t pt-3">
                  <h3 className="font-semibold mb-2 flex items-center gap-2"><CreditCard className="h-4 w-4 text-gray-400" /> Thanh toán</h3>
                  {detailModal.payments.map((p, i) => (
                    <div key={i} className="text-sm bg-gray-50 rounded-lg p-3 space-y-1">
                      <div className="flex justify-between"><span>Phương thức:</span><span>{PAYMENT_LABELS[p.phuongThuc] || p.phuongThuc}</span></div>
                      <div className="flex justify-between"><span>Trạng thái:</span><span className={p.trangThaiThanhToan === 2 ? 'text-green-600 font-semibold' : p.trangThaiThanhToan === 3 ? 'text-red-500' : 'text-amber-600'}>{PAYMENT_STATUS_LABELS[p.trangThaiThanhToan] || p.trangThaiThanhToan}</span></div>
                      <div className="flex justify-between"><span>Số tiền:</span><span className="font-semibold">{VND(p.soTien)}</span></div>
                    </div>
                  ))}
                </div>
              )}

              {detailModal.order.ghiChu && (
                <div className="border-t pt-3 text-sm">
                  <span className="font-semibold">Ghi chú:</span> {detailModal.order.ghiChu}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function VND(n) { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }