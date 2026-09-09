import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingBag, Tags, Ticket, Star, Users, UserCog, LogOut, ChevronDown, Menu, X, ShoppingCart, BarChart3, RefreshCw, Gift, Coins } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useState, useEffect, useRef } from 'react'
import api from '../../api/axios'
import NotificationBell from '../../components/admin/NotificationBell'
import AskAi from '../../components/admin/AskAi'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function AdminLayout() {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [navOpen, setNavOpen] = useState({})
  const [pendingReturns, setPendingReturns] = useState(0)
  const [accountOpen, setAccountOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const accountRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (!user || user.vaiTro === 'STAFF') return
    const fetch = () => api.get('/admin/return-requests/count').then(r => setPendingReturns(r.data.count)).catch(() => {})
    fetch()
    const interval = setInterval(fetch, 30000)
    return () => clearInterval(interval)
  }, [user])

  const role = typeof user?.vaiTro === 'object' ? user?.vaiTro?.tenVaiTro : user?.vaiTro
  const isStaff = role === 'STAFF'

  const posItem = { to: '/admin/pos', label: 'Bán hàng', icon: ShoppingCart }

  const nav = isStaff ? [
    posItem,
    { label: 'Đơn hàng', icon: ShoppingBag, children: [
      { to: '/admin/orders/pos', label: 'Đơn tại quầy' },
    ]},
  ] : [
    posItem,
    { label: 'Đơn hàng', icon: ShoppingBag, children: [
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
    { to: '/admin/coupons', label: 'Mã giảm giá', icon: Ticket },
    { to: '/admin/campaigns', label: 'Quà tặng', icon: Gift },
    { to: '/admin/diem-quy-tac', label: 'Quy tắc điểm', icon: Coins },
    { to: '/admin/reviews', label: 'Đánh giá', icon: Star },
    { label: 'Quản lý người dùng', icon: Users, children: [
      { to: '/admin/customers', label: 'Khách hàng' },
      { to: '/admin/employees', label: 'Nhân viên' },
    ]},
    { to: '/admin/thong-ke', label: 'Thống kê', icon: BarChart3 },
  ]

  const toggleNav = (label) => setNavOpen(prev => ({ ...prev, [label]: !prev[label] }))

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="min-h-screen bg-ivory flex">
      <style>{`
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(201,162,39,0.3); border-radius: 4px; }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: rgba(201,162,39,0.5); }
      `}</style>
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-noir-900 text-ivory flex flex-col transform transition-transform duration-200 shadow-2xl border-r border-gold/10 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center justify-between h-16 px-5 border-b border-gold/10 shrink-0">
          <Link to="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center text-noir text-xs font-bold shadow-gold">ZS</div>
            <div>
              <p className="font-serif text-sm font-bold tracking-wide">ZestStore</p>
              <p className="text-[10px] font-medium text-gold/70 -mt-0.5 tracking-widest uppercase">Quản trị</p>
            </div>
          </Link>
          <button className="lg:hidden text-stone-light/60 hover:text-gold transition-colors" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 sidebar-scroll">
          {nav.map((item) => {
            if (item.children) {
              const childActive = item.children.some(c => pathname.startsWith(c.to)) || (item.label === 'Đơn hàng' && pathname.startsWith('/admin/orders/'))
              const open = navOpen[item.label]
              return (
                <div key={item.label}>
                  <button onClick={() => toggleNav(item.label)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      childActive
                        ? 'bg-gradient-to-r from-gold/15 to-transparent text-ivory border-l-2 border-gold'
                        : 'text-stone-light/60 hover:bg-ivory/5 hover:text-ivory border-l-2 border-transparent'
                    }`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${
                      childActive ? 'bg-gold/20 text-gold' : 'text-stone-light/50 group-hover:text-stone-light/80'
                    }`}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="truncate">{item.label}</span>
                    <ChevronDown className={`h-3.5 w-3.5 ml-auto transition-all duration-200 ${open ? 'rotate-180 text-gold' : 'text-stone-light/40'}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="ml-4 pl-3 border-l border-gold/10 space-y-0.5 pb-0.5">
                      {item.children.map(child => {
                        let childActive = pathname === child.to
                        if (child.to === '/admin/products' && pathname.startsWith('/admin/products/') && !pathname.startsWith('/admin/products/detail')) childActive = true
                        return (
                          <Link key={child.to} to={child.to} onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                              childActive
                                ? 'bg-gold/10 text-gold'
                                : 'text-stone-light/60 hover:bg-ivory/5 hover:text-stone-light/90'
                            }`}>
                            <span className="w-1 h-1 rounded-full bg-current opacity-40 shrink-0" />
                            {child.label}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            }
            const active = item.end ? pathname === item.to : pathname.startsWith(item.to)
            return (
              <Link key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  active
                    ? 'bg-gradient-to-r from-gold/15 to-transparent text-ivory border-l-2 border-gold'
                    : 'text-stone-light/60 hover:bg-ivory/5 hover:text-ivory border-l-2 border-transparent'
                }`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${
                  active ? 'bg-gold/20 text-gold' : 'text-stone-light/50 group-hover:text-stone-light/80'
                }`}>
                  <item.icon className="h-4 w-4" />
                </div>
                <span className="truncate">{item.label}</span>
                {item.badge > 0 && <span className="ml-auto bg-bordeaux text-noir text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{item.badge > 99 ? '99+' : item.badge}</span>}
              </Link>
            )
          })}
        </nav>
        <div className="shrink-0 border-t border-gold/10 px-3 py-3" ref={accountRef}>
          <button onClick={() => setAccountOpen(!accountOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-ivory/5 transition-all duration-200 group cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center text-noir text-xs font-bold shadow-gold shrink-0">
              {user?.hoTen?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-ivory truncate">{user?.hoTen || 'Admin'}</p>
              <p className="text-[10px] text-stone-light/60 truncate">{isStaff ? 'Nhân viên' : 'Admin'}</p>
            </div>
            <ChevronDown className={`h-4 w-4 text-stone-light/40 transition-transform duration-200 ${accountOpen ? 'rotate-180' : ''}`} />
          </button>
          <div className={`overflow-hidden transition-all duration-200 ${accountOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="pt-1 pb-1 space-y-0.5">
              <Link to="/" onClick={() => { setAccountOpen(false); setSidebarOpen(false) }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-stone-light/60 hover:text-gold hover:bg-ivory/5 transition-all duration-200">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Về trang chủ
              </Link>
              <button onClick={(e) => { e.stopPropagation(); setAccountOpen(false); setConfirmLogout(true) }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-stone-light/60 hover:text-bordeaux hover:bg-bordeaux/10 transition-all duration-200">
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
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
