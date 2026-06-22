import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingBag, Tags, Ticket, FileText, Star, Users, UserCog, LogOut, ChevronDown, Menu, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'

const nav = [
  { to: '/admin', label: 'Bảng điều khiển', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Đơn hàng', icon: ShoppingBag },
  { to: '/admin/invoices', label: 'Hóa đơn', icon: FileText },
  { to: '/admin/products', label: 'Sản phẩm', icon: Package },
  { to: '/admin/categories', label: 'Danh mục', icon: Tags },
  { to: '/admin/coupons', label: 'Mã giảm giá', icon: Ticket },
  { to: '/admin/reviews', label: 'Đánh giá', icon: Star },
  { to: '/admin/customers', label: 'Khách hàng', icon: Users },
  { to: '/admin/employees', label: 'Nhân viên', icon: UserCog },
]

export default function AdminLayout() {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-800 text-white transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-auto`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-700">
          <Link to="/admin" className="text-lg font-bold tracking-wide">ZestStore<span className="text-blue-400">Admin</span></Link>
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <nav className="p-4 space-y-1">
          {nav.map(({ to, label, icon: Icon, end }) => {
            const active = end ? pathname === to : pathname.startsWith(to)
            return (
              <Link key={to} to={to} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
                <Icon className="h-5 w-5 shrink-0" />
                {label}
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

      <div className="flex-1 flex flex-col min-w-0">
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
