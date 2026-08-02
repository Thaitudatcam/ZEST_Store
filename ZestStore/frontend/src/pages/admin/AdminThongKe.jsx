import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getStats, getOrderStats, getRevenueByDay, getRevenueByDate, getRevenueByMonth, getRevenueByYear, getRecentOrders } from '../../api/admin'
import { Package, DollarSign, Users, Star, TrendingUp, ShoppingBag, AlertCircle, CheckCircle, Search } from 'lucide-react'
import CountUp from '../../components/ui/CountUp'
import RealtimeClock from '../../components/admin/RealtimeClock'
import AdminCard from '../../components/admin/AdminCard'
import AdminBadge from '../../components/admin/AdminBadge'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const VND = (n) => { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }

const statCards = [
  { key: 'orders', label: 'Đơn hàng', icon: ShoppingBag, value: null, color: 'gold' },
  { key: 'revenue', label: 'Doanh thu', icon: TrendingUp, value: null, color: 'emerald' },
  { key: 'users', label: 'Người dùng', icon: Users, value: null, color: 'blue' },
  { key: 'products', label: 'Sản phẩm', icon: Package, value: null, color: 'purple' },
]

const cardColorMap = {
  gold: { iconBg: 'bg-gold/15', iconColor: 'text-gold', line: 'bg-gold' },
  emerald: { iconBg: 'bg-emerald-deep/100/15', iconColor: 'text-emerald-deep', line: 'bg-emerald-deep/100' },
  blue: { iconBg: 'bg-gold/15', iconColor: 'text-gold', line: 'bg-gold' },
  purple: { iconBg: 'bg-royal/15', iconColor: 'text-royal', line: 'bg-royal' },
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-dark-700 border border-dark-border rounded-xl px-4 py-3 shadow-xl">
      <p className="text-dark-muted text-xs mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>{p.name}: {p.name === 'Doanh thu' ? VND(p.value) : p.value.toLocaleString('vi-VN')}</p>
      ))}
    </div>
  )
}

const FMT_DATE = (d) => {
  if (!d) return '-'
  try { return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) } catch { return d }
}

const loaiDonLabels = { 1: 'Online', 2: 'Tại quầy' }
const loaiDonColors = { 1: 'blue', 2: 'gold' }

export default function AdminThongKe() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [orderStats, setOrderStats] = useState(null)
  const [todayRevenue, setTodayRevenue] = useState(null)
  const [revenueData, setRevenueData] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [revenueTab, setRevenueTab] = useState('week')
  const [tuNgay, setTuNgay] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7)
    return d.toISOString().split('T')[0]
  })
  const [denNgay, setDenNgay] = useState(() => new Date().toISOString().split('T')[0])
  const [thang, setThang] = useState(new Date().getMonth() + 1)
  const [nam, setNam] = useState(new Date().getFullYear())
  const [loaiFilter, setLoaiFilter] = useState(null)
  const [revenueLoading, setRevenueLoading] = useState(false)

  const loadRevenue = useCallback(async () => {
    setRevenueLoading(true)
    try {
      let data
      if (revenueTab === 'week') {
        data = await getRevenueByDate(7)
      } else if (revenueTab === 'day') {
        if (!tuNgay || !denNgay) { setRevenueData([]); setRevenueLoading(false); return }
        data = await getRevenueByDay(tuNgay, denNgay)
      } else if (revenueTab === 'month') {
        data = await getRevenueByMonth(thang, nam)
      } else if (revenueTab === 'year') {
        data = await getRevenueByYear()
      }
      setRevenueData(Array.isArray(data) ? data.map(d => ({ ngay: d.ngay || d.date || d.thang || d.nam, doanhThu: Number(d.doanhThu || d.revenue || 0) })) : [])
    } catch {
      setRevenueData([])
    } finally {
      setRevenueLoading(false)
    }
  }, [revenueTab, tuNgay, denNgay, thang, nam])

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const loadAll = () => Promise.all([
      getStats().catch(() => null),
      getOrderStats().catch(() => null),
      getRevenueByDay(today, today).then(r => Array.isArray(r) ? r.reduce((s, d) => s + Number(d.doanhThu || 0), 0) : null).catch(() => null),
      getRecentOrders(5).then(r => Array.isArray(r) ? r : []).catch(() => []),
    ]).then(([s, os, rev, recent]) => {
      setStats(s)
      setOrderStats(os)
      setTodayRevenue(rev)
      setRecentOrders(recent)
    }).finally(() => setLoading(false))
    loadAll()
    const id = setInterval(loadAll, 30000)
    const onFocus = () => loadAll()
    window.addEventListener('focus', onFocus)
    return () => { clearInterval(id); window.removeEventListener('focus', onFocus) }
  }, [])

  useEffect(() => {
    loadRevenue()
  }, [loadRevenue])

  const filteredOrders = loaiFilter ? recentOrders.filter(o => Number(o.loaiDonHang) === loaiFilter) : recentOrders
  const mergedOrders = orderStats ? {
    totalOrders: orderStats.totalOrders ?? 0,
    completed: orderStats.completed ?? 0,
    pending: (orderStats.pending ?? 0) + (orderStats.shipping ?? 0),
    cancelled: orderStats.cancelled ?? 0,
  } : null

  const orderStatusData = mergedOrders ? [
    { name: 'Hoàn thành', value: mergedOrders.completed, color: '#10B981' },
    { name: 'Đang xử lý', value: mergedOrders.pending, color: '#D4A843' },
    { name: 'Đã hủy', value: mergedOrders.cancelled, color: '#EF4444' },
  ].filter(d => d.value > 0) : []

  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Chào buổi sáng' : today.getHours() < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'

  const statusLabels = { 1: 'Chờ xác nhận', 2: 'Đã xác nhận', 3: 'Chờ lấy hàng', 4: 'Chờ giao hàng', 5: 'Đã hủy', 6: 'Đã giao hàng', 7: 'Yêu cầu trả hàng', 8: 'Đã trả hàng', 9: 'Không nhận hàng' }
  const statusColors = { 1: 'gold', 2: 'blue', 3: 'purple', 4: 'green', 5: 'red', 6: 'green', 7: 'gold', 8: 'gray', 9: 'gray' }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-dark-700 rounded-2xl border border-dark-border p-5 animate-pulse">
              <div className="h-4 w-20 bg-dark-600 rounded mb-3" />
              <div className="h-8 w-24 bg-dark-600 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const getStatValue = (key) => {
    switch (key) {
      case 'orders': return stats?.totalOrders ?? 0
      case 'revenue': return stats?.monthlyRevenue ?? 0
      case 'users': return stats?.totalUsers ?? 0
      case 'products': return stats?.totalProducts ?? 0
      default: return 0
    }
  }

  const fmt = (n) => {
    if (n == null) return '0'
    if (n >= 1000000000) return (n / 1000000000).toFixed(1) + 'B'
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toLocaleString('vi-VN')
  }

  return (
    <div className="space-y-6">
      {/* ──────── HEADER ──────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">{greeting}, {user?.hoTen?.split(' ').pop() || 'Admin'}!</h1>
          <p className="text-stone text-sm mt-0.5">Đây là tổng quan hoạt động của ZestStore hôm nay</p>
        </div>
        <AdminCard className="px-6 py-3 min-w-[200px]">
          <RealtimeClock />
        </AdminCard>
      </div>

      {/* ──────── STAT CARDS ──────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => {
          const cc = cardColorMap[card.color]
          const value = getStatValue(card.key)
          return (
            <AdminCard key={card.key} className="p-5 group hover:border-gold/20 transition-all duration-300">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-11 h-11 rounded-xl ${cc.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <card.icon className={`h-5 w-5 ${cc.iconColor}`} />
                </div>
                {card.key === 'revenue' && (
                  <span className="text-xs text-dark-muted bg-dark-600 px-2 py-0.5 rounded-full">Tháng này</span>
                )}
              </div>
              {card.key === 'revenue' ? (
                <p className="text-xl font-bold text-dark-text tabular-nums">{VND(value)}</p>
              ) : (
                <CountUp to={value} duration={1.5} className="text-2xl font-bold text-dark-text tabular-nums" separator="." />
              )}
              <p className="text-xs text-dark-muted mt-1">{card.label}</p>
              <div className={`h-0.5 w-0 group-hover:w-full ${cc.line} rounded-full mt-3 transition-all duration-500`} />
            </AdminCard>
          )
        })}
      </div>

      {/* ──────── STAT ROW 2 ──────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-dark-700 rounded-xl border border-dark-border p-4 text-center">
          <p className="text-2xl font-bold text-ivory tabular-nums">{mergedOrders?.completed ?? 0}</p>
          <p className="text-xs text-ivory/60 mt-0.5 flex items-center justify-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-deep" /> Đơn hoàn thành</p>
        </div>
        <div className="bg-dark-700 rounded-xl border border-dark-border p-4 text-center">
          <p className="text-2xl font-bold text-gold tabular-nums">{mergedOrders?.pending ?? 0}</p>
          <p className="text-xs text-ivory/60 mt-0.5 flex items-center justify-center gap-1"><Package className="h-3 w-3 text-gold" /> Đang xử lý</p>
        </div>
        <div className="bg-dark-700 rounded-xl border border-dark-border p-4 text-center">
          <p className="text-2xl font-bold text-ivory tabular-nums">{mergedOrders?.cancelled ?? 0}</p>
          <p className="text-xs text-ivory/60 mt-0.5 flex items-center justify-center gap-1"><AlertCircle className="h-3 w-3 text-bordeaux" /> Đã hủy</p>
        </div>
        <div className="bg-dark-700 rounded-xl border border-dark-border p-4 text-center">
          <p className="text-2xl font-bold text-gold tabular-nums">{todayRevenue != null ? VND(todayRevenue) : '0'}</p>
          <p className="text-xs text-ivory/60 mt-0.5 flex items-center justify-center gap-1"><TrendingUp className="h-3 w-3 text-gold" /> Doanh thu hôm nay</p>
        </div>
      </div>

      {/* ──────── CHARTS ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Line Chart: Revenue */}
        <AdminCard className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-dark-text">Doanh thu</h3>
            <div className="flex items-center gap-1">
              {['week', 'day', 'month', 'year'].map(tab => (
                <button key={tab} onClick={() => {
                  setRevenueTab(tab)
                  if (tab === 'week') {
                    const d = new Date(); d.setDate(d.getDate() - 7)
                    setTuNgay(d.toISOString().split('T')[0])
                    setDenNgay(new Date().toISOString().split('T')[0])
                  }
                }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${revenueTab === tab ? 'bg-gold text-dark-900' : 'bg-dark-600 text-dark-muted border border-dark-border hover:bg-dark-500 hover:border-dark-muted/30'}`}>
                  {tab === 'week' ? 'Tuần' : tab === 'day' ? 'Ngày' : tab === 'month' ? 'Tháng' : 'Năm'}
                </button>
              ))}
            </div>
          </div>
          {revenueTab !== 'week' && revenueTab !== 'year' && (
            <div className="flex items-center gap-3 mb-4">
              {revenueTab === 'day' && (
                <>
                  <input type="date" value={tuNgay} onChange={e => setTuNgay(e.target.value)}
                    className="bg-dark-600 border border-dark-border rounded-lg px-3 py-1.5 text-sm text-dark-text [color-scheme:dark]" />
                  <span className="text-dark-muted text-xs">→</span>
                  <input type="date" value={denNgay} onChange={e => setDenNgay(e.target.value)}
                    className="bg-dark-600 border border-dark-border rounded-lg px-3 py-1.5 text-sm text-dark-text [color-scheme:dark]" />
                </>
              )}
              {revenueTab === 'month' && (
                <>
                  <select value={thang} onChange={e => setThang(Number(e.target.value))}
                    className="bg-dark-600 border border-dark-border rounded-lg px-3 py-1.5 text-sm text-dark-text">
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                    ))}
                  </select>
                  <input type="number" value={nam} onChange={e => setNam(Number(e.target.value))}
                    className="bg-dark-600 border border-dark-border rounded-lg px-3 py-1.5 text-sm text-dark-text w-24 [color-scheme:dark]" />
                </>
              )}
              <button onClick={loadRevenue}
                className="bg-gold text-dark-900 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-gold-hover transition flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5" /> Xem
              </button>
            </div>
          )}
          {revenueLoading ? (
            <div className="h-[240px] flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            </div>
          ) : revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="ngay" tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#334155' }} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#334155' }} tickFormatter={(v) => fmt(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="doanhThu" stroke="#D4A843" strokeWidth={2.5} dot={{ fill: '#D4A843', stroke: '#0A0E17', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#D4A843', stroke: '#0A0E17', strokeWidth: 2 }} name="Doanh thu" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-dark-muted text-sm">Chưa có dữ liệu doanh thu</div>
          )}
        </AdminCard>

        {/* Pie Chart: Order status */}
        <AdminCard className="p-5">
          <h3 className="text-sm font-semibold text-dark-text mb-4">Đơn hàng theo trạng thái</h3>
          {orderStatusData.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                    {orderStatusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {orderStatusData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-xs text-dark-muted">{d.name}: <span className="text-dark-text font-semibold">{d.value}</span></span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-dark-muted text-sm">Chưa có dữ liệu</div>
          )}
        </AdminCard>
      </div>

      {/* ──────── RECENT ORDERS ──────── */}
      <AdminCard className="overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-dark-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-dark-text">Đơn hàng gần đây</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-dark-800 rounded-lg p-0.5">
              {[
                { label: 'Tất cả', value: null },
                { label: 'Online', value: 1 },
                { label: 'Tại quầy', value: 2 },
              ].map(opt => (
                <button key={opt.label} onClick={() => setLoaiFilter(opt.value)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition ${loaiFilter === opt.value ? 'bg-gold text-dark-900' : 'text-dark-muted hover:text-dark-text'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-dark-muted">{recentOrders.length} đơn</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-dark-800 border-b border-dark-border">
                <th className="text-left px-5 py-3 font-semibold text-dark-muted text-xs">Mã đơn</th>
                <th className="text-left px-5 py-3 font-semibold text-dark-muted text-xs">Khách hàng</th>
                <th className="text-left px-5 py-3 font-semibold text-dark-muted text-xs">Ngày đặt</th>
                <th className="text-right px-5 py-3 font-semibold text-dark-muted text-xs">Tổng tiền</th>
                <th className="text-center px-5 py-3 font-semibold text-dark-muted text-xs">Loại</th>
                <th className="text-center px-5 py-3 font-semibold text-dark-muted text-xs">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {filteredOrders.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-dark-muted text-sm">Chưa có đơn hàng nào</td></tr>
              ) : filteredOrders.map((order, i) => (
                <tr key={order.maDonHang || i}
                  onClick={() => navigate(`/admin/orders/${order.maDonHang || order.id}`)}
                  className="hover:bg-dark-600/50 transition-colors cursor-pointer">
                  <td className="px-5 py-3 font-medium text-dark-text">#{order.maDonHang || order.code || '-'}</td>
                  <td className="px-5 py-3 text-dark-muted">{order.khachHang?.hoTen || order.hoTen || order.customerName || '-'}</td>
                  <td className="px-5 py-3 text-dark-muted text-xs">{FMT_DATE(order.ngayTao || order.createdAt || order.ngayDat)}</td>
                  <td className="px-5 py-3 text-right font-medium text-dark-text tabular-nums">{VND(order.tongTien || order.total || 0)}</td>
                  <td className="px-5 py-3 text-center">
                    <AdminBadge color={loaiDonColors[order.loaiDonHang] || 'gray'}>
                      {loaiDonLabels[order.loaiDonHang] || '---'}
                    </AdminBadge>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <AdminBadge color={statusColors[order.trangThaiDon] || 'gray'}>
                      {statusLabels[order.trangThaiDon] || order.trangThaiDon || 'Unknown'}
                    </AdminBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  )
}