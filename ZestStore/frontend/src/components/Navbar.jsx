import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Heart, User, LogOut, Menu, X, Store } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-700">
            <Store className="h-6 w-6" /> ZestStore
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link to="/products" className="text-gray-600 hover:text-blue-700 transition">Sản phẩm</Link>
            {user ? (
              <>
                <Link to="/cart" className="relative text-gray-600 hover:text-blue-700"><ShoppingCart className="h-5 w-5" /></Link>
                <Link to="/wishlist" className="text-gray-600 hover:text-blue-700"><Heart className="h-5 w-5" /></Link>
                <Link to="/orders" className="text-gray-600 hover:text-blue-700">Đơn hàng</Link>
                <Link to="/profile" className="flex items-center gap-1 text-gray-600 hover:text-blue-700">
                  <User className="h-5 w-5" /> {user.hoTen?.split(' ').pop()}
                </Link>
                <button onClick={handleLogout} className="text-gray-400 hover:text-red-500"><LogOut className="h-5 w-5" /></button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-blue-700">Đăng nhập</Link>
                <Link to="/register" className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition">Đăng ký</Link>
              </>
            )}
          </div>
          <button className="md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t px-4 py-4 space-y-3 bg-white">
          <Link to="/products" onClick={() => setOpen(false)} className="block text-gray-600">Sản phẩm</Link>
          {user ? (
            <>
              <Link to="/cart" onClick={() => setOpen(false)} className="block text-gray-600">Giỏ hàng</Link>
              <Link to="/wishlist" onClick={() => setOpen(false)} className="block text-gray-600">Yêu thích</Link>
              <Link to="/orders" onClick={() => setOpen(false)} className="block text-gray-600">Đơn hàng</Link>
              <Link to="/profile" onClick={() => setOpen(false)} className="block text-gray-600">Tài khoản</Link>
              <button onClick={() => { handleLogout(); setOpen(false) }} className="block text-red-500">Đăng xuất</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="block text-gray-600">Đăng nhập</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="block text-blue-700 font-semibold">Đăng ký</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
