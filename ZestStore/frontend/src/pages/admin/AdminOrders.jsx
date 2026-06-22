import { useState, useEffect } from 'react'
import { getAllOrders, updateOrderStatus } from '../../api/admin'
import StatusBadge, { labels, styles } from '../../components/StatusBadge'
import { Search, ChevronDown, Filter } from 'lucide-react'

const NEXT_STATUS = {
  1: [2, 5],
  2: [3, 5],
  3: [4],
}

const STATUS_LIST = [
  { value: 0, label: 'Tất cả' },
  { value: 1, label: 'Chờ xác nhận' },
  { value: 2, label: 'Đã xác nhận' },
  { value: 3, label: 'Đang giao' },
  { value: 4, label: 'Đã giao' },
  { value: 5, label: 'Đã hủy' },
]

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(0)
  const [openId, setOpenId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { getAllOrders().then(setOrders).catch(() => setError('Không thể tải đơn hàng')) }, [])

  const handleStatus = async (id, trangThai) => {
    try {
      await updateOrderStatus(id, trangThai)
      setOpenId(null)
      setError('')
      getAllOrders().then(setOrders)
    } catch (err) {
      setError(err.response?.data?.message || 'Cập nhật thất bại')
    }
  }

  const filtered = orders.filter((o) => {
    const matchSearch = !search || String(o.maDonHang).includes(search) || (o.nguoiDung?.email || '').toLowerCase().includes(search.toLowerCase()) || (o.nguoiDung?.soDienThoai || '').includes(search)
    const matchStatus = statusFilter === 0 || o.trangThaiDon === statusFilter
    return matchSearch && matchStatus
  })

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
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Trạng thái</th>
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
        </div>
        {filtered.length === 0 && <p className="text-center text-gray-500 py-8">Không có đơn hàng</p>}
      </div>
    </div>
  )
}

function VND(n) { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }