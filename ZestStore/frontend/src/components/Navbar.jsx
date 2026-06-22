import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Heart, User, Menu, X, Store, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useState, useRef, useEffect } from 'react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { count } = useCart()
  const { wishlistCount } = useWishlist()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

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
                <Link to="/wishlist" className="relative text-gray-600 hover:text-blue-700">
                  <Heart className="h-5 w-5" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none animate-scale-in">
                      {wishlistCount > 99 ? '99+' : wishlistCount}
                    </span>
                  )}
                </Link>
                <Link to="/cart" className="relative text-gray-600 hover:text-blue-700">
                  <ShoppingCart className="h-5 w-5" />
                  {count > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none animate-scale-in">
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </Link>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-1 text-gray-600 hover:text-blue-700 transition"
                  >
                    <User className="h-5 w-5" />
                    {user.hoTen?.split(' ').pop()}
                    <ChevronDown className={`h-4 w-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border py-2 z-50">
                      <Link to="/profile" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50">Tài khoản</Link>
                      <Link to="/orders" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50">Đơn hàng</Link>
                      <Link to="/change-password" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50">Đổi mật khẩu</Link>
                      <hr className="my-1" />
                      {user?.vaiTro === 'ADMIN' && (
                        <Link to="/admin" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50">Quản trị</Link>
                      )}
                      <button onClick={() => { handleLogout(); setDropdownOpen(false) }} className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50">Đăng xuất</button>
                    </div>
                  )}
                </div>
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
              <Link to="/wishlist" onClick={() => setOpen(false)} className="block text-gray-600">Yêu thích</Link>
              <Link to="/cart" onClick={() => setOpen(false)} className="block text-gray-600">Giỏ hàng</Link>
              <Link to="/orders" onClick={() => setOpen(false)} className="block text-gray-600">Đơn hàng</Link>
              <Link to="/profile" onClick={() => setOpen(false)} className="block text-gray-600">Tài khoản</Link>
              <Link to="/change-password" onClick={() => setOpen(false)} className="block text-gray-600">Đổi mật khẩu</Link>
              {user?.vaiTro === 'ADMIN' && <Link to="/admin" onClick={() => setOpen(false)} className="block text-gray-600">Quản trị</Link>}
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
