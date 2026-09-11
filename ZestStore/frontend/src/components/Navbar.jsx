import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Shirt, User, Menu, X, ChevronDown, Search, Loader, Ticket, Heart, ShoppingCart } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useVoucher } from '../context/VoucherContext'
import { useState, useRef, useEffect } from 'react'
import { searchSuggestions } from '../api/products'
import { getActiveCategories } from '../api/categories'

import { useToast } from '../context/ToastContext'
import SafeImg from './SafeImg'
import NotificationBell from './NotificationBell'
import ConfirmDialog from './ConfirmDialog'

const VND = (n) => { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }

const NavPill = ({ to, label, active }) => (
  <Link to={to}
    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
      active ? 'bg-noir text-white shadow-sm' : 'text-ink-soft hover:text-noir hover:bg-noir/5'
    }`}>
    {label}
  </Link>
)

export default function Navbar() {
  const { user, logout } = useAuth()
  const { count } = useCart()
  const { wishlistCount } = useWishlist()
  const { voucherCount } = useVoucher()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [categories, setCategories] = useState([])
  const dropdownRef = useRef(null)
  const searchRef = useRef(null)
  const debounceRef = useRef(null)
  const [confirmLogout, setConfirmLogout] = useState(false)

  const pathname = location.pathname
  const categoryParam = new URLSearchParams(location.search).get('category')

  useEffect(() => {
    getActiveCategories()
      .then((data) => {
        if (Array.isArray(data)) setCategories(data.filter((c) => c.slug && c.tenDanhMuc))
      })
      .catch(() => {})
  }, [])

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
      navigate(`/?keyword=${encodeURIComponent(searchQuery.trim())}`)
      setShowSuggestions(false)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  const handleLogout = () => { logout(); navigate('/login') }
  const requestLogout = () => setConfirmLogout(true)

  return (
    <nav className="bg-beige sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link to="/" className="flex items-center gap-2.5 font-serif font-bold text-xl text-noir shrink-0 group">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-noir text-white group-hover:scale-105 transition-transform">
              <Shirt className="h-4 w-4" />
            </span>
            <span>Zest<span className="text-gold">Store</span></span>
          </Link>

          <div className="hidden lg:flex items-center justify-center flex-1 gap-0.5 min-w-0">
            <NavPill to="/" label="Trang chủ" active={pathname === '/' && !categoryParam} />
            {categories.map((c) => (
              <NavPill key={c.maDanhMuc} to={`/?category=${c.slug}`} label={c.tenDanhMuc} active={pathname === '/' && categoryParam === c.slug} />
            ))}
            <NavPill to="/gioi-thieu" label="Giới thiệu" active={pathname.startsWith('/gioi-thieu')} />
          </div>

          <div className="hidden lg:flex items-center gap-1 shrink-0">
            <button onClick={() => setSearchOpen(!searchOpen)} className="flex items-center justify-center w-9 h-9 rounded-full text-ink-soft hover:text-noir hover:bg-noir/5 transition" aria-label="Tìm kiếm">
              <Search className="h-5 w-5" />
            </button>
            {user && <NotificationBell />}
            <Link to="/cart" className="relative flex items-center justify-center w-9 h-9 rounded-full text-ink-soft hover:text-noir hover:bg-noir/5 transition" aria-label="Giỏ hàng">
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-bordeaux text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none animate-scale-in">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1.5 pl-1.5 pr-1 py-1 rounded-full hover:bg-noir/5 transition"
                >
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-noir text-white text-xs font-bold">
                    {user.hoTen?.charAt(0).toUpperCase()}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-ink-soft transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-beige-light rounded-xl shadow-lux border border-beige-deep/40 py-2 z-50">
                    <Link to="/profile" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-ink-soft hover:bg-noir/5 hover:text-noir transition">Tài khoản</Link>
                    <Link to="/orders" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-ink-soft hover:bg-noir/5 hover:text-noir transition">Đơn hàng</Link>
                    <Link to="/wishlist" onClick={() => setDropdownOpen(false)} className="flex items-center justify-between px-4 py-2 text-sm text-ink-soft hover:bg-noir/5 hover:text-noir transition">
                      <span className="flex items-center gap-2"><Heart className="h-4 w-4" /> Yêu thích</span>
                      {wishlistCount > 0 && <span className="text-xs font-semibold text-bordeaux tabular-nums">{wishlistCount}</span>}
                    </Link>
                    <Link to="/vouchers" onClick={() => setDropdownOpen(false)} className="flex items-center justify-between px-4 py-2 text-sm text-ink-soft hover:bg-noir/5 hover:text-noir transition">
                      <span className="flex items-center gap-2"><Ticket className="h-4 w-4" /> Voucher</span>
                      {voucherCount > 0 && <span className="text-xs font-semibold text-gold-dark tabular-nums">{voucherCount}</span>}
                    </Link>
                    <Link to="/vi-zeststore" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-ink-soft hover:bg-noir/5 hover:text-noir transition">Ví ZestStore</Link>
                    <hr className="my-1 border-beige-deep/40" />
                    {(user?.vaiTro === 'ADMIN' || (user?.vaiTro === 'STAFF' && user?.choPhepBanHang)) && (
                      <Link to={user?.vaiTro === 'ADMIN' ? '/admin' : '/admin/pos'} onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gold-dark font-semibold hover:bg-noir/5 transition">{user?.vaiTro === 'ADMIN' ? 'Quản trị' : 'Bán hàng'}</Link>
                    )}
                    <button onClick={() => { requestLogout(); setDropdownOpen(false) }} className="w-full text-left block px-4 py-2 text-sm text-bordeaux hover:bg-bordeaux/5 transition">Đăng xuất</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-1">
                <Link to="/login" className="text-stone hover:text-noir transition text-sm font-medium px-2">Đăng nhập</Link>
                <Link to="/register" className="bg-noir text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-noir-800 transition shadow-sm">Đăng ký</Link>
              </div>
            )}
          </div>

          <div className="flex lg:hidden items-center gap-2">
            <button onClick={() => setSearchOpen(!searchOpen)} className="text-ink-soft">
              <Search className="h-5 w-5" />
            </button>
            {user && <NotificationBell className="w-8 h-8" />}
            <Link to="/cart" className="relative text-ink-soft">
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && <span className="absolute -top-2 -right-2 bg-bordeaux text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">{count}</span>}
            </Link>
            <button onClick={() => setOpen(!open)} className="text-ink-soft">
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-beige-deep/30 px-4 py-3 bg-beige">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative max-w-3xl mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm sản phẩm..." autoFocus
                className="w-full pl-9 pr-4 py-2 border border-beige-deep/50 rounded-full text-sm bg-beige-light text-ink placeholder-stone focus:outline-none focus:ring-2 focus:ring-noir/20 focus:border-noir/30" />
            </div>
          </form>
          {showSuggestions && suggestions.length > 0 && (
            <div className="mt-2 border border-beige-deep/40 rounded-xl bg-beige-light shadow-lux max-h-60 overflow-y-auto max-w-3xl mx-auto">
              {suggestions.map((p) => (
                <Link key={p.maSanPham} to={`/products/${p.slug}`}
                  onClick={() => { setShowSuggestions(false); setSearchQuery(''); setSearchOpen(false) }}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-noir/5">
                  <SafeImg src={p.urlAnhDaiDien} className="w-8 h-8 rounded object-cover bg-beige-deep/30 shrink-0" fallback="https://placehold.co/32x32/ece7da/8B6914?text=Z" />
                  <span className="text-sm truncate flex-1 text-ink">{p.tenSanPham}</span>
                  <span className="text-xs text-gold-dark font-semibold tabular-nums">{VND(p.gia || 0)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {open && (
        <div className="lg:hidden border-t border-beige-deep/30 px-4 py-4 space-y-1 bg-beige">
          <Link to="/" onClick={() => setOpen(false)} className="block py-2 text-ink-soft hover:text-noir transition">Trang chủ</Link>
          {categories.map((c) => (
            <Link key={c.maDanhMuc} to={`/?category=${c.slug}`} onClick={() => setOpen(false)} className="block py-2 text-ink-soft hover:text-noir transition">{c.tenDanhMuc}</Link>
          ))}
          <Link to="/gioi-thieu" onClick={() => setOpen(false)} className="block py-2 text-ink-soft hover:text-noir transition">Giới thiệu</Link>
          <hr className="my-1 border-beige-deep/40" />
          {user ? (
            <>
              <Link to="/wishlist" onClick={() => setOpen(false)} className="block py-2 text-ink-soft hover:text-noir transition">Yêu thích</Link>
              <Link to="/vouchers" onClick={() => setOpen(false)} className="block py-2 text-ink-soft hover:text-noir transition">Voucher</Link>
              <Link to="/cart" onClick={() => setOpen(false)} className="block py-2 text-ink-soft hover:text-noir transition">Giỏ hàng</Link>
              <Link to="/orders" onClick={() => setOpen(false)} className="block py-2 text-ink-soft hover:text-noir transition">Đơn hàng</Link>
              <Link to="/vi-zeststore" onClick={() => setOpen(false)} className="block py-2 text-ink-soft hover:text-noir transition">Ví ZestStore</Link>
              <Link to="/profile" onClick={() => setOpen(false)} className="block py-2 text-ink-soft hover:text-noir transition">Tài khoản</Link>
              {(user?.vaiTro === 'ADMIN' || (user?.vaiTro === 'STAFF' && user?.choPhepBanHang)) && (
                <Link to={user?.vaiTro === 'ADMIN' ? '/admin' : '/admin/pos'} onClick={() => setOpen(false)} className="block py-2 text-gold-dark font-semibold">{user?.vaiTro === 'ADMIN' ? 'Quản trị' : 'Bán hàng'}</Link>
              )}
              <button onClick={() => { requestLogout(); setOpen(false) }} className="block w-full text-left py-2 text-bordeaux">Đăng xuất</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="block py-2 text-stone hover:text-noir transition">Đăng nhập</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="block py-2 text-gold-dark font-semibold">Đăng ký</Link>
            </>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmLogout}
        title="Đăng xuất"
        message="Bạn có chắc muốn đăng xuất khỏi tài khoản này?"
        confirmText="Đăng xuất"
        variant="gold"
        onConfirm={() => { setConfirmLogout(false); handleLogout() }}
        onCancel={() => setConfirmLogout(false)}
      />
    </nav>
  )
}
