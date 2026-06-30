import { useState, useEffect } from 'react'
import { getStats, getRevenue, getTopProducts, getRevenueByDate, getRecentOrders } from '../../api/admin'
import { Users, ShoppingCart, DollarSign, Package, TrendingUp, AlertCircle, Loader2, Clock, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import StatusBadge from '../../components/StatusBadge'

const colors = ['from-blue-500 to-blue-600', 'from-emerald-500 to-emerald-600', 'from-violet-500 to-violet-600', 'from-amber-500 to-amber-600']
const icons = [Users, ShoppingCart, DollarSign, Package]

function VND(n) {
  try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n }
}
export { VND }

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [revenueData, setRevenueData] = useState(null)
  const [revenueByDate, setRevenueByDate] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')


  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    Promise.all([
      getStats().catch(err => ({ _error: err })),
      getRevenue(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        new Date().toISOString().split('T')[0]
      ).catch(err => ({ _error: err })),
      getTopProducts().catch(err => ({ _error: err })),
      getRevenueByDate(30).catch(err => ({ _error: err })),
      getRecentOrders(10).catch(err => ({ _error: err })),
    ]).then(([s, r, t, revDate, recent]) => {
      if (cancelled) return
      setStats(s?._error ? null : s)
      setRevenueData(r?._error ? null : r)
      setTopProducts(Array.isArray(t) ? t : [])
      setRevenueByDate(Array.isArray(revDate) ? revDate : [])
      setRecentOrders(Array.isArray(recent) ? recent : [])
    }).catch(() => {
      if (!cancelled) setError('Không thể tải dữ liệu')
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-200 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-gray-200 rounded-2xl" />
          <div className="h-72 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Bảng điều khiển</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      </div>
    )
  }

  const cards = stats ? [
    { label: 'Người dùng', value: stats.totalUsers ?? 0, icon: Users },
    { label: 'Đơn hàng', value: stats.totalOrders ?? 0, icon: ShoppingCart },
    { label: 'Doanh thu (tháng)', value: VND(stats.monthlyRevenue ?? 0), icon: DollarSign },
    { label: 'Sản phẩm', value: stats.totalProducts ?? 0, icon: Package },
  ] : []

  const totalRevenue = revenueByDate.reduce((s, d) => s + Number(d.doanhThu || 0), 0)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bảng điều khiển</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon
          return (
            <div key={c.label} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colors[i]} text-white p-5 shadow-lg`}>
              <div className="relative z-10">
                <p className="text-sm opacity-80">{c.label}</p>
                <p className="text-2xl font-bold mt-1">{c.value}</p>
              </div>
              <Icon className="absolute right-3 bottom-3 h-12 w-12 opacity-20" />
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="font-semibold text-lg mb-2 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-blue-600" /> Doanh thu 30 ngày</h2>
          <p className="text-3xl font-bold text-blue-700 mb-4">{VND(totalRevenue)}</p>
          {revenueByDate.length > 0 && (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenueByDate} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ngay" tick={{ fontSize: 10 }} tickFormatter={(v) => v?.slice(5) || ''} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => (v / 1000000).toFixed(0) + 'tr'} stroke="#94a3b8" />
                <Tooltip formatter={(v) => VND(v)} labelFormatter={(l) => `Ngày ${l}`} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Area type="monotone" dataKey="doanhThu" stroke="#3b82f6" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><Clock className="h-5 w-5 text-blue-600" /> Đơn hàng gần đây</h2>
          <div className="space-y-3">
            {recentOrders.slice(0, 8).map((o) => (
              <Link key={o.maDonHang} to={`/admin/orders/${o.maDonHang}`} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition -mx-1">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{o.tenNguoiNhan}</p>
                  <p className="text-xs text-gray-400">{o.ngayDat?.slice(0, 10)}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-semibold">{VND(o.tongTien)}</p>
                  <StatusBadge status={o.trangThaiDon} />
                </div>
              </Link>
            ))}
            {recentOrders.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Chưa có đơn hàng</p>}
          </div>
          {recentOrders.length > 0 && (
            <Link to="/admin/orders/online" className="block text-center text-sm text-blue-600 font-medium mt-3 hover:underline">Xem tất cả</Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {revenueData && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-blue-600" /> Tổng quan doanh thu</h2>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">Doanh thu tháng</p>
                <p className="text-2xl font-bold text-blue-700">{VND(revenueData.doanhThu ?? 0)}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">Đơn hoàn thành</p>
                <p className="text-2xl font-bold text-green-700">{revenueData.soDonHoanThanh ?? 0}</p>
              </div>
            </div>
          </div>
        )}

        {topProducts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><Eye className="h-5 w-5 text-blue-600" /> Sản phẩm xem nhiều nhất</h2>
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.maSanPham || i} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-400 w-6">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.tenSanPham}</p>
                    <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(100, ((p.soLanXem ?? 0) / (topProducts[0]?.soLanXem || 1)) * 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">{p.soLanXem ?? 0} lượt</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
