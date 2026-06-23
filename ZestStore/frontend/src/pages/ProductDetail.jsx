import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getProductBySlug } from '../api/products'
import { addToCart } from '../api/cart'
import { getProductReviews } from '../api/reviews'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { ShoppingCart, Heart, Star, MessageSquare, ChevronRight } from 'lucide-react'
import { VND } from '../components/ProductCard'
import Toast from '../components/Toast'
import VariantModal from '../components/VariantModal'
import { addWishlist, removeWishlist, checkWishlist } from '../api/wishlist'
import SafeImg from '../components/SafeImg'
import { imageUrl } from '../utils/imageUrl'

export default function ProductDetail() {
  const { slug } = useParams()
  const { user } = useAuth()
  const { refreshCount } = useCart()
  const { refreshWishlistCount } = useWishlist()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [variants, setVariants] = useState([])
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [msg, setMsg] = useState('')
  const [toast, setToast] = useState(null)
  const [inWish, setInWish] = useState(false)
  const [selectedVar, setSelectedVar] = useState(null)
  const [reviews, setReviews] = useState([])
  const [avgRating, setAvgRating] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)
  const [previewIdx, setPreviewIdx] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)

  const load = async () => {
    try {
      const p = await getProductBySlug(slug)
      const prod = p.product || p
      setProduct(prod)
      setVariants(p.variants || [])
      setImages(p.images || [])
      if (prod.maSanPham && user)
        checkWishlist(prod.maSanPham).then((r) => setInWish(r.inWishlist)).catch(() => {})
      if (prod.maSanPham) {
        getProductReviews(prod.maSanPham).then((r) => {
          setReviews(r.reviews || [])
          setAvgRating(r.averageRating || 0)
          setReviewCount(r.reviewCount || 0)
        }).catch(() => {})
      }
    } catch { navigate('/products') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [slug])

  const handleAddCart = async (vid, sl) => {
    if (!user) return navigate('/login')
    const variantId = vid || selectedVar || (variants[0]?.maBienThe)
    if (!variantId) return setToast({ message: 'Sản phẩm chưa có biến thể', type: 'error' })
    try {
      await addToCart({ maBienThe: variantId, soLuong: sl || qty })
      setToast({ message: 'Đã thêm vào giỏ hàng!', type: 'success' })
      refreshCount()
      setModalOpen(false)
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Thêm thất bại', type: 'error' })
    }
  }

  const toggleWish = async () => {
    if (!user) return navigate('/login')
    try {
      if (inWish) { await removeWishlist(product.maSanPham); setInWish(false) }
      else { await addWishlist(product.maSanPham); setInWish(true) }
      refreshWishlistCount()
    } catch {}
  }

  const handleAddClick = () => {
    if (!user) return navigate('/login')
    if (variants.length > 1 && !selectedVar) return setModalOpen(true)
    handleAddCart()
  }

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8 animate-pulse">
        <div className="aspect-square bg-gray-200 rounded-xl" />
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-10 bg-gray-200 rounded w-1/2 mt-6" />
          <div className="h-12 bg-gray-200 rounded w-full mt-4" />
        </div>
      </div>
    </div>
  )

  if (!product) return <div className="text-center py-20 text-gray-500">Không tìm thấy sản phẩm</div>

  const allImages = images.map(i => i.urlAnh).filter(Boolean)
  const mainImg = imageUrl(allImages[previewIdx]) || imageUrl(product.urlAnhDaiDien) || 'https://placehold.co/600x600/e2e8f0/475569?text=Polo'
  const variantPrice = selectedVar ? (variants.find(v => v.maBienThe === selectedVar)?.gia || product.giaTrungBinh || 0) : (product.giaTrungBinh ?? variants[0]?.gia ?? 0)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-blue-700">Trang chủ</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/products" className="hover:text-blue-700">Sản phẩm</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-800 font-semibold truncate max-w-[200px]">{product.tenSanPham}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3">
            <SafeImg src={mainImg} alt={product.tenSanPham} className="w-full h-full object-cover object-center" />
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allImages.map((url, idx) => (
                <button key={idx} onClick={() => setPreviewIdx(idx)}
                  className={`w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 ${idx === previewIdx ? 'border-blue-700' : 'border-transparent'}`}>
                  <SafeImg src={url} alt="" className="w-full h-full object-cover object-center" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2">{product.tenSanPham}</h1>
          <p className="text-3xl text-blue-700 font-bold mb-4">{VND(variantPrice)}</p>
          {product.moTa && <p className="text-gray-600 mb-4">{product.moTa}</p>}

          {variants.length > 0 && (
            <div className="mb-4">
              <label className="font-semibold text-sm">Phân loại:</label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {variants.map((v) => (
                  <button key={v.maBienThe} onClick={() => setSelectedVar(v.maBienThe)}
                    className={`px-4 py-1.5 border rounded-lg text-sm ${selectedVar === v.maBienThe ? 'bg-blue-700 text-white border-blue-700' : 'hover:bg-gray-100'}`}>
                    {[v.kichCo?.kichCo, v.mauSac?.mauSac].filter(Boolean).join(' - ') || `#${v.maBienThe}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 mb-4">
            <div className="flex border rounded-lg">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 hover:bg-gray-100">-</button>
              <span className="px-4 py-2 border-x min-w-[3rem] text-center">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="px-3 py-2 hover:bg-gray-100">+</button>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleAddClick} className="flex-1 bg-blue-700 text-white font-semibold py-3 rounded-lg hover:bg-blue-800 transition flex items-center justify-center gap-2">
              <ShoppingCart className="h-5 w-5" /> Thêm vào giỏ
            </button>
            <button onClick={toggleWish} className={`p-3 border rounded-lg ${inWish ? 'text-red-500 border-red-300' : 'hover:bg-gray-100'}`}>
              <Heart className={`h-5 w-5 ${inWish ? 'fill-red-500' : ''}`} />
            </button>
          </div>

          {msg && <p className="mt-3 text-sm text-green-600 font-semibold">{msg}</p>}
        </div>
      </div>

      {reviewCount > 0 && (
        <div className="mt-12 max-w-3xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-700" />
            Đánh giá ({reviewCount})
            <span className="text-sm font-normal text-gray-500 ml-2 flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {avgRating.toFixed(1)}
            </span>
          </h2>
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.maDanhGia} className="bg-white border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                      {r.nguoiDung?.hoTen?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{r.nguoiDung?.hoTen || 'Khách hàng'}</p>
                      <p className="text-xs text-gray-400">{r.ngayTao ? new Date(r.ngayTao).toLocaleDateString('vi-VN') : ''}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < r.soSao ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                    ))}
                  </div>
                </div>
                {r.binhLuan && <p className="text-sm text-gray-600">{r.binhLuan}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {modalOpen && (
        <VariantModal
          variants={variants}
          images={images}
          onConfirm={(vid, sl) => handleAddCart(vid, sl)}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
