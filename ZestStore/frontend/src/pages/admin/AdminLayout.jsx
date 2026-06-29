import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Package, ShoppingBag, Ticket, FileText, Star, Users, LogOut, ChevronDown, Menu, X, ShoppingCart, BarChart3, MessageCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'

const posItem = { label: 'Bán hàng', icon: ShoppingCart, children: [
  { to: '/admin/pos', label: 'Bán tại quầy' },
]}

const productItem = { label: 'Quản lý sản phẩm', icon: Package, children: [
  { to: '/admin/products', label: 'Sản phẩm' },
  { to: '/admin/products/detail', label: 'Sản phẩm chi tiết' },
]}

const nav = [
  posItem,
  { label: 'Đơn hàng', icon: ShoppingBag, children: [
    { to: '/admin/orders/online', label: 'Đơn hàng online' },
    { to: '/admin/orders/pos', label: 'Đơn tại quầy' },
  ]},
  { to: '/admin/invoices', label: 'Hóa đơn', icon: FileText },
  productItem,
  { to: '/admin/coupons', label: 'Mã giảm giá', icon: Ticket },
  { to: '/admin/reviews', label: 'Đánh giá', icon: Star },
  { label: 'Quản lý người dùng', icon: Users, children: [
    { to: '/admin/customers', label: 'Khách hàng' },
    { to: '/admin/employees', label: 'Nhân viên' },
  ]},
  { to: '/admin/thong-ke', label: 'Thống kê', icon: BarChart3 },
  { to: '/admin/chat', label: 'Hỗ trợ', icon: MessageCircle },
]

export default function AdminLayout() {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [navOpen, setNavOpen] = useState({})

  const toggleNav = (label) => setNavOpen(prev => ({ ...prev, [label]: !prev[label] }))

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <style>{`
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: #64748b; }
      `}</style>
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-slate-800 to-slate-900 text-white flex flex-col transform transition-transform duration-200 shadow-2xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center justify-between h-16 px-5 border-b border-white/5 shrink-0">
          <Link to="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-blue-500/20">ZS</div>
            <div>
              <p className="text-sm font-bold tracking-wide">ZestStore</p>
              <p className="text-[10px] font-medium text-blue-300/70 -mt-0.5">Quản trị</p>
            </div>
          </Link>
          <button className="lg:hidden text-slate-400 hover:text-white transition-colors" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button>
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
                        ? 'bg-gradient-to-r from-blue-500/15 to-transparent text-white border-l-2 border-blue-400'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                    }`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${
                      childActive ? 'bg-blue-500/20 text-blue-300' : 'text-slate-500 group-hover:text-slate-300'
                    }`}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="truncate">{item.label}</span>
                    <ChevronDown className={`h-3.5 w-3.5 ml-auto transition-all duration-200 ${open ? 'rotate-180 text-blue-400' : 'text-slate-600'}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="ml-4 pl-3 border-l border-white/5 space-y-0.5 pb-0.5">
                      {item.children.map(child => {
                        let childActive = pathname === child.to
                        if (child.to === '/admin/products' && pathname.startsWith('/admin/products/') && !pathname.startsWith('/admin/products/detail')) childActive = true
                        return (
                          <Link key={child.to} to={child.to} onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                              childActive
                                ? 'bg-blue-500/10 text-blue-300'
                                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
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
                    ? 'bg-gradient-to-r from-blue-500/15 to-transparent text-white border-l-2 border-blue-400'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                }`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${
                  active ? 'bg-blue-500/20 text-blue-300' : 'text-slate-500 group-hover:text-slate-300'
                }`}>
                  <item.icon className="h-4 w-4" />
                </div>
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="shrink-0 border-t border-white/5 px-3 py-2.5">
          <Link to="/" className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-all duration-200">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Về trang chủ
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <header className="bg-white border-b h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <button className="lg:hidden text-gray-600" onClick={() => setSidebarOpen(true)}><Menu className="h-6 w-6" /></button>
          <div />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {user?.hoTen?.charAt(0) || 'A'}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium">{user?.hoTen}</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
            <button onClick={handleLogout} className="ml-2 text-gray-400 hover:text-red-500"><LogOut className="h-5 w-5" /></button>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  )
}
