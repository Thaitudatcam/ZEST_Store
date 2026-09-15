import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  getStats, getOrderStats, getRevenueByDay,
  getRecentOrders, getBestSellingProducts
} from '../../api/admin'
import {
  DollarSign, ClipboardList, Package, Users,
  ShoppingCart, ShoppingBag, PlusCircle, Ticket, BarChart3,
  TrendingUp, ArrowRight, Clock, Store
} from 'lucide-react'
import CountUp from '../../components/ui/CountUp'
import AdminBadge from '../../components/admin/AdminBadge'
import { imageUrl } from '../../utils/imageUrl'

const VND = (n) => {
  try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) }
  catch { return n }
}

const statusLabels = {
  1: 'Chờ xác nhận', 2: 'Đã xác nhận', 3: 'Chờ lấy hàng',
  4: 'Chờ giao hàng', 5: 'Đã hủy', 6: 'Giao hàng thành công',
  7: 'Yêu cầu trả', 8: 'Đã trả', 9: 'Giao hàng không thành công'
}
const statusColors = {
  1: 'gold', 2: 'blue', 3: 'purple', 4: 'blue',
  5: 'red', 6: 'green', 7: 'gold', 8: 'gray', 9: 'gray'
}

const shortcuts = [
  { icon: ShoppingCart, label: 'Bán hàng', to: '/admin/pos' },
  { icon: ShoppingBag, label: 'Quản lý đơn hàng', to: '/admin/orders/online' },
  { icon: PlusCircle, label: 'Thêm sản phẩm', to: '/admin/products/create' },
  { icon: Ticket, label: 'Mã giảm giá', to: '/admin/coupons' },
  { icon: BarChart3, label: 'Báo cáo thống kê', to: '/admin/thong-ke' },
]

function fmt(n) {
  if (n == null) return '0'
  if (n >= 1000000000) return (n / 1000000000).toFixed(1) + 'B'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toLocaleString('vi-VN')
}

function fmtDate(d) {
  if (!d) return '-'
  try {
    return new Date(d).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    })
  } catch { return d }
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Chào buổi sáng'
  if (h < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [stats, setStats] = useState(null)
  const [orderStats, setOrderStats] = useState(null)
  const [todayRevenue, setTodayRevenue] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [bestSelling, setBestSelling] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    return Promise.all([
      getStats().catch(() => null),
      getOrderStats().catch(() => null),
      getRevenueByDay(today, today).then(r => {
        if (Array.isArray(r)) return r.reduce((s, d) => s + Number(d.doanhThu || 0), 0)
        return null
      }).catch(() => null),
      getRecentOrders(5).then(r => Array.isArray(r) ? r : []).catch(() => []),
      getBestSellingProducts(5).then(r => Array.isArray(r) ? r : []).catch(() => []),
    ]).then(([s, os, rev, recent, best]) => {
      setStats(s)
      setOrderStats(os)
      setTodayRevenue(rev)
      setRecentOrders(recent)
      setBestSelling(best)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadData()
    const id = setInterval(loadData, 30000)
    const onFocus = () => loadData()
    window.addEventListener('focus', onFocus)
    return () => { clearInterval(id); window.removeEventListener('focus', onFocus) }
  }, [loadData])

  const pendingOrders = orderStats?.pending ?? 0
  const totalProducts = stats?.totalProducts ?? 0
  const totalUsers = stats?.totalUsers ?? 0

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton banner */}
        <div className="rounded-2xl h-44 bg-gradient-to-r from-[var(--dark-bg-start)] to-[var(--dark-bg-end)] animate-pulse" />
        {/* Skeleton stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
              <div className="h-8 w-24 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        {/* Skeleton shortcuts */}
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-gray-200 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ═══════════════ BANNER CHÀO MỪNG ═══════════════ */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 md:p-8"
        style={{ background: 'linear-gradient(135deg, var(--dark-bg-start), var(--dark-bg-end))' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'var(--primary-color)' }} />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-5"
          style={{ background: 'var(--primary-color)' }} />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {getGreeting()}, {user?.hoTen?.split(' ').pop() || 'Admin'}! 👋
            </h1>
            <p className="text-white/60 text-sm mt-1">
              ZestStore — Hệ thống quản trị bán hàng
            </p>
            {pendingOrders > 0 && (
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                style={{ background: 'var(--accent-warning)', color: '#fff' }}>
                <Clock className="h-4 w-4" />
                Bạn có <strong>{pendingOrders}</strong> đơn hàng mới chờ duyệt hôm nay
              </div>
            )}
          </div>
          <button
            onClick={() => navigate('/admin/pos')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg hover:opacity-90 transition-all duration-200 shrink-0"
            style={{ background: 'var(--primary-color)' }}
          >
            <Store className="h-5 w-5" />
            Bán hàng
          </button>
        </div>
      </div>

      {/* ═══════════════ 4 THẺ STAT ═══════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Doanh thu hôm nay */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ background: 'color-mix(in srgb, var(--accent-revenue) 12%, transparent)' }}>
              <DollarSign className="h-5 w-5" style={{ color: 'var(--accent-revenue)' }} />
            </div>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: 'color-mix(in srgb, var(--accent-revenue) 12%, transparent)', color: 'var(--accent-revenue)' }}>
              Hôm nay
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">
            {todayRevenue != null ? VND(todayRevenue) : '0'}
          </p>
          <p className="text-sm text-gray-500 mt-1">Doanh thu hôm nay</p>
          <button onClick={() => navigate('/admin/thong-ke')}
            className="flex items-center gap-1 text-xs font-semibold mt-3 transition-colors hover:opacity-80"
            style={{ color: 'var(--accent-revenue)' }}>
            Xem thêm <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Đơn chờ xác nhận */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ background: 'color-mix(in srgb, var(--accent-warning) 12%, transparent)' }}>
              <ClipboardList className="h-5 w-5" style={{ color: 'var(--accent-warning)' }} />
            </div>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: 'color-mix(in srgb, var(--accent-warning) 12%, transparent)', color: 'var(--accent-warning)' }}>
              Cần xử lý
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">
            <CountUp to={pendingOrders} duration={1.5} separator="." />
          </p>
          <p className="text-sm text-gray-500 mt-1">Đơn chờ xác nhận</p>
          <button onClick={() => navigate('/admin/orders/online')}
            className="flex items-center gap-1 text-xs font-semibold mt-3 transition-colors hover:opacity-80"
            style={{ color: 'var(--accent-warning)' }}>
            Xem thêm <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Tổng sản phẩm / Kho hàng */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ background: 'color-mix(in srgb, var(--accent-info) 12%, transparent)' }}>
              <Package className="h-5 w-5" style={{ color: 'var(--accent-info)' }} />
            </div>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: 'color-mix(in srgb, var(--accent-info) 12%, transparent)', color: 'var(--accent-info)' }}>
              Kho hàng
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">
            <CountUp to={totalProducts} duration={1.5} separator="." />
          </p>
          <p className="text-sm text-gray-500 mt-1">Tổng sản phẩm</p>
          <button onClick={() => navigate('/admin/products')}
            className="flex items-center gap-1 text-xs font-semibold mt-3 transition-colors hover:opacity-80"
            style={{ color: 'var(--accent-info)' }}>
            Xem thêm <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Tổng khách hàng */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ background: 'color-mix(in srgb, var(--accent-success) 12%, transparent)' }}>
              <Users className="h-5 w-5" style={{ color: 'var(--accent-success)' }} />
            </div>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: 'color-mix(in srgb, var(--accent-success) 12%, transparent)', color: 'var(--accent-success)' }}>
              Thành viên
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">
            <CountUp to={totalUsers} duration={1.5} separator="." />
          </p>
          <p className="text-sm text-gray-500 mt-1">Tổng khách hàng</p>
          <button onClick={() => navigate('/admin/customers')}
            className="flex items-center gap-1 text-xs font-semibold mt-3 transition-colors hover:opacity-80"
            style={{ color: 'var(--accent-success)' }}>
            Xem thêm <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* ═══════════════ LỐI TẮT THAO TÁC NHANH ═══════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Lối tắt thao tác nhanh</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {shortcuts.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className="group flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-gray-200 bg-white transition-all duration-200 hover:border-[var(--primary-color)] hover:bg-[var(--primary-bg)] hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100 text-gray-500 transition-all duration-200 group-hover:text-white group-hover:bg-[var(--primary-color)]">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-center leading-tight text-gray-700 transition-colors duration-200 group-hover:text-[var(--primary-color)]">
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ═══════════════ 2 CỘT: ĐƠN HÀNG MỚI + TOP BÁN CHẠY ═══════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Đơn hàng mới nhất */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Đơn hàng mới nhất</h3>
            <span className="text-xs text-gray-400">{recentOrders.length} đơn</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-2.5 font-semibold text-gray-500 text-xs">Mã đơn</th>
                  <th className="text-left px-5 py-2.5 font-semibold text-gray-500 text-xs">Khách hàng</th>
                  <th className="text-right px-5 py-2.5 font-semibold text-gray-500 text-xs">Tổng tiền</th>
                  <th className="text-center px-5 py-2.5 font-semibold text-gray-500 text-xs">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-400 text-sm">
                      Chưa có đơn hàng nào
                    </td>
                  </tr>
                ) : recentOrders.map((order, i) => (
                  <tr key={order.maDonHang || i}
                    onClick={() => navigate(`/admin/orders/${order.maDonHang || order.id}`)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="px-5 py-3 font-medium text-gray-800">
                      #{order.maDonHangCode || order.maDonHang || '-'}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {order.khachHang?.hoTen || order.hoTen || order.tenNguoiNhan || 'Khách lẻ'}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-gray-800 tabular-nums">
                      {VND(order.tongTien || order.total || 0)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <AdminBadge color={statusColors[order.trangThaiDon] || 'gray'}>
                        {statusLabels[order.trangThaiDon] || 'Unknown'}
                      </AdminBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top áo bán chạy */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Top áo bán chạy</h3>
            <span className="text-xs text-gray-400">{bestSelling.length} sản phẩm</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-2.5 font-semibold text-gray-500 text-xs w-10">#</th>
                  <th className="text-left px-5 py-2.5 font-semibold text-gray-500 text-xs">Sản phẩm</th>
                  <th className="text-right px-5 py-2.5 font-semibold text-gray-500 text-xs">Đã bán</th>
                  <th className="text-right px-5 py-2.5 font-semibold text-gray-500 text-xs">Doanh thu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bestSelling.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-400 text-sm">
                      Chưa có dữ liệu bán chạy
                    </td>
                  </tr>
                ) : bestSelling.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-400 font-medium">{i + 1}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                          {item.urlAnhDaiDien ? (
                            <img src={imageUrl(item.urlAnhDaiDien)} alt=""
                              className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Package className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-gray-800 line-clamp-1">
                          {item.tenSanPham || 'Sản phẩm'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums"
                      style={{ color: 'var(--primary-color)' }}>
                      {item.soLuongDaBan ?? 0}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-gray-800 tabular-nums">
                      {VND((item.giaTrungBinh || 0) * (item.soLuongDaBan || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
