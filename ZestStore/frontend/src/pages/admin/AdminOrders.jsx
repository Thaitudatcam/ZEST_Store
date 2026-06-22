import { useState, useEffect } from 'react'
import { getAllOrders, updateOrderStatus } from '../../api/admin'
import StatusBadge, { labels } from '../../components/StatusBadge'
import { Search, ChevronDown, CreditCard } from 'lucide-react'

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

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { getAllOrders().then(setOrders).catch(() => setError('Không thể tải đơn hàng')) }, [])

  const handleStatus = async (id, trangThai) => {
    try {
      await updateOrderStatus(id, trangThai)
      setOpenId(null)
      setError('')
      getAllOrders().then(setOrders).catch(() => setError('Không thể tải lại đơn hàng'))
    } catch (err) {
      setError(err.response?.data?.message || 'Cập nhật thất bại')
    }
  }

  const filtered = orders.filter((o) =>
    !search || String(o.maDonHang).includes(search) || (o.nguoiDung?.email || '').toLowerCase().includes(search.toLowerCase())
  )

  const hasActions = filtered.some((o) => NEXT_STATUS[o.trangThaiDon])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm đơn hàng..." className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
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