import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllOrders, updateOrderStatus } from '../../api/admin'
import StatusBadge, { labels } from '../../components/StatusBadge'
import { Search, ChevronDown, Filter, Eye } from 'lucide-react'

const NEXT_STATUS = {
  1: [2, 5],
  2: [3, 5],
  3: [4],
  4: [6],
  7: [4, 8],
}

const PAYMENT_LABELS = { 1: 'COD', 2: 'VNPay', 3: 'MoMo', 4: 'ZaloPay', 6: 'VietQR' }
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
  { value: 3, label: 'Đang giao' },
  { value: 4, label: 'Đã giao' },
  { value: 5, label: 'Đã hủy' },
]

const PAGE_SIZE = 20

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(0)
  const [openId, setOpenId] = useState(null)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [confirm, setConfirm] = useState(null)

  useEffect(() => { getAllOrders().then(setOrders).catch(() => setError('Không thể tải đơn hàng')) }, [])

  const handleStatus = async (id, trangThai) => {
    try {
      await updateOrderStatus(id, trangThai)
      setOpenId(null)
      setConfirm(null)
      setError('')
      getAllOrders().then(setOrders).catch(() => setError('Không thể tải lại đơn hàng'))
    } catch (err) {
      setError(err.response?.data?.message || 'Cập nhật thất bại')
    }
  }

  const filtered = orders.filter((o) => {
    const matchSearch = !search || String(o.maDonHang).includes(search) || (o.nguoiDung?.email || '').toLowerCase().includes(search.toLowerCase()) || (o.nguoiDung?.soDienThoai || '').includes(search)
    const matchStatus = statusFilter === 0 || o.trangThaiDon === statusFilter
    return matchSearch && matchStatus
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const hasActions = paged.some((o) => NEXT_STATUS[o.trangThaiDon])

  useEffect(() => { setPage(0) }, [search, statusFilter])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm đơn hàng..." className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
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
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Khách hàng</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Ngày</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Tổng tiền</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Thanh toán</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Trạng thái</th>
                {hasActions && <th className="text-center px-4 py-3 font-semibold text-gray-600">Hành động</th>}
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paged.map((o) => {
                const nextStatuses = NEXT_STATUS[o.trangThaiDon]
                return (
                  <tr key={o.maDonHang} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium">#{o.maDonHang}</td>
                    <td className="px-4 py-3">{o.nguoiDung?.hoTen || 'N/A'}<br /><span className="text-xs text-gray-400">{o.nguoiDung?.email}</span></td>
                    <td className="px-4 py-3">{o.ngayDat ? new Date(o.ngayDat).toLocaleDateString('vi-VN') : '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold">{VND(o.tongTien || 0)}</td>
                    <td className="px-4 py-3 text-center"><PaymentInfo payments={o.thanhToans} /></td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={o.trangThaiDon} /></td>
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
                                  <button key={k} onClick={() => setConfirm({ id: o.maDonHang, status: k, label: labels[k] || k })} className="block w-full text-left px-4 py-2 text-xs hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg">{labels[k] || k}</button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3 text-center">
                      <Link to={`/admin/orders/${o.maDonHang}`} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                        <Eye className="h-3.5 w-3.5" /> Xem
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {paged.length === 0 && <p className="text-center text-gray-500 py-8">Không có đơn hàng</p>}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t">
            <button disabled={page === 0} onClick={() => setPage(page - 1)} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-100 disabled:opacity-40">Trước</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)} className={`px-3 py-1.5 text-xs rounded-lg border ${i === page ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100'}`}>{i + 1}</button>
            ))}
            <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-100 disabled:opacity-40">Sau</button>
          </div>
        )}
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setConfirm(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2">Xác nhận cập nhật</h3>
            <p className="text-sm text-gray-600 mb-4">Chuyển đơn hàng #{confirm.id} sang trạng thái <strong>{confirm.label}</strong>?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className="flex-1 py-2.5 border rounded-xl text-sm font-medium hover:bg-gray-50">Hủy</button>
              <button onClick={() => handleStatus(confirm.id, confirm.status)} className="flex-1 py-2.5 bg-blue-700 text-white rounded-xl text-sm font-medium hover:bg-blue-800">Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function VND(n) { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }