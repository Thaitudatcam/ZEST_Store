import { useState, useEffect } from 'react'
import { getOrders, cancelOrder } from '../api/orders'
import LoadingSpinner from '../components/LoadingSpinner'
import { Package, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { VND } from '../components/ProductCard'

const statusColor = {
  'cho_xac_nhan': 'bg-yellow-100 text-yellow-800',
  'da_xac_nhan': 'bg-blue-100 text-blue-800',
  'dang_giao': 'bg-purple-100 text-purple-800',
  'da_giao': 'bg-green-100 text-green-800',
  'da_huy': 'bg-red-100 text-red-800',
}
const statusText = {
  'cho_xac_nhan': 'Chờ xác nhận', 'da_xac_nhan': 'Đã xác nhận',
  'dang_giao': 'Đang giao', 'da_giao': 'Đã giao', 'da_huy': 'Đã hủy',
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const load = () => getOrders().then(setOrders).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleCancel = async (id) => { await cancelOrder(id); load() }

  if (loading) return <LoadingSpinner className="py-20" />

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Đơn hàng của tôi</h1>
      {orders.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="mb-4">Chưa có đơn hàng</p>
          <Link to="/products" className="text-blue-700 font-semibold hover:underline">Mua sắm ngay</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.maDonHang} className="bg-white rounded-xl border p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm text-gray-500">Đơn hàng #{o.maDonHang}</p>
                  <p className="text-sm text-gray-500">{o.ngayTao ? new Date(o.ngayTao).toLocaleDateString('vi-VN') : ''}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${statusColor[o.trangThai] || 'bg-gray-100'}`}>
                  {statusText[o.trangThai] || o.trangThai}
                </span>
              </div>
              <p className="font-bold text-blue-700">{VND(o.tongTien || 0)}</p>
              {(o.trangThai === 'cho_xac_nhan' || o.trangThai === 'pending') && (
                <button onClick={() => handleCancel(o.maDonHang)} className="mt-2 text-sm text-red-500 hover:underline flex items-center gap-1">
                  <XCircle className="h-4 w-4" /> Hủy đơn
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
