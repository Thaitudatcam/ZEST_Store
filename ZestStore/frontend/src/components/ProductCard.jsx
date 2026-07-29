import { Link } from 'react-router-dom'
import { Heart, Star } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { addWishlist, removeWishlist } from '../api/wishlist'
import { useState } from 'react'
import SafeImg from './SafeImg'
import ShinyText from './ui/ShinyText'

const VND = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

export default function ProductCard({ product, showRating = true }) {
  const { user } = useAuth()
  const [wished, setWished] = useState(false)
  const price = product.giaThapNhat ?? product.giaTrungBinh ?? (product.bienThes?.[0]?.gia ?? 0)
  const slug = product.slug || product.maSanPham
  const discount = product.phanTramGiamGia
  const colors = product.mauSacs ?? []
  const totalStock = product.tongTonKho ?? 0
  const isOutOfStock = totalStock === 0
  const rating = product.averageRating || 0
  const reviewCount = product.reviewCount || 0

  const toggleWish = async (e) => {
    e.preventDefault()
    if (!user) return
    try {
      if (wished) { await removeWishlist(product.maSanPham); setWished(false) }
      else { await addWishlist(product.maSanPham); setWished(true) }
    } catch {}
  }

  return (
    <Link to={`/products/${slug}`} className="group bg-white rounded-2xl shadow-lux overflow-hidden hover:-translate-y-1 hover:shadow-gold transition-all duration-300 relative border border-noir-600/5">
      <div className="aspect-square bg-ivory-100 overflow-hidden relative">
        <SafeImg src={product.urlAnhDaiDien} alt={product.tenSanPham} className={`w-full h-full object-cover object-center group-hover:scale-105 transition duration-500 ${isOutOfStock ? 'opacity-50 grayscale' : ''}`} />
        {user && (
          <button onClick={toggleWish} className="absolute top-2.5 right-2.5 p-1.5 bg-white/85 backdrop-blur-sm rounded-full hover:bg-white transition z-10 shadow-sm" disabled={isOutOfStock} aria-label="Yêu thích">
            <Heart className={`h-4 w-4 transition-colors ${wished ? 'fill-bordeaux text-bordeaux' : 'text-ink-soft'}`} />
          </button>
        )}
        {discount && !isOutOfStock && (
          <span className="absolute bottom-2.5 left-2.5 bg-bordeaux rounded-full px-2.5 py-1">
            <ShinyText text={`-${discount}%`} className="text-[10px] font-bold leading-none" color="#fff" shineColor="#f4cccc" speed={1.5} spread={80} />
          </span>
        )}
        {isOutOfStock && (
          <span className="absolute inset-0 flex items-center justify-center bg-noir/55 text-ivory font-serif font-bold text-lg z-10 tracking-wide">
            Hết hàng
          </span>
        )}
      </div>

      <div className="p-3.5">
        <h3 className="font-semibold text-sm text-ink truncate">{product.tenSanPham}</h3>
        {colors.length > 0 && (
          <div className="flex gap-1 mt-1.5">
            {colors.map((c, i) => (
              <span key={i} className="inline-block w-3.5 h-3.5 rounded-full border border-noir-600/15" style={{ backgroundColor: c.maMauHex || '#ccc' }} title={c.mauSac} />
            ))}
          </div>
        )}
        {showRating && rating > 0 && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`h-3 w-3 ${i <= Math.round(rating) ? 'fill-gold text-gold' : 'text-stone-light/40'}`} />
              ))}
            </div>
            <span className="text-[11px] text-stone">({reviewCount})</span>
          </div>
        )}
        <div className="flex items-center gap-2 mt-2">
          {discount ? (
            <>
              <p className="text-gold-dark font-bold text-sm tabular-nums">{VND(price * (1 - discount / 100))}</p>
              <p className="text-stone-light text-xs line-through tabular-nums">{VND(price)}</p>
            </>
          ) : (
            <p className="text-gold-dark font-bold text-sm tabular-nums">{VND(price)}</p>
          )}
        </div>
      </div>
    </Link>
  )
}

export { VND }
