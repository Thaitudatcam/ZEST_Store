import { useState, useEffect } from 'react'
import { getStats, getRevenue, getTopProducts } from '../../api/admin'
import { Users, ShoppingCart, DollarSign, Package, TrendingUp, AlertCircle, Loader2 } from 'lucide-react'

const colors = ['from-blue-500 to-blue-600', 'from-emerald-500 to-emerald-600', 'from-violet-500 to-violet-600', 'from-amber-500 to-amber-600']
const icons = [Users, ShoppingCart, DollarSign, Package]

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [revenueData, setRevenueData] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    Promise.all([
      getStats().catch((err) => { throw { source: 'stats', err } }),
      getRevenue(
  new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
  new Date().toISOString().split('T')[0]
).catch((err) => { throw { source: 'revenue', err } }),
      getTopProducts().catch((err) => { throw { source: 'topProducts', err } }),
    ])
      .then(([s, r, t]) => {
        if (cancelled) return
        setStats(s)
        setRevenueData(r)
        setTopProducts(Array.isArray(t) ? t : [])
      })
      .catch(({ source, err }) => {
        if (cancelled) return
        const msg = err.response?.data?.message || err.message || 'Lỗi kết nối máy chủ'
        setError(`Không thể tải dữ liệu (${source}): ${msg}`)
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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

      {revenueData && (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-blue-600" /> Doanh thu</h2>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Doanh thu</p>
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
          <h2 className="font-semibold text-lg mb-4">Sản phẩm xem nhiều nhất</h2>
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
  )
}

function VND(n) {
  try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n }
}
export { VND }