import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Heart, User, Menu, X, Store, ChevronDown, Search, Loader } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useState, useRef, useEffect } from 'react'
import { searchSuggestions } from '../api/products'
import { useToast } from '../context/ToastContext'
import SafeImg from './SafeImg'

const VND = (n) => { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }

export default function Navbar() {
  const { user, logout } = useAuth()
  const { count } = useCart()
  const { wishlistCount } = useWishlist()
  const navigate = useNavigate()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const dropdownRef = useRef(null)
  const searchRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target))
        setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!searchQuery.trim()) { setSuggestions([]); setShowSuggestions(false); return }
    const q = searchQuery.trim()
    setSearchLoading(true)
    debounceRef.current = setTimeout(() => {
      searchSuggestions(q, 5)
        .then((data) => {
          if (q === searchQuery.trim()) { setSuggestions(data || []); setShowSuggestions(true) }
        })
        .catch((err) => {
          if (q === searchQuery.trim()) setSuggestions([])
          console.error('Search error:', err)
        })
        .finally(() => { if (q === searchQuery.trim()) setSearchLoading(false) })
    }, 300)
  }, [searchQuery])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(searchQuery.trim())}`)
      setShowSuggestions(false)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-700 shrink-0">
            <Store className="h-6 w-6" /> ZestStore
          </Link>

          <div className="hidden md:flex flex-1 max-w-md relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
                  placeholder="Tìm sản phẩm..."
                  className="w-full pl-9 pr-10 py-2 border rounded-full text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
                {searchLoading && <Loader className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />}
              </div>
            </form>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white border rounded-xl shadow-lg z-50 py-2 max-h-80 overflow-y-auto">
                {suggestions.map((p) => (
                  <Link key={p.maSanPham} to={`/products/${p.slug}`}
                    onClick={() => { setShowSuggestions(false); setSearchQuery('') }}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-blue-50 transition">
                    <SafeImg src={p.urlAnhDaiDien} className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0" fallback="https://placehold.co/40x40/e2e8f0/475569?text=P" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.tenSanPham}</p>
                      <p className="text-xs text-blue-700 font-semibold">{VND(p.gia || 0)}</p>
                    </div>
                    {p.tongTonKho === 0 && <span className="text-[10px] text-red-500 font-semibold shrink-0">Hết hàng</span>}
                  </Link>
                ))}
                <div className="border-t mt-1 pt-1">
                  <button onClick={handleSearchSubmit}
                    className="w-full text-left px-4 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 transition">
                    Xem tất cả kết quả "{searchQuery}"
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/products" className="text-gray-600 hover:text-blue-700 transition text-sm font-medium">Sản phẩm</Link>
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
                    className="flex items-center gap-1 text-gray-600 hover:text-blue-700 transition text-sm"
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
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-gray-600 hover:text-blue-700 transition text-sm">Đăng nhập</Link>
                <Link to="/register" className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800 transition">Đăng ký</Link>
              </div>
            )}
          </div>

          <div className="flex md:hidden items-center gap-2">
            <button onClick={() => setSearchOpen(!searchOpen)} className="text-gray-600">
              <Search className="h-5 w-5" />
            </button>
            <Link to="/cart" className="relative text-gray-600">
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{count}</span>}
            </Link>
            <button onClick={() => setOpen(!open)}>
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="md:hidden border-t px-4 py-3 bg-white">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm sản phẩm..." autoFocus
                className="w-full pl-9 pr-4 py-2 border rounded-full text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </form>
          {showSuggestions && suggestions.length > 0 && (
            <div className="mt-2 border rounded-xl bg-white shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((p) => (
                <Link key={p.maSanPham} to={`/products/${p.slug}`}
                  onClick={() => { setShowSuggestions(false); setSearchQuery(''); setSearchOpen(false) }}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-blue-50">
                  <SafeImg src={p.urlAnhDaiDien} className="w-8 h-8 rounded object-cover bg-gray-100 shrink-0" fallback="https://placehold.co/32x32/e2e8f0/475569?text=P" />
                  <span className="text-sm truncate flex-1">{p.tenSanPham}</span>
                  <span className="text-xs text-blue-700 font-semibold">{VND(p.gia || 0)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

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
