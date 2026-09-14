import { Link, useNavigate, useLocation } from 'react-router-dom'
import { User, Menu, X, Search, ShoppingCart, ArrowRight, LogOut, UserCircle, ShoppingBag } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useState, useRef, useEffect } from 'react'
import { searchSuggestions, getProducts } from '../api/products'

import SafeImg from './SafeImg'
import NotificationBell from './NotificationBell'

const VND = (n) => { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }

const SEARCH_CHIPS = [
  { label: 'Áo Polo Nam', keyword: 'áo polo nam' },
  { label: 'Áo T-Shirt', keyword: 'áo t-shirt' },
  { label: 'Áo Sơ Mi', keyword: 'áo sơ mi' },
  { label: 'Áo Thun Nam', keyword: 'áo thun nam' },
  { label: 'Ưu Đãi Hè', keyword: 'ưu đãi' },
]

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
  const [defaultProducts, setDefaultProducts] = useState([])
  const [defaultLoading, setDefaultLoading] = useState(false)
  const dropdownRef = useRef(null)
  const searchRef = useRef(null)
  const debounceRef = useRef(null)

  const pathname = location.pathname

  const fetchDefaultProducts = () => {
    if (defaultProducts.length > 0) return
    setDefaultLoading(true)
    getProducts({ page: 0, size: 6, sortBy: 'maSanPham', sortDir: 'desc' })
      .then((res) => setDefaultProducts(res?.content || []))
      .catch(() => {})
      .finally(() => setDefaultLoading(false))
  }

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
    if (!searchQuery.trim()) { setSuggestions([]); return }
    const q = searchQuery.trim()
    setSearchLoading(true)
    debounceRef.current = setTimeout(() => {
      searchSuggestions(q, 6)
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
      navigate(`/products?keyword=${encodeURIComponent(searchQuery.trim())}`)
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
            <div className="hidden lg:flex flex-1 max-w-sm relative" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="w-full relative">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => { setShowSuggestions(true); if (!searchQuery.trim()) fetchDefaultProducts() }}
                  placeholder="Tìm kiếm áo polo, sơ mi, 1 shirt..."
                  className="w-full pl-4 pr-10 py-2 border border-stone/20 rounded-full text-sm bg-ivory-50 text-ink placeholder-stone focus:outline-none focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)]/20 transition"
                />
                <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 p-2 bg-[var(--primary-color)] text-white rounded-full hover:bg-[var(--primary-hover)] transition">
                  <Search className="h-4 w-4" />
                </button>
              </form>
              {showSuggestions && (
                <div className="absolute top-full right-0 mt-2 w-[420px] border border-stone/10 rounded-2xl bg-white shadow-2xl z-50 overflow-hidden">
                  <div className="px-4 pt-3 pb-2">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                        <Search className="w-3 h-3 text-red-500" />
                      </div>
                      <span className="text-xs font-bold text-ink tracking-wide">TÌM KIẾM GỢI Ý</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-1">
                      {SEARCH_CHIPS.map((chip) => (
                        <button key={chip.keyword}
                          onClick={() => { setSearchQuery(chip.keyword) }}
                          className="px-2.5 py-1 text-[11px] font-medium rounded-full border border-stone/20 text-ink hover:border-[var(--primary-color)] hover:text-[var(--primary-color)] hover:bg-[var(--primary-bg)] transition">
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="px-4 pb-2">
                    <p className="text-[11px] font-bold text-ink tracking-wide mb-2">SẢN PHẨM NỔI BẬT GỢI Ý</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(searchQuery.trim() ? suggestions : defaultProducts).slice(0, 3).map((p) => (
                        <Link key={p.maSanPham} to={`/products/${p.slug}`}
                          onClick={() => { setShowSuggestions(false); setSearchQuery('') }}
                          className="group rounded-xl border border-stone/10 overflow-hidden hover:shadow-md transition">
                          <div className="aspect-square bg-ivory-100 overflow-hidden">
                            <SafeImg src={p.urlAnhDaiDien} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" fallback="https://placehold.co/200x200/ece7da/8B6914?text=Z" />
                          </div>
                          <div className="p-2">
                            <p className="text-[11px] font-medium text-ink truncate leading-snug">{p.tenSanPham}</p>
                            <p className="text-xs font-bold text-[var(--primary-color)] mt-0.5 tabular-nums">{VND(p.gia || 0)}</p>
                          </div>
                        </Link>
                      ))}
                      {(searchQuery.trim() ? searchLoading : defaultLoading) && (
                        <div className="col-span-3 py-4 text-center">
                          <div className="inline-block w-4 h-4 border-2 border-stone/20 border-t-[var(--primary-color)] rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>
                  {((searchQuery.trim() && suggestions.length > 0) || (!searchQuery.trim() && defaultProducts.length > 0)) && (
                    <Link to={`/products?keyword=${encodeURIComponent(searchQuery.trim())}`}
                      onClick={() => { setShowSuggestions(false); setSearchQuery('') }}
                      className="flex items-center justify-between px-4 py-2.5 border-t border-stone/10 bg-ivory-50 hover:bg-ivory-100 transition">
                      <span className="text-[11px] text-stone">Tìm thấy {(searchQuery.trim() ? suggestions : defaultProducts).length} sản phẩm</span>
                      <span className="text-[11px] font-semibold text-[var(--primary-color)] flex items-center gap-1">
                        Xem tất cả ({(searchQuery.trim() ? suggestions : defaultProducts).length})
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </Link>
                  )}
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
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone/10 z-50 overflow-hidden">
                        <div className="px-5 pt-5 pb-4">
                          <p className="text-gold text-xs font-semibold tracking-wider uppercase mb-1">Xin chào</p>
                          <p className="text-ink font-bold text-base truncate">{user?.hoTen || 'Khách hàng'}</p>
                          <p className="text-stone text-xs mt-0.5">Vai trò: {user?.vaiTro === 'ADMIN' ? 'Quản trị viên' : user?.vaiTro === 'STAFF' ? 'Nhân viên' : 'Khách hàng'}</p>
                        </div>
                        <hr className="border-stone/10" />
                        <div className="py-2 px-2">
                          <Link to="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-ink hover:bg-ivory rounded-lg transition">
                            <UserCircle className="h-4.5 w-4.5 text-stone" />
                            Hồ sơ
                          </Link>
                          <Link to="/orders" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-ink hover:bg-ivory rounded-lg transition">
                            <ShoppingBag className="h-4.5 w-4.5 text-stone" />
                            Đơn hàng của tôi
                          </Link>
                          {(user?.vaiTro === 'ADMIN' || (user?.vaiTro === 'STAFF' && user?.choPhepBanHang)) && (
                            <Link to={user?.vaiTro === 'ADMIN' ? '/admin' : '/admin/pos'} onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--primary-color)] font-semibold hover:bg-ivory rounded-lg transition">
                              Quản trị
                            </Link>
                          )}
                        </div>
                        <div className="px-3 pb-3">
                          <button
                            onClick={() => { setDropdownOpen(false); logout(); navigate('/login') }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gold text-noir font-semibold text-sm rounded-xl hover:bg-gold-light transition"
                          >
                            <LogOut className="h-4 w-4" />
                            Đăng xuất
                          </button>
                        </div>
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
