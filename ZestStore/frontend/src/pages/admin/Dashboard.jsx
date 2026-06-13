import { useState, useEffect } from 'react'
import { getStats, getRevenue, getTopProducts } from '../../api/admin'
import { Users, ShoppingCart, DollarSign, Package } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'


const colors = ['from-blue-500 to-blue-600', 'from-emerald-500 to-emerald-600', 'from-violet-500 to-violet-600', 'from-amber-500 to-amber-600']
const icons = [Users, ShoppingCart, DollarSign, Package]

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [revenue, setRevenue] = useState([])
  const [topProducts, setTopProducts] = useState([])

  useEffect(() => {
    getStats().then(setStats).catch(() => {})
    getRevenue().then((d) => setRevenue(Array.isArray(d) ? d : [])).catch(() => {})
    getTopProducts().then((d) => setTopProducts(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  const cards = stats ? [
    { label: 'Người dùng', value: stats.totalUsers ?? 0, icon: Users },
    { label: 'Đơn hàng', value: stats.totalOrders ?? 0, icon: ShoppingCart },
    { label: 'Doanh thu', value: VND(stats.totalRevenue ?? 0), icon: DollarSign },
    { label: 'Sản phẩm', value: stats.totalProducts ?? 0, icon: Package },
  ] : []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bảng điều khiển</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon
          return (
            <div key={c.label} className={`relative overflow-hidden rounded-2xl bg-gradient-br ${colors[i]} text-white p-5 shadow-lg`}>
              <div className="relative z-10">
                <p className="text-sm opacity-80">{c.label}</p>
                <p className="text-2xl font-bold mt-1">{c.value}</p>
              </div>
              <Icon className="absolute right-3 bottom-3 h-12 w-12 opacity-20" />
            </div>
          )
        })}
      </div>

      {revenue.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="font-semibold text-lg mb-4">Doanh thu theo ngày</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenue}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="ngay" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => (v / 1000).toFixed(0) + 'k'} />
              <Tooltip formatter={(v) => VND(v)} labelStyle={{ fontWeight: 600 }} />
              <Area type="monotone" dataKey="doanhThu" stroke="#3b82f6" fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
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
