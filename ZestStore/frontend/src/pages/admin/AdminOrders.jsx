import { useState, useEffect } from 'react'
import { getAllOrders, updateOrderStatus } from '../../api/admin'
import StatusBadge, { labels } from '../../components/StatusBadge'
import { Search, ChevronDown } from 'lucide-react'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => { getAllOrders().then(setOrders).catch(() => {}) }, [])

  const handleStatus = async (id, trangThai) => {
    try { await updateOrderStatus(id, trangThai); getAllOrders().then(setOrders) } catch {}
  }

  const filtered = orders.filter((o) =>
    !search || String(o.maDonHang).includes(search) || (o.nguoiDung?.email || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm đơn hàng..." className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

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
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((o) => (
                <tr key={o.maDonHang} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium">#{o.maDonHang}</td>
                  <td className="px-4 py-3">{o.nguoiDung?.hoTen || 'N/A'}<br /><span className="text-xs text-gray-400">{o.nguoiDung?.email}</span></td>
                  <td className="px-4 py-3">{o.ngayTao ? new Date(o.ngayTao).toLocaleDateString('vi-VN') : '-'}</td>
                  <td className="px-4 py-3 text-right font-semibold">{VND(o.tongTien || 0)}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={o.trangThai} /></td>
                  <td className="px-4 py-3 text-center">
                    {o.trangThai !== 'da_giao' && o.trangThai !== 'da_huy' && (
                      <div className="relative inline-block group">
                        <button className="text-xs border rounded-lg px-3 py-1.5 hover:bg-gray-100 flex items-center gap-1 mx-auto">
                          Cập nhật <ChevronDown className="h-3 w-3" />
                        </button>
                        <div className="absolute right-0 mt-1 w-40 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition z-20">
                          {Object.entries(labels).map(([k, v]) =>
                            k !== o.trangThai ? (
                              <button key={k} onClick={() => handleStatus(o.maDonHang, k)} className="block w-full text-left px-4 py-2 text-xs hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg">{v}</button>
                            ) : null
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-center text-gray-500 py-8">Không có đơn hàng</p>}
      </div>
    </div>
  )
}

function VND(n) { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }
