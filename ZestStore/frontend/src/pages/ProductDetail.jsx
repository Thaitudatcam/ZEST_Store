import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProductBySlug } from '../api/products'
import { addToCart } from '../api/cart'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { ShoppingCart, Heart } from 'lucide-react'
import { VND } from '../components/ProductCard'
import { addWishlist, removeWishlist, checkWishlist } from '../api/wishlist'

export default function ProductDetail() {
  const { slug } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [variants, setVariants] = useState([])
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [msg, setMsg] = useState('')
  const [inWish, setInWish] = useState(false)
  const [selectedVar, setSelectedVar] = useState(null)

  const load = async () => {
    try {
      const p = await getProductBySlug(slug)
      setProduct(p.product || p)
      setVariants(p.variants || [])
      setImages(p.images || [])
      if (p.product?.maSanPham && user)
        checkWishlist(p.product.maSanPham).then((r) => setInWish(r.inWishlist)).catch(() => {})
    } catch { navigate('/products') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [slug])

  const handleAddCart = async () => {
    if (!user) return navigate('/login')
    const variantId = selectedVar || (variants[0]?.maBienThe)
    if (!variantId) return setMsg('Sản phẩm chưa có biến thể')
    try {
      await addToCart({ maBienThe: variantId, soLuong: qty })
      setMsg('Đã thêm vào giỏ hàng!')
    } catch { setMsg('Thêm thất bại') }
  }

  const toggleWish = async () => {
    if (!user) return navigate('/login')
    try {
      if (inWish) { await removeWishlist(product.maSanPham); setInWish(false) }
      else { await addWishlist(product.maSanPham); setInWish(true) }
    } catch {}
  }

  if (loading) return <LoadingSpinner className="py-20" />
  if (!product) return <div className="text-center py-20 text-gray-500">Không tìm thấy sản phẩm</div>

  const price = product.gia ?? 0
  const img = images[0]?.urlAnh || product.anhChinh || 'https://placehold.co/600x600/e2e8f0/475569?text=Polo'

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
          <img src={img} alt={product.tenSanPham} className="w-full h-full object-cover object-center" />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">{product.tenSanPham}</h1>
          <p className="text-3xl text-blue-700 font-bold mb-4">{VND(price)}</p>
          {product.moTa && <p className="text-gray-600 mb-4">{product.moTa}</p>}

          {variants.length > 0 && (
            <div className="mb-4">
              <label className="font-semibold text-sm">Phân loại:</label>
              <div className="flex gap-2 mt-1">
                {variants.map((v) => (
                  <button key={v.maBienThe} onClick={() => setSelectedVar(v.maBienThe)}
                    className={`px-4 py-1.5 border rounded-lg text-sm ${selectedVar === v.maBienThe ? 'bg-blue-700 text-white border-blue-700' : 'hover:bg-gray-100'}`}>
                    {[v.kichCo, v.mauSac].filter(Boolean).join(' - ') || `#${v.maBienThe}`}
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
            <button onClick={handleAddCart} className="flex-1 bg-blue-700 text-white font-semibold py-3 rounded-lg hover:bg-blue-800 transition flex items-center justify-center gap-2">
              <ShoppingCart className="h-5 w-5" /> Thêm vào giỏ
            </button>
            <button onClick={toggleWish} className={`p-3 border rounded-lg ${inWish ? 'text-red-500 border-red-300' : 'hover:bg-gray-100'}`}>
              <Heart className={`h-5 w-5 ${inWish ? 'fill-red-500' : ''}`} />
            </button>
          </div>

          {msg && <p className="mt-3 text-sm text-green-600 font-semibold">{msg}</p>}
        </div>
      </div>
    </div>
  )
}
