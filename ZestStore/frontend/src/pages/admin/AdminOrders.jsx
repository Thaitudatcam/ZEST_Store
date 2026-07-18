import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getAllOrders } from '../../api/admin'
import StatusBadge from '../../components/StatusBadge'
import { Search, Filter, Eye, Calendar, ChevronDown } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { SkeletonTable } from '../../components/Skeleton'

const PAYMENT_LABELS = { 1: 'COD', 2: 'VNPay', 3: 'MoMo', 4: 'ZaloPay', 5: 'Tiền mặt', 6: 'VietQR' }
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

const ONLINE_STATUS_LIST = [
  { value: 0, label: 'Tất cả' },
  { value: 1, label: 'Chờ xác nhận' },
  { value: 2, label: 'Đã xác nhận' },
  { value: 3, label: 'Chờ lấy hàng' },
  { value: 4, label: 'Chờ giao hàng' },
  { value: 5, label: 'Đã hủy' },
  { value: 6, label: 'Đã giao hàng' },
  { value: 7, label: 'Yêu cầu trả hàng' },
  { value: 8, label: 'Đã trả hàng' },
]

const POS_STATUS_LIST = [
  { value: 0, label: 'Tất cả' },
  { value: 1, label: 'Chờ thanh toán' },
  { value: 6, label: 'Hoàn thành' },
  { value: 5, label: 'Đã hủy' },
]

export default function AdminOrders() {
  const toast = useToast()
  const { pathname } = useLocation()
  const loaiDonHang = pathname.endsWith('/pos') ? 2 : 1
  const [orders, setOrders] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const todayStr = new Date().toISOString().split('T')[0]
  const [tuNgay, setTuNgay] = useState(todayStr)
  const [denNgay, setDenNgay] = useState(todayStr)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const dateError = tuNgay && denNgay && tuNgay > denNgay ? 'Ngày kết thúc không được nhỏ hơn ngày bắt đầu' : ''
  const loadOrders = (p, loai, q) => {
    if (dateError) { setLoading(false); return }
    setLoading(true)
    const l = loai ?? loaiDonHang
    getAllOrders(p, 10, l, q || undefined, statusFilter > 0 ? statusFilter : undefined,
      tuNgay || undefined, denNgay || undefined)
      .then(data => {
      setOrders(data.content || [])
      setTotalPages(data.totalPages || 0)
      setPage(data.number || 0)
    }).catch(() => setError('Không thể tải đơn hàng'))
    .finally(() => setLoading(false))
  }

  useEffect(() => { if (!dateError) loadOrders(0, loaiDonHang, search) }, [pathname, search, statusFilter, tuNgay, denNgay, dateError])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm đơn hàng..." className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="mb-4">
        <button onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="relative flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 transition">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-gray-600">Bộ lọc</span>
          <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-all duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
          {statusFilter > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-600 rounded-full" />
          )}
        </button>
        <div className={`overflow-hidden transition-all duration-200 ${isFilterOpen ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex gap-1 flex-wrap">
              {(loaiDonHang === 2 ? POS_STATUS_LIST : ONLINE_STATUS_LIST).map((s) => {
                const cls = {
                  0: { active: 'bg-blue-600 text-white border-blue-600', inactive: 'border-blue-300 text-gray-600 bg-white hover:bg-blue-50' },
                  1: { active: 'bg-amber-600 text-white border-amber-600', inactive: 'border-amber-300 text-gray-600 bg-white hover:bg-amber-50' },
                  2: { active: 'bg-blue-600 text-white border-blue-600', inactive: 'border-blue-300 text-gray-600 bg-white hover:bg-blue-50' },
                  3: { active: 'bg-purple-600 text-white border-purple-600', inactive: 'border-purple-300 text-gray-600 bg-white hover:bg-purple-50' },
                  4: { active: 'bg-emerald-600 text-white border-emerald-600', inactive: 'border-emerald-300 text-gray-600 bg-white hover:bg-emerald-50' },
                  5: { active: 'bg-rose-600 text-white border-rose-600', inactive: 'border-rose-300 text-gray-600 bg-white hover:bg-rose-50' },
                  6: { active: 'bg-teal-600 text-white border-teal-600', inactive: 'border-teal-300 text-gray-600 bg-white hover:bg-teal-50' },
                  7: { active: 'bg-orange-600 text-white border-orange-600', inactive: 'border-orange-300 text-gray-600 bg-white hover:bg-orange-50' },
                  8: { active: 'bg-gray-700 text-white border-gray-700', inactive: 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50' },
                }[s.value] || { active: 'bg-blue-600 text-white border-blue-600', inactive: 'border-gray-300 text-gray-600 bg-white hover:bg-gray-100' }
                return (
                <button key={s.value} onClick={() => setStatusFilter(s.value)}
                  className={`px-3 py-1.5 text-xs rounded-lg border-2 transition font-medium ${statusFilter === s.value ? cls.active : cls.inactive}`}>
                  {s.label}
                </button>
              )})}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input type="date" value={tuNgay} onChange={e => setTuNgay(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <span className="text-sm text-gray-400">→</span>
              <input type="date" value={denNgay} onChange={e => setDenNgay(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          {dateError && <p className="text-red-500 text-xs mt-2">{dateError}</p>}
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
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((o) => {
                return (
                  <tr key={o.maDonHang} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium">#{o.maDonHang}</td>
                    <td className="px-4 py-3">{o.nguoiDung?.hoTen || 'Khách lẻ'}<br /><span className="text-xs text-gray-400">{o.nguoiDung?.email || ''}</span></td>
                    <td className="px-4 py-3">{o.ngayDat ? new Date(o.ngayDat).toLocaleDateString('vi-VN') : '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold">{VND(o.tongTien || 0)}</td>
                    <td className="px-4 py-3 text-center"><PaymentInfo payments={o.thanhToans} /></td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={o.trangThaiDon} loaiDonHang={o.loaiDonHang} /></td>
                    <td className="px-4 py-3 text-center">
                      <Link to={`/admin/orders/${o.maDonHang}`} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1.5 rounded-lg inline-block" title="Xem chi tiết">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          )}
        </div>
        {orders.length === 0 && !loading && <p className="text-center text-gray-500 py-8">Không có đơn hàng</p>}
      </div>

      {totalPages > 0 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => loadOrders(0, null, search)} disabled={page === 0}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 disabled:opacity-30">Đầu</button>
          <button onClick={() => loadOrders(page - 1, null, search)} disabled={page === 0}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 disabled:opacity-30">Trước</button>
          {Array.from({ length: totalPages }, (_, i) => i).map(p => (
            <button key={p} onClick={() => loadOrders(p, null, search)}
              className={`px-3 py-1.5 text-sm border rounded-lg ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100'}`}>{p + 1}</button>
          ))}
          <button onClick={() => loadOrders(page + 1, null, search)} disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 disabled:opacity-30">Sau</button>
          <button onClick={() => loadOrders(totalPages - 1, null, search)} disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 disabled:opacity-30">Cuối</button>
        </div>
      )}


    </div>
  )
}

function VND(n) { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }