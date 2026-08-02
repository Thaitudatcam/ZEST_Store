import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getStats, getOrderStats, getRevenueByDay } from '../../api/admin'
import { Package, DollarSign, Users, Star } from 'lucide-react'
import CountUp from '../../components/ui/CountUp'

const robotGreetings = [
  ['Chào buổi sáng! ☕', 'Ngày mới tốt lành! 🌻', 'Sáng nay có đơn mới không? ✨', 'Cà phê sáng chưa admin? ☕'],
  ['Buổi chiều năng động! ⚡', 'Ăn trưa chưa admin? 🍜', 'Chiều nay bán gì hot? 🔥', 'Tiếp tục chiến thôi! 💪'],
  ['Buổi tối vui vẻ! 🌆', 'Tối nay đơn nhiều không? 📦', 'Về nhà chưa admin? 🏠', 'Tối rồi, nghỉ ngơi thôi! 😌'],
  ['Khuya rồi đó! 🌙', 'Còn thức làm gì vậy? 🦉', 'Đừng thức khuya nha! 😴', 'Ngủ sớm để mai bán đắt! 💤'],
]

function getGreetingSlot() {
  const h = new Date().getHours()
  if (h < 5) return 3
  if (h < 12) return 0
  if (h < 18) return 1
  if (h < 22) return 2
  return 3
}

function formatTime(now) {
  return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')
}

function fmt(n) {
  if (n == null) return '0'
  if (n >= 1000000000) return (n / 1000000000).toFixed(1) + 'B'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toLocaleString('vi-VN')
}

function VND(n) {
  try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n }
}

const cards = [
  { key: 'orders',   label: 'Đơn hàng',   icon: Package,  grad: 'from-gold to-gold-dark',       shadow: 'shadow-gold/40',      hoverBg: 'hover:border-gold/40 hover:shadow-gold/20' },
  { key: 'revenue',  label: 'Doanh thu',  icon: DollarSign, grad: 'from-emerald-deep to-[#2a6b50]', shadow: 'shadow-emerald-deep/40',    hoverBg: 'hover:border-emerald-deep/40 hover:shadow-emerald-deep/20' },
  { key: 'users',    label: 'Người dùng', icon: Users,     grad: 'from-royal to-[#3d3580]',   shadow: 'shadow-royal/40',     hoverBg: 'hover:border-royal/40 hover:shadow-royal/20' },
  { key: 'products', label: 'Sản phẩm',   icon: Star,     grad: 'from-noir-700 to-noir',     shadow: 'shadow-noir/40',      hoverBg: 'hover:border-noir/40 hover:shadow-noir/20' },
]

const positions = [
  { grid: 'row-start-1 col-start-1', extra: 'rounded-b-[40px]' },
  { grid: 'row-start-1 col-start-3', extra: 'rounded-b-[40px]' },
  { grid: 'row-start-3 col-start-1', extra: 'rounded-t-[40px]' },
  { grid: 'row-start-3 col-start-3', extra: 'rounded-t-[40px]' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const slot = getGreetingSlot()

  const [now, setNow] = useState(new Date())
  const [greetIdx, setGreetIdx] = useState(0)
  const [stats, setStats] = useState(null)
  const [orderStats, setOrderStats] = useState(null)
  const [todayRevenue, setTodayRevenue] = useState(null)
  const [robotReply, setRobotReply] = useState(null)
  const [loading, setLoading] = useState(true)
  const replyTimer = useRef(null)

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date())
      setGreetIdx(i => (i + 1) % 4)
    }, 30000)
    return () => clearInterval(id)
  }, [])

  const loadStats = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    return Promise.all([
      getStats().catch(() => null),
      getOrderStats().catch(() => null),
      getRevenueByDay(today, today).then(r => {
        if (Array.isArray(r)) return r.reduce((s, d) => s + Number(d.doanhThu || 0), 0)
        return null
      }).catch(() => null),
    ]).then(([s, os, rev]) => {
      setStats(s)
      setOrderStats(os)
      setTodayRevenue(rev)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadStats()
    const id = setInterval(loadStats, 30000)
    const onFocus = () => loadStats()
    window.addEventListener('focus', onFocus)
    return () => { clearInterval(id); window.removeEventListener('focus', onFocus) }
  }, [loadStats])

  const mergedOrders = orderStats ? {
    totalOrders: orderStats.totalOrders ?? 0,
    completed: orderStats.completed ?? 0,
    pending: (orderStats.pending ?? 0) + (orderStats.shipping ?? 0),
    cancelled: orderStats.cancelled ?? 0,
    todayOrders: orderStats.todayOrders ?? undefined,
  } : null

  const handleStatClick = useCallback((key) => {
    if (!stats && !mergedOrders) return
    let reply = ''
    switch (key) {
      case 'orders':
        if (mergedOrders) {
          reply = `📊 Có tổng cộng <b>${fmt(mergedOrders.totalOrders)}</b> đơn hàng.` +
            ` ✅ Đã giao <b>${fmt(mergedOrders.completed)}</b>,` +
            ` ⏳ đang xử lý <b>${fmt(mergedOrders.pending)}</b>,` +
            ` ❌ đã hủy <b>${fmt(mergedOrders.cancelled)}</b>.`
          if (mergedOrders.todayOrders != null) reply += ` 📅 Hôm nay có <b>${fmt(mergedOrders.todayOrders)}</b> đơn mới.`
        }
        break
      case 'revenue':
        reply = `💰 Doanh thu tháng này <b>${VND(stats?.monthlyRevenue || 0)}</b>.`
        if (todayRevenue != null) reply += ` Hôm nay đạt <b>${VND(todayRevenue)}</b>.`
        if (orderStats?.completed != null) reply += ` ✅ <b>${fmt(orderStats.completed)}</b> đơn đã hoàn thành.`
        break
      case 'users':
        reply = `👥 Hệ thống có <b>${fmt(stats?.totalUsers || 0)}</b> người dùng.`
        if (stats?.totalCustomers != null) reply += ` Gồm <b>${fmt(stats.totalCustomers)}</b> khách hàng`
        if (stats?.totalEmployees != null) reply += ` và <b>${fmt(stats.totalEmployees)}</b> nhân viên.`
        break
      case 'products':
        reply = `⭐ Tổng cộng <b>${fmt(stats?.totalProducts || 0)}</b> sản phẩm.`
        if (stats?.activeProducts != null) reply += ` Hiện có <b>${fmt(stats.activeProducts)}</b> sản phẩm đang bán.`
        break
    }
    setRobotReply(reply)
    if (replyTimer.current) clearTimeout(replyTimer.current)
    replyTimer.current = setTimeout(() => { setRobotReply(null); replyTimer.current = null }, 12000)
  }, [stats, mergedOrders, todayRevenue, orderStats])

  const getRawValue = (key) => {
    if (loading) return null
    switch (key) {
      case 'orders':   return stats?.totalOrders ?? 0
      case 'revenue':  return stats?.monthlyRevenue ?? 0
      case 'users':    return stats?.totalUsers ?? 0
      case 'products': return stats?.totalProducts ?? 0
      default:         return 0
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-7rem)] flex items-center justify-center">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-gold/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-royal/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-xl mx-auto">
        {/* Greeting */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-2xl font-bold text-ink">
            Chào {user?.hoTen || 'Admin'}!
          </h1>
          <p className="text-sm text-stone mt-1 tabular-nums">{formatTime(now)}</p>
        </div>

        {/* Grid */}
        <div className="relative grid grid-cols-3 gap-8 items-center">

          {cards.map((s, i) => {
            const Icon = s.icon
            const pos = positions[i]
            return (
              <button key={s.key}
                onClick={() => handleStatClick(s.key)}
                className={`${pos.grid} relative group backdrop-blur-xl bg-white/80 border border-gold/15 ${s.shadow} ${s.hoverBg} ${pos.extra} transition-all duration-300 p-5 h-[120px] flex flex-col items-center justify-center`}
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.grad} flex items-center justify-center shadow-lg ${s.shadow} group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-300`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                {s.key === 'orders' && getRawValue('orders') !== null ? (
                  <CountUp to={getRawValue('orders')} duration={1.5} className="text-xl font-bold text-ink leading-tight mt-1.5 tabular-nums" separator="." />
                ) : s.key === 'orders' ? (
                  <span className="text-xl font-bold text-ink leading-tight mt-1.5">...</span>
                ) : (
                  <span className="text-xl font-bold text-ink leading-tight mt-1.5 tabular-nums">{fmt(getRawValue(s.key) ?? 0)}</span>
                )}
                <span className="text-[10px] text-stone font-medium">{s.label}</span>
              </button>
            )
          })}

          {/* Robot */}
          <div className="col-start-2 row-start-1 row-span-3 flex flex-col items-center justify-center">
            <div className="relative flex flex-col items-center">
              {/* Speech bubble */}
              <div className="absolute -top-[140px] left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl rounded-3xl shadow-lux border border-gold/20 px-6 py-4 min-w-[280px] text-center animate-fade-in z-10">
                {robotReply ? (
                  <>
                    <p className="text-sm text-ink-soft leading-relaxed" dangerouslySetInnerHTML={{ __html: robotReply }} />
                    <p className="text-[10px] text-stone mt-1.5">{formatTime(now)}</p>
                  </>
                ) : (
                    <>
                      <p className="text-2xl font-bold bg-gradient-to-r from-gold to-gold-dark bg-clip-text text-transparent tracking-wider tabular-nums leading-tight">{formatTime(now)}</p>
                      <p className="text-sm text-stone">{robotGreetings[slot][greetIdx]}</p>
                    </>
                )}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/90 border-r border-b border-gold/20 rotate-45" />
              </div>

              {/* Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gold/20 rounded-full blur-3xl animate-glow-pulse" />

              <div className="relative flex flex-col items-center animate-float">
                <div className="flex flex-col items-center -mb-px">
                  <div className="w-1.5 h-6 bg-gradient-to-b from-sky-300 to-blue-500 rounded-full" />
                  <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-sky-200 to-blue-400 shadow-lg shadow-sky-300/60 animate-glow-pulse" />
                </div>
                <div className="relative w-[110px] h-[95px] rounded-[32px] bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 shadow-2xl shadow-blue-300/40 ring-[3px] ring-white/70 flex flex-col items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />
                  <div className="flex gap-5 items-center">
                    <div className="relative">
                      <div className="w-[21px] h-[21px] rounded-full bg-gradient-to-br from-cyan-200 to-cyan-400 shadow-[0_0_14px_4px_rgba(34,211,238,0.6)] flex items-center justify-center">
                        <div className="w-[10px] h-[10px] rounded-full bg-white shadow-inner shadow-white/80" />
                      </div>
                      <div className="absolute -inset-1.5 rounded-full bg-cyan-400/20 animate-glow-pulse" />
                    </div>
                    <div className="relative">
                      <div className="w-[21px] h-[21px] rounded-full bg-gradient-to-br from-cyan-200 to-cyan-400 shadow-[0_0_14px_4px_rgba(34,211,238,0.6)] flex items-center justify-center">
                        <div className="w-[10px] h-[10px] rounded-full bg-white shadow-inner shadow-white/80" />
                      </div>
                      <div className="absolute -inset-1.5 rounded-full bg-cyan-400/20 animate-glow-pulse" />
                    </div>
                  </div>
                  <div className="mt-2 flex gap-[4px]">
                    <div className="w-[4px] h-[4px] rounded-full bg-white/60" />
                    <div className="w-[4px] h-[4px] rounded-full bg-white/80" />
                    <div className="w-[4px] h-[4px] rounded-full bg-white/60" />
                  </div>
                  <div className="absolute left-3 bottom-4 w-4 h-2.5 rounded-full bg-gradient-to-r from-pink-300/30 to-transparent" />
                  <div className="absolute right-3 bottom-4 w-4 h-2.5 rounded-full bg-gradient-to-l from-pink-300/30 to-transparent" />
                </div>
                <div className="relative -mt-[4px]">
                  <div className="w-[84px] h-[42px] rounded-[20px] bg-gradient-to-b from-blue-600 to-indigo-700 shadow-inner shadow-blue-900/60 ring-[2px] ring-white/10">
                    <div className="absolute inset-0 flex items-center justify-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-400/70 shadow-[0_0_5px_2px_rgba(34,211,238,0.3)] animate-glow-pulse" style={{ animationDelay: '0s' }} />
                      <div className="w-2 h-2 rounded-full bg-cyan-400/40 shadow-[0_0_5px_2px_rgba(34,211,238,0.15)]" />
                      <div className="w-2 h-2 rounded-full bg-cyan-400/70 shadow-[0_0_5px_2px_rgba(34,211,238,0.3)] animate-glow-pulse" style={{ animationDelay: '0.5s' }} />
                    </div>
                  </div>
                </div>
                <div className="absolute top-[108px] -left-[20px] w-[20px] h-[28px] rounded-lg bg-gradient-to-b from-blue-500 to-indigo-600 shadow-sm ring-[1px] ring-white/20 -rotate-[18deg] origin-top" />
                <div className="absolute top-[108px] -right-[20px] w-[20px] h-[28px] rounded-lg bg-gradient-to-b from-blue-500 to-indigo-600 shadow-sm ring-[1px] ring-white/20 rotate-[18deg] origin-top" />
                <div className="flex gap-[20px] -mt-px">
                  <div className="w-[25px] h-[22px] rounded-b-[12px] bg-gradient-to-b from-blue-600 to-indigo-700 ring-[1px] ring-white/10" />
                  <div className="w-[25px] h-[22px] rounded-b-[12px] bg-gradient-to-b from-blue-600 to-indigo-700 ring-[1px] ring-white/10" />
                </div>
              </div>
              <span className="text-xs text-stone font-medium mt-3 tracking-wider">TRỢ LÝ AI</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}