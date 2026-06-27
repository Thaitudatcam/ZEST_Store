import { Link } from 'react-router-dom'
import { Heart, Star } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { addWishlist, removeWishlist } from '../api/wishlist'
import { useState } from 'react'
import SafeImg from './SafeImg'

const VND = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

export default function ProductCard({ product }) {
  const { user } = useAuth()
  const [wished, setWished] = useState(false)
  const price = product.giaThapNhat ?? product.giaTrungBinh ?? (product.bienThes?.[0]?.gia ?? 0)
  const slug = product.slug || product.maSanPham
  const avgRating = product.averageRating
  const reviewCount = product.reviewCount ?? 0
  const discount = product.phanTramGiamGia
  const colors = product.mauSacs ?? []
  const isNew = product.ngayTao && Date.now() - new Date(product.ngayTao).getTime() < 7 * 86400000
  const totalStock = product.tongTonKho ?? 0
  const isOutOfStock = totalStock === 0

  const toggleWish = async (e) => {
    e.preventDefault()
    if (!user) return
    try {
      if (wished) { await removeWishlist(product.maSanPham); setWished(false) }
      else { await addWishlist(product.maSanPham); setWished(true) }
    } catch {}
  }

  return (
    <Link to={`/products/${slug}`} className="group bg-white rounded-xl shadow-sm  overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative">
      <div className="aspect-square bg-gray-100 overflow-hidden relative">
                    <SafeImg src={product.urlAnhDaiDien} alt={product.tenSanPham} className={`w-full h-full object-cover object-center group-hover:scale-105 transition duration-500 ${isOutOfStock ? 'opacity-50 grayscale' : ''}`} />
        {user && (
          <button onClick={toggleWish} className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full hover:bg-white transition z-10" disabled={isOutOfStock}>
            <Heart className={`h-4 w-4 ${wished ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </button>
        )}
        {isNew && !isOutOfStock && <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">MỚI</span>}
        {discount && !isOutOfStock && <span className="absolute bottom-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">-{discount}%</span>}
        {isOutOfStock && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white font-bold text-lg z-10">
            Hết hàng
          </span>
        )}
      </div>
      <div className="p-3">
        {avgRating && (
          <div className="flex items-center gap-1 mb-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-3 w-3 ${i < Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
            ))}
            <span className="text-[10px] text-gray-400 ml-1">({reviewCount})</span>
          </div>
        )}
        <h3 className="font-semibold text-sm text-gray-800 truncate">{product.tenSanPham}</h3>
        {colors.length > 0 && (
          <div className="flex gap-1 mt-1.5">
            {colors.map((c, i) => (
              <span key={i} className="inline-block w-3.5 h-3.5 rounded-full border border-gray-300" style={{ backgroundColor: c.maMauHex || '#ccc' }} title={c.mauSac} />
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          {discount ? (
            <>
              <p className="text-blue-700 font-bold text-sm">{VND(price * (1 - discount / 100))}</p>
              <p className="text-gray-400 text-xs line-through">{VND(price)}</p>
            </>
          ) : (
            <p className="text-blue-700 font-bold text-sm">{VND(price)}</p>
          )}
        </div>
      </div>
    </Link>
  )
}

export { VND }
