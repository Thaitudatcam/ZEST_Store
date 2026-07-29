import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Heart, User, Menu, X, Store, ChevronDown, Search, Loader, Ticket, Coins } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useVoucher } from '../context/VoucherContext'
import { useState, useRef, useEffect } from 'react'
import { searchSuggestions } from '../api/products'
import { getSoDuDiem } from '../api/vi'
import { useToast } from '../context/ToastContext'
import SafeImg from './SafeImg'

const VND = (n) => { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }

export default function Navbar() {
  const { user, logout } = useAuth()
  const { count } = useCart()
  const { wishlistCount } = useWishlist()
  const { voucherCount } = useVoucher()
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
  const [diemHienCo, setDiemHienCo] = useState(null)

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

  useEffect(() => {
    if (user) {
      getSoDuDiem().then(d => setDiemHienCo(d.soDiem ?? null)).catch(() => setDiemHienCo(null))
    } else {
      setDiemHienCo(null)
    }
  }, [user])

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <nav className="bg-ivory/90 backdrop-blur-md border-b border-gold/15 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link to="/" className="flex items-center gap-2.5 font-serif font-bold text-xl text-noir shrink-0 group">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-noir text-gold group-hover:bg-noir-800 transition-colors">
              <Store className="h-4 w-4" />
            </span>
            <span>Zest<span className="text-gold">Store</span></span>
          </Link>

          <div className="hidden md:flex flex-1 max-w-md relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
                  placeholder="Tìm sản phẩm..."
                  className="w-full pl-9 pr-10 py-2 border border-noir-600/15 rounded-full text-sm bg-white/70 text-ink placeholder-stone focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold focus:bg-white transition"
                />
                {searchLoading && <Loader className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gold animate-spin" />}
              </div>
            </form>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gold/20 rounded-xl shadow-lux z-50 py-2 max-h-80 overflow-y-auto">
                {suggestions.map((p) => (
                  <Link key={p.maSanPham} to={`/products/${p.slug}`}
                    onClick={() => { setShowSuggestions(false); setSearchQuery('') }}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gold-50 transition">
                    <SafeImg src={p.urlAnhDaiDien} className="w-10 h-10 rounded-lg object-cover bg-ivory-100 shrink-0" fallback="https://placehold.co/40x40/ece7da/8B6914?text=Z" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{p.tenSanPham}</p>
                      <p className="text-xs text-gold-dark font-semibold tabular-nums">{VND(p.gia || 0)}</p>
                    </div>
                    {p.tongTonKho === 0 && <span className="text-[10px] text-bordeaux font-semibold shrink-0">Hết hàng</span>}
                  </Link>
                ))}
                <div className="border-t border-gold/15 mt-1 pt-1">
                  <button onClick={handleSearchSubmit}
                    className="w-full text-left px-4 py-2 text-sm text-gold-dark font-medium hover:bg-gold-50 transition">
                    Xem tất cả kết quả "{searchQuery}"
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/products" className="text-ink-soft hover:text-gold-dark transition text-sm font-medium relative after:absolute after:-bottom-1 after:left-0 after:w-0 hover:after:w-full after:h-px after:bg-gold after:transition-all">Sản phẩm</Link>
            {user ? (
              <>
              <Link to="/wishlist" className="relative text-ink-soft hover:text-gold-dark transition">
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-bordeaux text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none animate-scale-in">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </Link>
              <Link to="/vouchers" className="relative text-ink-soft hover:text-gold-dark transition">
                <Ticket className="h-5 w-5" />
                {voucherCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gold text-noir text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none animate-scale-in">
                    {voucherCount > 99 ? '99+' : voucherCount}
                  </span>
                )}
              </Link>
                <Link to="/cart" className="relative text-ink-soft hover:text-gold-dark transition">
                  <ShoppingCart className="h-5 w-5" />
                  {count > 0 && (
                    <span className="absolute -top-2 -right-2 bg-bordeaux text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none animate-scale-in">
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </Link>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-1.5 text-ink-soft hover:text-gold-dark transition text-sm"
                  >
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-noir text-gold text-xs font-bold">
                      {user.hoTen?.charAt(0).toUpperCase()}
                    </span>
                    {user.hoTen?.split(' ').pop()}
                    <ChevronDown className={`h-4 w-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lux border border-gold/15 py-2 z-50">
                      <Link to="/profile" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-ink-soft hover:bg-gold-50 hover:text-gold-dark transition">Tài khoản</Link>
                      <Link to="/orders" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-ink-soft hover:bg-gold-50 hover:text-gold-dark transition">Đơn hàng</Link>
                      <Link to="/vi-zeststore" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-ink-soft hover:bg-gold-50 hover:text-gold-dark transition">Ví ZestStore</Link>
                      <Link to="/tich-diem" onClick={() => setDropdownOpen(false)} className="flex items-center justify-between px-4 py-2 text-sm text-ink-soft hover:bg-gold-50 hover:text-gold-dark transition">
                        <span className="flex items-center gap-2"><Coins className="h-4 w-4 text-gold-dark" /> Điểm tích lũy</span>
                        {diemHienCo !== null && <span className="text-xs font-semibold text-gold-dark tabular-nums">{diemHienCo.toLocaleString()}</span>}
                      </Link>
                      <Link to="/profile?tab=password" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-ink-soft hover:bg-gold-50 hover:text-gold-dark transition">Đổi mật khẩu</Link>
                      <hr className="my-1 border-gold/15" />
                      {(user?.vaiTro === 'ADMIN' || (user?.vaiTro === 'STAFF' && user?.choPhepBanHang)) && (
                        <Link to={user?.vaiTro === 'ADMIN' ? '/admin' : '/admin/pos'} onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gold-dark font-semibold hover:bg-gold-50 transition">{user?.vaiTro === 'ADMIN' ? 'Quản trị' : 'Bán hàng'}</Link>
                      )}
                      <button onClick={() => { handleLogout(); setDropdownOpen(false) }} className="w-full text-left block px-4 py-2 text-sm text-bordeaux hover:bg-bordeaux/5 transition">Đăng xuất</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-stone hover:text-gold-dark transition text-sm font-medium">Đăng nhập</Link>
                <Link to="/register" className="bg-noir text-gold px-5 py-2 rounded-full text-sm font-semibold hover:bg-noir-800 transition shadow-lux">Đăng ký</Link>
              </div>
            )}
          </div>

          <div className="flex md:hidden items-center gap-2">
            <button onClick={() => setSearchOpen(!searchOpen)} className="text-ink-soft">
              <Search className="h-5 w-5" />
            </button>
            <Link to="/cart" className="relative text-ink-soft">
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && <span className="absolute -top-2 -right-2 bg-bordeaux text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{count}</span>}
            </Link>
            <button onClick={() => setOpen(!open)} className="text-ink-soft">
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="md:hidden border-t border-gold/15 px-4 py-3 bg-white">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm sản phẩm..." autoFocus
                className="w-full pl-9 pr-4 py-2 border border-noir-600/15 rounded-full text-sm bg-ivory text-ink placeholder-stone focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold" />
            </div>
          </form>
          {showSuggestions && suggestions.length > 0 && (
            <div className="mt-2 border border-gold/15 rounded-xl bg-white shadow-lux max-h-60 overflow-y-auto">
              {suggestions.map((p) => (
                <Link key={p.maSanPham} to={`/products/${p.slug}`}
                  onClick={() => { setShowSuggestions(false); setSearchQuery(''); setSearchOpen(false) }}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gold-50">
                  <SafeImg src={p.urlAnhDaiDien} className="w-8 h-8 rounded object-cover bg-ivory-100 shrink-0" fallback="https://placehold.co/32x32/ece7da/8B6914?text=Z" />
                  <span className="text-sm truncate flex-1 text-ink">{p.tenSanPham}</span>
                  <span className="text-xs text-gold-dark font-semibold tabular-nums">{VND(p.gia || 0)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {open && (
        <div className="md:hidden border-t border-gold/15 px-4 py-4 space-y-1 bg-white">
          <Link to="/products" onClick={() => setOpen(false)} className="block py-2 text-ink-soft hover:text-gold-dark transition">Sản phẩm</Link>
          {user ? (
            <>
              <Link to="/wishlist" onClick={() => setOpen(false)} className="block py-2 text-ink-soft hover:text-gold-dark transition">Yêu thích</Link>
              <Link to="/vouchers" onClick={() => setOpen(false)} className="block py-2 text-ink-soft hover:text-gold-dark transition">Voucher</Link>
              <Link to="/cart" onClick={() => setOpen(false)} className="block py-2 text-ink-soft hover:text-gold-dark transition">Giỏ hàng</Link>
              <Link to="/orders" onClick={() => setOpen(false)} className="block py-2 text-ink-soft hover:text-gold-dark transition">Đơn hàng</Link>
              <Link to="/vi-zeststore" onClick={() => setOpen(false)} className="block py-2 text-ink-soft hover:text-gold-dark transition">Ví ZestStore</Link>
              <Link to="/tich-diem" onClick={() => setOpen(false)} className="flex items-center justify-between py-2 text-ink-soft hover:text-gold-dark transition">
                <span className="flex items-center gap-2"><Coins className="h-4 w-4 text-gold-dark" /> Điểm tích lũy</span>
                {diemHienCo !== null && <span className="text-xs font-semibold text-gold-dark tabular-nums">{diemHienCo.toLocaleString()}</span>}
              </Link>
              <Link to="/profile" onClick={() => setOpen(false)} className="block py-2 text-ink-soft hover:text-gold-dark transition">Tài khoản</Link>
              <Link to="/profile?tab=password" onClick={() => setOpen(false)} className="block py-2 text-ink-soft hover:text-gold-dark transition">Đổi mật khẩu</Link>
              {(user?.vaiTro === 'ADMIN' || (user?.vaiTro === 'STAFF' && user?.choPhepBanHang)) && (
                <Link to={user?.vaiTro === 'ADMIN' ? '/admin' : '/admin/pos'} onClick={() => setOpen(false)} className="block py-2 text-gold-dark font-semibold">{user?.vaiTro === 'ADMIN' ? 'Quản trị' : 'Bán hàng'}</Link>
              )}
              <button onClick={() => { handleLogout(); setOpen(false) }} className="block w-full text-left py-2 text-bordeaux">Đăng xuất</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="block py-2 text-stone hover:text-gold-dark transition">Đăng nhập</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="block py-2 text-gold-dark font-semibold">Đăng ký</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
