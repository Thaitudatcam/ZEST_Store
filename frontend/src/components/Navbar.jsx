import { Link, useNavigate, useLocation } from 'react-router-dom'
import { User, Menu, X, Search, ShoppingCart } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useState, useRef, useEffect } from 'react'
import { searchSuggestions } from '../api/products'

import SafeImg from './SafeImg'
import NotificationBell from './NotificationBell'

const VND = (n) => { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }

const NAV_LINKS = [
  { to: '/', label: 'TRANG CHỦ' },
  { to: '/products', label: 'SẢN PHẨM' },
  { to: '/tra-cuu', label: 'TRA CỨU' },
  { to: '/gioi-thieu', label: 'VỀ CHÚNG TÔI' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const { count } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropdownRef = useRef(null)
  const searchRef = useRef(null)
  const debounceRef = useRef(null)

  const pathname = location.pathname

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
        .catch(() => {
          if (q === searchQuery.trim()) setSuggestions([])
        })
        .finally(() => { if (q === searchQuery.trim()) setSearchLoading(false) })
    }, 300)
  }, [searchQuery])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/?keyword=${encodeURIComponent(searchQuery.trim())}`)
      setShowSuggestions(false)
      setSearchQuery('')
    }
  }

  return (
    <nav className="sticky top-0 z-50">
      {/* Main Nav */}
      <div className="bg-white border-b border-stone/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-4">
            {/* Nav Links - Desktop */}
            <div className="hidden lg:flex items-center gap-1 flex-1">
              {NAV_LINKS.map((link) => (
                <Link key={link.to} to={link.to}
                  className={`px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors whitespace-nowrap ${
                    (link.to === '/' ? pathname === '/' : pathname.startsWith(link.to))
                      ? 'text-[var(--primary-color)]'
                      : 'text-ink hover:text-[var(--primary-color)]'
                  }`}>
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden lg:flex flex-1 max-w-md" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="w-full relative">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim() && suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="Tìm kiếm áo polo, sơ mi, 1 shirt..."
                  className="w-full pl-4 pr-10 py-2 border border-stone/20 rounded-full text-sm bg-ivory-50 text-ink placeholder-stone focus:outline-none focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)]/20 transition"
                />
                <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 p-2 bg-[var(--primary-color)] text-white rounded-full hover:bg-[var(--primary-hover)] transition">
                  <Search className="h-4 w-4" />
                </button>
              </form>
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 border border-stone/10 rounded-xl bg-white shadow-lg max-h-60 overflow-y-auto z-50">
                  {suggestions.map((p) => (
                    <Link key={p.maSanPham} to={`/products/${p.slug}`}
                      onClick={() => { setShowSuggestions(false); setSearchQuery('') }}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-ivory-100 transition">
                      <SafeImg src={p.urlAnhDaiDien} className="w-8 h-8 rounded object-cover bg-ivory-200 shrink-0" fallback="https://placehold.co/32x32/ece7da/8B6914?text=Z" />
                      <span className="text-sm truncate flex-1 text-ink">{p.tenSanPham}</span>
                      <span className="text-xs text-[var(--primary-color)] font-semibold tabular-nums">{VND(p.gia || 0)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Mobile Search */}
              <button onClick={() => navigate('/?search=1')} className="lg:hidden p-2 text-stone hover:text-ink transition" aria-label="Tìm kiếm">
                <Search className="h-5 w-5" />
              </button>

              {user ? (
                <>
                  <NotificationBell />
                  <Link to="/cart" className="relative p-2 text-stone hover:text-ink transition" aria-label="Giỏ hàng">
                    <ShoppingCart className="h-5 w-5" />
                    {count > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-[var(--primary-color)] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
                        {count > 99 ? '99+' : count}
                      </span>
                    )}
                  </Link>
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="p-2 text-stone hover:text-ink transition"
                    >
                      <User className="h-5 w-5" />
                    </button>
                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-stone/10 py-2 z-50">
                        <Link to="/profile" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-ink hover:bg-ivory-100 transition">Tài khoản</Link>
                        <Link to="/orders" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-ink hover:bg-ivory-100 transition">Đơn hàng</Link>
                        <Link to="/wishlist" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-ink hover:bg-ivory-100 transition">Yêu thích</Link>
                        {(user?.vaiTro === 'ADMIN' || (user?.vaiTro === 'STAFF' && user?.choPhepBanHang)) && (
                          <Link to={user?.vaiTro === 'ADMIN' ? '/admin' : '/admin/pos'} onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-[var(--primary-color)] font-semibold hover:bg-ivory-100 transition">{user?.vaiTro === 'ADMIN' ? 'Quản trị' : 'Bán hàng'}</Link>
                        )}
                        <hr className="my-1 border-stone/10" />
                        <button onClick={() => { setDropdownOpen(false); logout(); navigate('/login') }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition">Đăng xuất</button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Link to="/login" className="p-2 text-stone hover:text-ink transition" aria-label="Đăng nhập">
                  <User className="h-5 w-5" />
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-stone hover:text-ink transition" aria-label="Menu">
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-b border-stone/10 px-4 py-3 space-y-1">
          <form onSubmit={handleSearchSubmit} className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm kiếm..." autoFocus
                className="w-full pl-9 pr-4 py-2 border border-stone/20 rounded-full text-sm bg-ivory-50 text-ink placeholder-stone focus:outline-none focus:border-[var(--primary-color)]" />
            </div>
          </form>
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
              className={`block py-2.5 text-sm font-semibold ${
                (link.to === '/' ? pathname === '/' : pathname.startsWith(link.to))
                  ? 'text-[var(--primary-color)]' : 'text-ink hover:text-[var(--primary-color)]'
              }`}>
              {link.label}
            </Link>
          ))}
          {!user && (
            <div className="pt-2 border-t border-stone/10 space-y-1">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm text-ink hover:text-[var(--primary-color)] transition">Đăng nhập</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm text-[var(--primary-color)] font-semibold">Đăng ký</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
