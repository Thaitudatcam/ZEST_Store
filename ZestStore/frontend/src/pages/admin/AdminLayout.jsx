import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, BarChart3, ShoppingCart, ShoppingBag, Package, Tags, Ticket, Star, Users, LogOut, ChevronDown, ChevronLeft, Menu, X, RefreshCw, Gift, Coins, MessageSquare, ClipboardList } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useState, useEffect } from 'react'
import api from '../../api/axios'
import NotificationBell from '../../components/admin/NotificationBell'
import AskAi from '../../components/admin/AskAi'
import ConfirmDialog from '../../components/ConfirmDialog'
import logoImg from '../../pictures/ZS.png'

export default function AdminLayout() {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [navOpen, setNavOpen] = useState({})
  const [pendingReturns, setPendingReturns] = useState(0)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (!user || user.vaiTro === 'STAFF') return
    const fetch = () => api.get('/admin/return-requests/count').then(r => setPendingReturns(r.data.count)).catch(() => {})
    fetch()
    const interval = setInterval(fetch, 30000)
    return () => clearInterval(interval)
  }, [user])

  const role = typeof user?.vaiTro === 'object' ? user?.vaiTro?.tenVaiTro : user?.vaiTro
  const isStaff = role === 'STAFF'

  const topNav = [
    { to: '/', label: 'Trang chủ', icon: Home, end: true },
    { to: '/admin/thong-ke', label: 'Thống kê', icon: BarChart3 },
    { to: '/admin/pos', label: 'Bán hàng', icon: ShoppingCart },
  ]

  const managementNav = isStaff ? [
    { label: 'Quản lý hóa đơn', icon: ClipboardList, children: [
      { to: '/admin/orders/pos', label: 'Đơn tại quầy' },
    ]},
  ] : [
    { label: 'Quản lý hóa đơn', icon: ClipboardList, children: [
      { to: '/admin/orders/online', label: 'Đơn hàng online' },
      { to: '/admin/orders/pos', label: 'Đơn tại quầy' },
    ]},
    { to: '/admin/returns', label: 'Trả hàng', icon: RefreshCw, badge: pendingReturns },
    { label: 'Quản lý sản phẩm', icon: Package, children: [
      { to: '/admin/products', label: 'Sản phẩm' },
      { to: '/admin/products/detail', label: 'Sản phẩm chi tiết' },
      { to: '/admin/categories', label: 'Danh mục' },
      { to: '/admin/brands', label: 'Thương hiệu' },
    ]},
    { label: 'Danh sách thuộc tính', icon: Tags, children: [
      { to: '/admin/colors', label: 'Màu sắc' },
      { to: '/admin/sizes', label: 'Kích cỡ' },
    ]},
    { to: '/admin/coupons', label: 'Quản lý giảm giá', icon: Ticket },
    { label: 'Quản lý tài khoản', icon: Users, children: [
      { to: '/admin/customers', label: 'Khách hàng' },
      { to: '/admin/employees', label: 'Nhân viên' },
    ]},
    { to: '/admin/campaigns', label: 'Quà tặng', icon: Gift },
    { to: '/admin/diem-quy-tac', label: 'Quy tắc điểm', icon: Coins },
    { to: '/admin/reviews', label: 'Đánh giá', icon: Star },
    { to: '/admin/chat', label: 'Quản lý Chat', icon: MessageSquare },
  ]

  const toggleNav = (label) => setNavOpen(prev => ({ ...prev, [label]: !prev[label] }))
  const handleLogout = () => { logout(); navigate('/login') }

  const isActive = (item) => item.end ? pathname === item.to : pathname.startsWith(item.to)
  const isChildActive = (item) => item.children?.some(c => pathname.startsWith(c.to)) || (item.label === 'Quản lý hóa đơn' && pathname.startsWith('/admin/orders/'))

  const renderNavItem = (item, isTop = false) => {
    if (item.children) {
      const childActive = isChildActive(item)
      const open = navOpen[item.label]
      return (
        <div key={item.label}>
          <button onClick={() => toggleNav(item.label)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
              childActive
                ? 'bg-[var(--primary-color)] text-white'
                : 'text-stone-light/60 hover:bg-white/5 hover:text-ivory'
            }`}>
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
            {!collapsed && (
              <>
                {item.badge > 0 && <span className="bg-bordeaux text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{item.badge > 99 ? '99+' : item.badge}</span>}
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
              </>
            )}
          </button>
          {!collapsed && (
            <div className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="ml-4 pl-3 border-l border-gold/10 space-y-0.5 py-0.5">
                {item.children.map(child => {
                  let childActive = pathname === child.to
                  if (child.to === '/admin/products' && pathname.startsWith('/admin/products/') && !pathname.startsWith('/admin/products/detail')) childActive = true
                  return (
                    <Link key={child.to} to={child.to} onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                        childActive ? 'bg-[var(--primary-color)]/15 text-[var(--primary-color)] font-semibold' : 'text-stone-light/50 hover:text-ivory hover:bg-white/5'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${childActive ? 'bg-[var(--primary-color)]' : 'bg-stone-light/30'}`} />
                      {child.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )
    }

    const active = isActive(item)
    return (
      <Link key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          active ? 'bg-[var(--primary-color)] text-white' : 'text-stone-light/60 hover:bg-white/5 hover:text-ivory'
        }`}>
        <item.icon className="h-[18px] w-[18px] shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
        {!collapsed && item.badge > 0 && <span className="ml-auto bg-bordeaux text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{item.badge > 99 ? '99+' : item.badge}</span>}
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-ivory flex">
      <style>{`
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(201,162,39,0.3); border-radius: 4px; }
      `}</style>
      <aside className={`fixed inset-y-0 left-0 z-40 ${collapsed ? 'w-[72px]' : 'w-64'} bg-noir-900 text-ivory flex flex-col transform transition-all duration-200 shadow-2xl border-r border-gold/10 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Logo */}
        <div className={`shrink-0 py-5 border-b border-gold/10 ${collapsed ? 'px-2' : 'px-5'}`}>
          <Link to="/admin" className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 ring-1 ring-gold/30">
              <img src={logoImg} alt="ZestStore" className="w-full h-full object-contain" />
            </div>
            {!collapsed && (
              <div>
                <p className="font-serif text-sm font-bold tracking-wide">ZestStore</p>
                <p className="text-[10px] font-medium text-gold/70 -mt-0.5 tracking-widest uppercase">Quản trị</p>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 sidebar-scroll">
          {topNav.map(item => renderNavItem(item, true))}

          <div className={`pt-4 pb-1.5 ${collapsed ? 'px-1' : 'px-2'}`}>
            <p className={`text-[10px] font-bold tracking-[0.2em] uppercase text-stone-light/30 ${collapsed ? 'text-center' : ''}`}>
              {collapsed ? '···' : 'Quản lý'}
            </p>
          </div>

          {managementNav.map(item => renderNavItem(item))}
        </nav>

        {/* Bottom */}
        <div className="shrink-0 border-t border-gold/10 px-3 py-3 space-y-1">
          <button onClick={() => setCollapsed(v => !v)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-light/60 hover:bg-white/5 hover:text-ivory transition-all duration-200">
            <ChevronLeft className={`h-[18px] w-[18px] shrink-0 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && <span>Thu gọn</span>}
          </button>
          <button onClick={() => setConfirmLogout(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-light/60 hover:bg-bordeaux/10 hover:text-bordeaux transition-all duration-200">
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col min-w-0 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-64'} transition-all duration-200`}>
        <header className="bg-ivory border-b border-gold/15 h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 gap-4">
          <button className="lg:hidden text-ink-soft shrink-0" onClick={() => setSidebarOpen(true)}><Menu className="h-6 w-6" /></button>
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            <NotificationBell />
            <AskAi />
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-noir/50 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <ConfirmDialog
        open={confirmLogout}
        title="Đăng xuất"
        message="Bạn có chắc muốn đăng xuất khỏi tài khoản này?"
        confirmText="Đăng xuất"
        variant="gold"
        onConfirm={() => { setConfirmLogout(false); handleLogout() }}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  )
}
