import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingBag, Tags, Ticket, FileText, Star, Users, UserCog, LogOut, ChevronDown, Menu, X, ShoppingCart, BarChart3 } from 'lucide-react'
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
  { to: '/admin', label: 'Bảng điều khiển', icon: LayoutDashboard, end: true },
  posItem,
  { to: '/admin/orders', label: 'Đơn hàng', icon: ShoppingBag },
  { to: '/admin/invoices', label: 'Hóa đơn', icon: FileText },
  productItem,
  { to: '/admin/categories', label: 'Danh mục', icon: Tags },
  { to: '/admin/brands', label: 'Thương hiệu', icon: Tags },
  { to: '/admin/sizes', label: 'Kích cỡ', icon: Tags },
  { to: '/admin/colors', label: 'Màu sắc', icon: Tags },
  { to: '/admin/coupons', label: 'Mã giảm giá', icon: Ticket },
  { to: '/admin/reviews', label: 'Đánh giá', icon: Star },
  { to: '/admin/customers', label: 'Khách hàng', icon: Users },
  { to: '/admin/users', label: 'Người dùng', icon: Users },
  { to: '/admin/employees', label: 'Nhân viên', icon: UserCog },
  { to: '/admin/thong-ke', label: 'Thống kê', icon: BarChart3 },
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
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-800 text-white transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-700">
          <Link to="/admin" className="text-lg font-bold tracking-wide">ZestStore<span className="text-blue-400">Admin</span></Link>
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <nav className="p-4 space-y-1">
          {nav.map((item) => {
            if (item.children) {
              const childActive = item.children.some(c => pathname.startsWith(c.to))
              const open = navOpen[item.label]
              return (
                <div key={item.label}>
                  <button onClick={() => toggleNav(item.label)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${childActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.label}
                    <ChevronDown className={`h-4 w-4 ml-auto transition ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children.map(child => {
                        let childActive = pathname === child.to
                        if (child.to === '/admin/products' && pathname.startsWith('/admin/products/') && !pathname.startsWith('/admin/products/detail')) childActive = true
                        return (
                          <Link key={child.to} to={child.to} onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition ${childActive ? 'bg-blue-500/60 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
                            {child.label}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }
            const active = item.end ? pathname === item.to : pathname.startsWith(item.to)
            return (
              <Link key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
                <item.icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <Link to="/" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white transition">
            <ChevronDown className="h-4 w-4 rotate-90" /> Về trang chủ
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
