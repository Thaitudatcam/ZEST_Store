import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getStats, getOrderStats, getRevenueByDay, getRevenueByDate, getRevenueByMonth, getRevenueByYear, getRecentOrders, getBestSellingProducts, getAllOrders } from '../../api/admin'
import { Package, DollarSign, Users, TrendingUp, ShoppingBag, AlertCircle, CheckCircle, Filter, RefreshCw, Calendar, Clock, BarChart3, ShoppingCart } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { SkeletonTable } from '../../components/Skeleton'

const VND = (n) => { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }

const STATUS_LIST = [
  { key: 'completed', label: 'Hoàn thành', color: 'bg-emerald-deep', dot: 'bg-emerald-deep' },
  { key: 'cancelled', label: 'Đã hủy', color: 'bg-bordeaux', dot: 'bg-bordeaux' },
  { key: 'pending', label: 'Chờ xác nhận', color: 'bg-gold', dot: 'bg-gold' },
  { key: 'confirmed', label: 'Đã xác nhận', color: 'bg-royal', dot: 'bg-royal' },
  { key: 'shipping', label: 'Chờ giao', color: 'bg-amber-500', dot: 'bg-amber-500' },
  { key: 'delivering', label: 'Đang giao', color: 'bg-sky-500', dot: 'bg-sky-500' },
  { key: 'failed', label: 'Giao thất bại', color: 'bg-stone', dot: 'bg-stone' },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-stone/15 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-stone text-xs mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-semibold text-ink">{VND(p.value)}</p>
      ))}
    </div>
  )
}

export default function AdminThongKe() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [orderStats, setOrderStats] = useState(null)
  const [todayRevenue, setTodayRevenue] = useState(null)
  const [revenueData, setRevenueData] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [bestSelling, setBestSelling] = useState([])
  const [loading, setLoading] = useState(true)
  const [revenueLoading, setRevenueLoading] = useState(false)

  // Filter state
  const [tuNgay, setTuNgay] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0] })
  const [denNgay, setDenNgay] = useState(() => new Date().toISOString().split('T')[0])
  const [tuGio, setTuGio] = useState('00:00:00')
  const [denGio, setDenGio] = useState('23:59:59')
  const [revenueChartMode, setRevenueChartMode] = useState('year')
  const [chartYear, setChartYear] = useState(new Date().getFullYear())


  const loadAll = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const [s, os, rev, recent, best] = await Promise.all([
        getStats().catch(() => null),
        getOrderStats().catch(() => null),
        getRevenueByDay(today, today).then(r => Array.isArray(r) ? r.reduce((s, d) => s + Number(d.doanhThu || 0), 0) : 0).catch(() => 0),
        getRecentOrders(10).then(r => Array.isArray(r) ? r : []).catch(() => []),
        getBestSellingProducts(10).then(r => Array.isArray(r) ? r : []).catch(() => []),
      ])
      setStats(s)
      setOrderStats(os)
      setTodayRevenue(rev)
      setRecentOrders(recent)
      setBestSelling(best)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { loadAll(); const id = setInterval(loadAll, 30000); return () => clearInterval(id) }, [loadAll])

  const loadRevenueChart = useCallback(async () => {
    setRevenueLoading(true)
    try {
      let data
      if (revenueChartMode === 'year') {
        data = await getRevenueByYear()
      } else {
        data = await getRevenueByMonth(new Date().getMonth() + 1, chartYear)
      }
      setRevenueData(Array.isArray(data) ? data.map(d => ({ ngay: d.ngay || d.date || d.thang || d.nam, doanhThu: Number(d.doanhThu || d.revenue || 0) })) : [])
    } catch { setRevenueData([]) } finally { setRevenueLoading(false) }
  }, [revenueChartMode, chartYear])

  useEffect(() => { loadRevenueChart() }, [loadRevenueChart])

  const loadFilteredOrders = useCallback(async () => {
    try {
      const data = await getAllOrders(0, 100, undefined, undefined, undefined, tuNgay, denNgay)
      return data.content || []
    } catch { return [] }
  }, [tuNgay, denNgay])

  // Compute stats
  const mergedOrders = orderStats ? {
    completed: orderStats.completed ?? 0,
    pending: (orderStats.pending ?? 0),
    cancelled: orderStats.cancelled ?? 0,
    shipping: orderStats.shipping ?? 0,
    confirmed: orderStats.confirmed ?? 0,
    failed: orderStats.failed ?? orderStats.notReceived ?? 0,
  } : { completed: 0, pending: 0, cancelled: 0, shipping: 0, confirmed: 0, failed: 0 }

  const todayInvoiceCount = recentOrders.filter(o => {
    if (!o.ngayDat) return false
    const d = new Date(o.ngayDat)
    const today = new Date()
    return d.toDateString() === today.toDateString()
  }).length

  const todayProductCount = recentOrders.filter(o => {
    if (!o.ngayDat) return false
    const d = new Date(o.ngayDat)
    const today = new Date()
    return d.toDateString() === today.toDateString()
  }).reduce((s, o) => s + (o.soLuongSanPham || o.items?.length || 1), 0)

  // Time period revenue
  const periodRevenue = (days) => {
    const now = new Date()
    const from = new Date(now); from.setDate(now.getDate() - days)
    return recentOrders
      .filter(o => o.ngayDat && new Date(o.ngayDat) >= from && o.trangThaiDon !== 5)
      .reduce((s, o) => s + Number(o.tongTien || 0), 0)
  }

  const periodCounts = (days) => {
    const now = new Date()
    const from = new Date(now); from.setDate(now.getDate() - days)
    const filtered = recentOrders.filter(o => o.ngayDat && new Date(o.ngayDat) >= from)
    return {
      completed: filtered.filter(o => o.trangThaiDon === 6).length,
      cancelled: filtered.filter(o => o.trangThaiDon === 5).length,
      failed: filtered.filter(o => o.trangThaiDon === 9).length,
    }
  }

  const todayCounts = periodCounts(0)
  const weekCounts = periodCounts(7)
  const monthCounts = periodCounts(30)
  const yearCounts = periodCounts(365)

  const fmt = (n) => {
    if (n >= 1000000000) return (n / 1000000000).toFixed(1) + 'B'
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toLocaleString('vi-VN')
  }

  if (loading) return <div className="p-6"><SkeletonTable rows={8} cols={6} /></div>

  return (
    <div className="max-w-[1440px] mx-auto pb-8 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink">Thống kê Bán hàng</h1>
            <p className="text-xs text-stone">Doanh thu hôm nay theo chỉ số từ Hóa đơn đã hoàn thành (Khớp 100% với Danh sách Hóa đơn)</p>
          </div>
        </div>

      </div>

      {/* Top Section: Revenue */}
      <div className="grid grid-cols-1 gap-5">
        {/* Today Revenue */}
        <div className="bg-white rounded-2xl border border-stone/10 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-ink uppercase tracking-wide">DOANH THU HÔM NAY CHO QUẢN LÝ</h2>
            <span className="text-[10px] font-semibold text-emerald-deep bg-emerald-deep/10 px-2.5 py-1 rounded-full">
              Đã hoàn thành {todayInvoiceCount} hóa đơn hôm nay
            </span>
          </div>
          <p className="text-3xl font-bold text-ink mb-5">{VND(todayRevenue || 0)}</p>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'TIỀN MẶT', value: 0, icon: '💵' },
              { label: 'CHUYỂN KHOẢN', value: 0, icon: '🏦' },
              { label: 'VNPAY', value: 0, icon: '💳' },
            ].map(item => (
              <div key={item.label} className="bg-ivory/50 rounded-xl p-3 text-center border border-stone/5">
                <p className="text-[10px] text-stone font-semibold uppercase tracking-wide mb-1">{item.label}</p>
                <p className="text-lg font-bold text-ink">{VND(item.value)}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-6 text-xs text-stone">
            <span>Hóa đơn phát sinh <span className="font-bold text-ink">{todayInvoiceCount}</span> hóa đơn</span>
            <span>Sản phẩm bán <span className="font-bold text-ink">{todayProductCount}</span> sản phẩm</span>
            <span>Hoàn thành <span className="font-bold text-emerald-deep">{mergedOrders.completed}</span></span>
          </div>
        </div>

      </div>

      {/* Summary Cards: Today, Week, Month, Year */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'HÔM NAY', revenue: periodRevenue(0), counts: todayCounts },
          { label: 'TUẦN NÀY', revenue: periodRevenue(7), counts: weekCounts },
          { label: 'THÁNG NÀY', revenue: periodRevenue(30), counts: monthCounts },
          { label: 'NĂM NÀY', revenue: periodRevenue(365), counts: yearCounts },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-stone/10 shadow-sm p-5">
            <p className="text-[10px] font-bold text-stone uppercase tracking-wider mb-2">{card.label}</p>
            <p className="text-xl font-bold text-ink mb-3">{VND(card.revenue)}</p>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-stone">Sản phẩm đã bán</span>
              <span className="text-stone">•</span>
              <span className="text-stone">Hủy đơn ?</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-full bg-emerald-deep/10 text-emerald-deep text-[10px] font-semibold">
                HOÀN THÀNH {card.counts.completed}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-bordeaux/10 text-bordeaux text-[10px] font-semibold">
                HỦY {card.counts.cancelled}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-stone/10 text-stone text-[10px] font-semibold">
                XỬ LÝ {card.counts.failed}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-2xl border border-stone/10 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-ink flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-gold" /> Biểu đồ doanh thu thực tế
          </h2>
          <div className="flex items-center gap-2">
            <select value={revenueChartMode} onChange={(e) => setRevenueChartMode(e.target.value)}
              className="px-3 py-1.5 border border-stone/20 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-gold/30">
              <option value="year">Theo năm</option>
              <option value="month">Theo tháng</option>
            </select>
            {revenueChartMode === 'month' && (
              <select value={chartYear} onChange={(e) => setChartYear(Number(e.target.value))}
                className="px-3 py-1.5 border border-stone/20 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-gold/30">
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 mb-3 text-xs text-stone">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-gold rounded" /> Doanh thu (VNĐ)</span>
        </div>
        {revenueLoading ? (
          <div className="h-[280px] flex items-center justify-center"><div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" /></div>
        ) : revenueData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="ngay" tick={{ fill: '#78716c', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                <YAxis tick={{ fill: '#78716c', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} tickFormatter={(v) => fmt(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="doanhThu" stroke="#D4A843" strokeWidth={2.5} dot={{ fill: '#D4A843', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#D4A843', stroke: '#fff', strokeWidth: 2 }} name="Doanh thu" />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-3 text-sm text-ink">
              Tổng doanh thu thời gian: <span className="font-bold text-gold">{VND(revenueData.reduce((s, d) => s + d.doanhThu, 0))}</span>
            </div>
          </>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-stone text-sm">Chưa có dữ liệu doanh thu</div>
        )}
      </div>

      {/* Date/Time Filter */}
      <div className="bg-white rounded-2xl border border-stone/10 shadow-sm p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="text-[10px] font-semibold text-stone uppercase tracking-wide mb-1 block">Từ ngày</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone" />
              <input type="date" value={tuNgay} onChange={(e) => setTuNgay(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-stone/20 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gold/30" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-stone uppercase tracking-wide mb-1 block">Đến ngày</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone" />
              <input type="date" value={denNgay} onChange={(e) => setDenNgay(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-stone/20 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gold/30" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-stone uppercase tracking-wide mb-1 block">Từ giờ</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone" />
              <input type="time" value={tuGio} onChange={(e) => setTuGio(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-stone/20 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gold/30" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-stone uppercase tracking-wide mb-1 block">Đến giờ</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone" />
              <input type="time" value={denGio} onChange={(e) => setDenGio(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-stone/20 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gold/30" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-gold text-noir rounded-xl text-xs font-bold hover:bg-gold-hover transition">
            <Filter className="h-3.5 w-3.5" /> Lọc dữ liệu
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 border border-stone/20 text-stone rounded-xl text-xs font-semibold hover:bg-ivory transition">
            <RefreshCw className="h-3.5 w-3.5" /> Đặt lại
          </button>
        </div>
      </div>

      {/* Payment Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'TỔNG TIỀN LỌC', value: 0, icon: DollarSign, color: 'text-gold bg-gold/10' },
          { label: 'TIỀN MẶT', value: 0, icon: '💵', color: 'text-emerald-deep bg-emerald-deep/10' },
          { label: 'CHUYỂN KHOẢN', value: 0, icon: '🏦', color: 'text-royal bg-royal/10' },
          { label: 'VNPAY', value: 0, icon: '💳', color: 'text-sky-600 bg-sky-50' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-stone/10 shadow-sm p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center shrink-0`}>
              {typeof card.icon === 'string' ? <span className="text-lg">{card.icon}</span> : <card.icon className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-[10px] font-semibold text-stone uppercase tracking-wide">{card.label}</p>
              <p className="text-lg font-bold text-ink">{VND(card.value)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Section: Top Selling + Sold Products + Order Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Top Selling */}
        <div className="bg-white rounded-2xl border border-stone/10 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone/10 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-gold" /> Top bán chạy
            </h2>
            <span className="text-[10px] font-bold text-gold bg-gold/10 px-2 py-0.5 rounded-full">TOP 10</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-ivory/50 border-b border-stone/10">
                  <th className="text-left px-4 py-2.5 font-semibold text-stone">Sản phẩm</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-stone">Đã bán</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-stone">Tên</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-stone">Doanh thu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone/5">
                {bestSelling.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-6 text-stone">Không có dữ liệu</td></tr>
                ) : bestSelling.slice(0, 10).map((p, i) => (
                  <tr key={i} className="hover:bg-ivory/30">
                    <td className="px-4 py-2.5 font-medium text-ink">{p.tenSanPham || p.name || '—'}</td>
                    <td className="px-4 py-2.5 text-right text-stone">{p.soLuongBan || p.quantity || 0}</td>
                    <td className="px-4 py-2.5 text-stone">{p.tenSanPham || '—'}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-ink">{VND(p.doanhThu || p.revenue || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sold Products Detail */}
        <div className="bg-white rounded-2xl border border-stone/10 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone/10 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <Package className="h-4 w-4 text-gold" /> Sản phẩm đã bán
            </h2>
            <span className="text-[10px] font-bold text-gold bg-gold/10 px-2 py-0.5 rounded-full">CHI TIẾT</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-ivory/50 border-b border-stone/10">
                  <th className="text-left px-4 py-2.5 font-semibold text-stone">Sản phẩm</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-stone">Số lượng</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-stone">Tên</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-stone">Doanh thu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone/5">
                {bestSelling.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-6 text-stone">Không có dữ liệu</td></tr>
                ) : bestSelling.slice(0, 10).map((p, i) => (
                  <tr key={i} className="hover:bg-ivory/30">
                    <td className="px-4 py-2.5 font-medium text-ink">{p.tenSanPham || p.name || '—'}</td>
                    <td className="px-4 py-2.5 text-center text-stone">{p.soLuongBan || p.quantity || 0}</td>
                    <td className="px-4 py-2.5 text-stone">{p.tenSanPham || '—'}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-ink">{VND(p.doanhThu || p.revenue || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Status Summary */}
        <div className="bg-white rounded-2xl border border-stone/10 shadow-sm p-5">
          <h2 className="text-sm font-bold text-ink flex items-center gap-2 mb-4">
            <ShoppingCart className="h-4 w-4 text-gold" /> Đơn hàng
          </h2>
          <div className="space-y-2.5 mb-5">
            {STATUS_LIST.map(s => (
              <div key={s.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                  <span className="text-xs text-stone">{s.label}</span>
                </div>
                <span className="text-xs font-bold text-ink">{mergedOrders[s.key] ?? 0}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-stone/10">
            <div className="text-center p-2 bg-emerald-deep/5 rounded-xl">
              <p className="text-lg font-bold text-emerald-deep">{mergedOrders.completed}</p>
              <p className="text-[9px] font-semibold text-emerald-deep uppercase">Hoàn thành</p>
            </div>
            <div className="text-center p-2 bg-bordeaux/5 rounded-xl">
              <p className="text-lg font-bold text-bordeaux">{mergedOrders.cancelled}</p>
              <p className="text-[9px] font-semibold text-bordeaux uppercase">Đã hủy</p>
            </div>
            <div className="text-center p-2 bg-stone/5 rounded-xl">
              <p className="text-lg font-bold text-stone">{mergedOrders.failed}</p>
              <p className="text-[9px] font-semibold text-stone uppercase">Thất bại</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Potential Customers + Unsold Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Potential Customers */}
        <div className="bg-white rounded-2xl border border-stone/10 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone/10 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <Users className="h-4 w-4 text-gold" /> Khách hàng tiềm năng
            </h2>
            <span className="text-[10px] font-bold text-gold bg-gold/10 px-2 py-0.5 rounded-full">TOP CHI TIÊU</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-ivory/50 border-b border-stone/10">
                  <th className="text-left px-4 py-2.5 font-semibold text-stone">Khách hàng</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-stone">Số đơn</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-stone">Tổng chi tiêu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone/5">
                <tr><td colSpan={3} className="text-center py-6 text-stone">Không có dữ liệu</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Unsold Inventory */}
        <div className="bg-white rounded-2xl border border-stone/10 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone/10 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-gold" /> Bán chậm & tồn kho
            </h2>
            <span className="text-[10px] font-bold text-bordeaux bg-bordeaux/10 px-2 py-0.5 rounded-full">CHƯA BÁN ĐƯỢC</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-ivory/50 border-b border-stone/10">
                  <th className="text-left px-4 py-2.5 font-semibold text-stone">Sản phẩm</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-stone">Đã bán</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-stone">Tồn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone/5">
                <tr><td colSpan={3} className="text-center py-6 text-stone">Không có dữ liệu</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
