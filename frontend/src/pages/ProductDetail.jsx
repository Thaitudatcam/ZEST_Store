import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getProductBySlug, getProducts } from '../api/products'
import { addToCart } from '../api/cart'
import { getProductReviews } from '../api/reviews'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { ShoppingCart, Heart, Star, ChevronRight, ChevronLeft, ChevronDown, Truck, BadgeCheck, Filter, ArrowRight, Tag } from 'lucide-react'
import { VND } from '../components/ProductCard'
import Toast from '../components/Toast'
import CartAddedToast from '../components/CartAddedToast'
import { addWishlist, removeWishlist, checkWishlist } from '../api/wishlist'
import SafeImg from '../components/SafeImg'
import ProductCard from '../components/ProductCard'
import { imageUrl } from '../utils/imageUrl'
import DOMPurify from 'dompurify'

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
  const [toast, setToast] = useState(null)
  const [cartToast, setCartToast] = useState(null)
  const [inWish, setInWish] = useState(false)
  const [selectedColorIndex, setSelectedColorIndex] = useState(0)
  const [selectedSizeId, setSelectedSizeId] = useState(null)
  const [reviews, setReviews] = useState([])
  const [avgRating, setAvgRating] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)
  const [previewIdx, setPreviewIdx] = useState(0)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [descOpen, setDescOpen] = useState(false)

  const sanitizedDescription = useMemo(
    () => DOMPurify.sanitize(product?.moTa || ''),
    [product?.moTa]
  )

  const load = async () => {
    try {
      const p = await getProductBySlug(slug)
      const prod = p.product || p
      setProduct(prod)
      setVariants((p.variants || []).map(v => ({ ...v, tonKho: v.tonKhoKhaDung ?? v.tonKho })))
      setImages(p.images || [])
      if (prod.maSanPham && user)
        checkWishlist(prod.maSanPham).then((r) => setInWish(r.inWishlist)).catch(() => {})
      if (prod.maSanPham) {
        getProductReviews(prod.maSanPham).then((r) => {
          setReviews(r.reviews || [])
          setAvgRating(r.averageRating || 0)
          setReviewCount(r.reviewCount || 0)
        }).catch(() => {})
        const catId = prod.danhMuc?.maDanhMuc
        if (catId) {
          getProducts({ categoryId: catId, page: 0, size: 8 }).then(data => {
            const list = (data.content || data).filter(x => x.maSanPham !== prod.maSanPham).slice(0, 4)
            setRelatedProducts(list)
          }).catch(() => {})
        }
      }
    } catch { navigate('/') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    setSelectedColorIndex(0)
    setSelectedSizeId(null)
    setPreviewIdx(0)
    setQty(1)
    load()
  }, [slug])

  const handleAddCart = async () => {
    if (!user) return navigate('/login')
    const variantId = selectedVar || (variants[0]?.maBienThe)
    if (!variantId) return setToast({ message: 'Sản phẩm chưa có biến thể', type: 'error' })
    try {
      await addToCart({ maBienThe: variantId, soLuong: qty })
      setCartToast({
        product,
        variant: selectedVariant,
        qty,
        imageUrl: mainImg,
      })
      refreshCount()
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Thêm thất bại', type: 'error' })
    }
  }

  const handleBuyNow = async () => {
    if (!user) return navigate('/login')
    if (isOutOfStock) return setToast({ message: 'Sản phẩm đã hết hàng', type: 'error' })
    if (variants.length > 1 && !selectedSizeId) {
      setToast({ message: 'Vui lòng chọn kích thước', type: 'error' })
      return
    }
    try {
      const variantId = selectedVar || (variants[0]?.maBienThe)
      if (!variantId) return setToast({ message: 'Sản phẩm chưa có biến thể', type: 'error' })
      await addToCart({ maBienThe: variantId, soLuong: qty })
      refreshCount()
      const selected = [{
        maBienThe: variantId,
        soLuong: qty,
        tenSanPham: product.tenSanPham,
        donGia: discountedPrice,
        giaGoc: variantPrice,
        urlAnh: mainImg,
        maSanPham: product.maSanPham,
      }]
      navigate('/checkout', { state: { selectedItems: selected } })
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Mua thất bại', type: 'error' })
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

  const colorGroups = useMemo(() => {
    const groups = []
    const seen = new Set()
    variants.forEach((v) => {
      const id = v.mauSac?.maMauSac
      if (!id || seen.has(id)) return
      seen.add(id)
      const inColor = variants.filter((x) => x.mauSac?.maMauSac === id)
      const vIdOf = (img) => img?.maBienThe ?? img?.bienThe?.maBienThe
      const colorOfImg = (img) => variants.find((x) => x.maBienThe === vIdOf(img))?.mauSac?.maMauSac
      const fromDb = images
        .filter((img) => colorOfImg(img) === id)
        .sort((a, b) => (a.thuTuHienThi ?? 0) - (b.thuTuHienThi ?? 0))
        .map((img) => ({ url: img.urlAnh, maBienThe: vIdOf(img) }))
      const fromVariant = inColor
        .filter((x) => x.urlAnh)
        .map((x) => ({ url: x.urlAnh, maBienThe: x.maBienThe }))
      const imagesArr = [...fromDb, ...fromVariant].filter((t, i, arr) => t.url && arr.findIndex((x) => x.url === t.url) === i)
      const sizes = inColor.filter((x, i, arr) => arr.findIndex((y) => y.kichCo?.maKichCo === x.kichCo?.maKichCo) === i)
      groups.push({
        maMauSac: id,
        mauSac: v.mauSac,
        images: imagesArr,
        image: imagesArr[0]?.url || inColor[0]?.urlAnh || product?.urlAnhDaiDien,
        sizes,
        inStock: inColor.some((x) => (x.tonKho || 0) > 0),
      })
    })
    return groups
  }, [variants, images, product])

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square bg-ivory-100 rounded-2xl skeleton" />
        <div className="space-y-4">
          <div className="h-6 bg-ivory-100 rounded-lg w-1/4 skeleton" />
          <div className="h-10 bg-ivory-100 rounded-lg w-3/4 skeleton" />
          <div className="h-10 bg-ivory-100 rounded-lg w-1/3 skeleton" />
          <div className="h-12 bg-ivory-100 rounded-xl w-full mt-6 skeleton" />
        </div>
      </div>
    </div>
  )

  if (!product) return <div className="text-center py-20 text-stone">Không tìm thấy sản phẩm</div>

  const currentGroup = colorGroups[selectedColorIndex] || null
  const currentImages = currentGroup?.images ?? []

  const selectedVariant = (() => {
    if (!currentGroup) return variants[0] || null
    const byColorAndSize = variants.find((v) => v.mauSac?.maMauSac === currentGroup.maMauSac && v.kichCo?.maKichCo === selectedSizeId)
    const byColorInStock = variants.find((v) => v.mauSac?.maMauSac === currentGroup.maMauSac && (v.tonKho || 0) > 0)
    const byColor = variants.find((v) => v.mauSac?.maMauSac === currentGroup.maMauSac)
    return byColorAndSize || byColorInStock || byColor || variants[0] || null
  })()

  const selectedVar = selectedVariant?.maBienThe ?? null
  const mainImg = imageUrl(currentImages[previewIdx]?.url) || imageUrl(product.urlAnhDaiDien) || 'https://placehold.co/600x600/e2e8f0/475569?text=Polo'
  const variantPrice = selectedVariant?.gia || (product.giaThapNhat ?? variants[0]?.gia ?? 0)
  const variantDiscount = Number(selectedVariant?.phanTramGiamGia || product?.phanTramGiamGia || 0)
  const discountedPrice = variantDiscount > 0
    ? Math.max(0, Math.round(Number(variantPrice) * (1 - variantDiscount / 100)))
    : Number(variantPrice)
  const selectedStock = selectedVariant?.tonKho ?? 0
  const totalStock = variants.reduce((sum, v) => sum + (v.tonKho || 0), 0)
  const isOutOfStock = totalStock === 0

  const applyColor = (idx) => {
    const group = colorGroups[idx]
    if (!group) return
    setSelectedColorIndex(idx)
    if (selectedSizeId) {
      const sizeStillValid = group.sizes.some((s) => s.kichCo?.maKichCo === selectedSizeId)
      if (!sizeStillValid) {
        const first = group.sizes.find((s) => (s.tonKho || 0) > 0) || group.sizes[0]
        setSelectedSizeId(first?.kichCo?.maKichCo ?? null)
      }
    }
    setPreviewIdx(0)
  }

  const handleSizeSelect = (maKichCo) => {
    setSelectedSizeId(maKichCo)
    const vv = variants.find((v) => v.mauSac?.maMauSac === currentGroup?.maMauSac && v.kichCo?.maKichCo === maKichCo)
    if (vv) {
      const imgIdx = currentImages.findIndex((t) => t.maBienThe === vv.maBienThe)
      if (imgIdx >= 0) setPreviewIdx(imgIdx)
    }
  }

  const allThumbnails = colorGroups.flatMap((group, gi) => {
    const imgs = group.images.length > 0 ? group.images : (group.image ? [{ url: group.image }] : [])
    return imgs.map((img, ii) => ({ ...img, colorIndex: gi, imageIndex: ii, colorHex: group.mauSac?.maMauHex }))
  })

  return (
    <div className="min-h-screen bg-white">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {cartToast && <CartAddedToast {...cartToast} onClose={() => setCartToast(null)} />}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <nav className="flex items-center gap-1.5 text-sm text-stone mb-5">
          <Link to="/" className="hover:text-[var(--primary-color)] transition-colors">Trang chủ</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/products" className="hover:text-[var(--primary-color)] transition-colors">Sản phẩm</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-ink font-semibold truncate max-w-[200px]">{product.tenSanPham}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* LEFT: Images */}
          <div className="flex gap-3">
            {allThumbnails.length > 1 && (
              <div className="hidden sm:flex flex-col gap-2 w-16 shrink-0">
                {allThumbnails.map((item, index) => {
                  const active = item.colorIndex === selectedColorIndex && item.imageIndex === previewIdx
                  return (
                    <button key={index} type="button"
                      onClick={() => { applyColor(item.colorIndex); setPreviewIdx(item.imageIndex) }}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                        active ? 'border-[var(--primary-color)]' : 'border-gray-200 hover:border-[var(--primary-color)]/50'
                      }`}>
                      <SafeImg src={imageUrl(item.url)} alt="" className="w-full h-full object-cover" />
                      {item.colorHex && <span className="absolute right-1 bottom-1 w-3 h-3 rounded-full border-2 border-white shadow" style={{ backgroundColor: item.colorHex }} />}
                    </button>
                  )
                })}
              </div>
            )}

            <div className="flex-1 relative bg-gray-50 rounded-2xl overflow-hidden">
              <SafeImg src={mainImg} alt={product.tenSanPham} className="w-full aspect-square object-cover" />
              {variantDiscount > 0 && (
                <span className="absolute top-3 right-3 bg-[var(--primary-color)] text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                  -{variantDiscount}%
                </span>
              )}
            </div>
          </div>

          {/* RIGHT: Info */}
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-ink mb-4">{product.tenSanPham}</h1>

            {/* Price */}
            <div className="flex items-center gap-3 mb-5">
              {variantDiscount > 0 ? (
                <>
                  <span className="text-2xl font-bold text-[var(--primary-color)]">{VND(discountedPrice)}</span>
                  <span className="text-base text-stone line-through">{VND(variantPrice)}</span>
                </>
              ) : (
                <span className="text-2xl font-bold text-[var(--primary-color)]">{VND(variantPrice)}</span>
              )}
            </div>

            {/* Colors */}
            {colorGroups.length > 0 && (
              <div className="mb-5">
                <p className="text-sm font-semibold text-ink mb-2.5">
                  MÀU SẮC: <span className="font-normal text-stone">{currentGroup?.mauSac?.mauSac || ''}</span>
                </p>
                <div className="flex gap-2">
                  {colorGroups.map((group, idx) => {
                    const selected = idx === selectedColorIndex
                    const hasStock = group.inStock
                    return (
                      <button key={group.maMauSac} onClick={() => applyColor(idx)}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                          selected ? 'border-[var(--primary-color)] ring-2 ring-[var(--primary-color)]/30 scale-110' : 'border-gray-200 hover:border-gray-400'
                        } ${!hasStock ? 'opacity-40' : ''}`}
                        title={group.mauSac?.mauSac}>
                        {group.mauSac?.maMauHex && (
                          <span className="block w-full h-full rounded-full" style={{ backgroundColor: group.mauSac.maMauHex }} />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Sizes */}
            {currentGroup && currentGroup.sizes.length > 0 && (
              <div className="mb-5">
                <p className="text-sm font-semibold text-ink mb-2.5">KÍCH THƯỚC</p>
                <div className="flex gap-2 flex-wrap">
                  {currentGroup.sizes.map((v) => {
                    const disabled = (v.tonKho || 0) === 0
                    const selected = selectedSizeId === v.kichCo?.maKichCo
                    return (
                      <button key={v.maBienThe} onClick={() => handleSizeSelect(v.kichCo?.maKichCo)} disabled={disabled}
                        className={`px-5 py-2 rounded-lg text-sm font-medium border transition-all ${
                          selected
                            ? 'bg-[var(--primary-color)] text-white border-[var(--primary-color)]'
                            : disabled
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                              : 'bg-white text-ink border-gray-300 hover:border-[var(--primary-color)]'
                        }`}>
                        Size {v.kichCo?.kichCo}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-ink mb-2.5">CHỌN SỐ LƯỢNG</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1}
                    className="px-3.5 py-2 text-ink hover:bg-gray-100 transition font-medium text-lg disabled:opacity-30 disabled:cursor-not-allowed">−</button>
                  <input type="number" value={qty} min={1} max={selectedStock || 1}
                    onChange={e => { const v = parseInt(e.target.value) || 1; setQty(Math.max(1, Math.min(selectedStock || 1, v))) }}
                    onBlur={e => { if (!e.target.value || parseInt(e.target.value) < 1) setQty(1) }}
                    className="w-14 px-1 py-2 border-x border-gray-300 text-center font-semibold text-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  <button onClick={() => setQty(Math.min(selectedStock || 99, qty + 1))} disabled={qty >= (selectedStock || 99)}
                    className="px-3.5 py-2 text-ink hover:bg-gray-100 transition font-medium text-lg disabled:opacity-30 disabled:cursor-not-allowed">+</button>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mb-6">
              <button onClick={handleAddCart} disabled={isOutOfStock}
                className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border-2 ${
                  isOutOfStock
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'border-[var(--primary-color)] text-[var(--primary-color)] hover:bg-[var(--primary-color)]/5'
                }`}>
                <ShoppingCart className="h-5 w-5" /> THÊM GIỎ HÀNG
              </button>
              <button onClick={handleBuyNow} disabled={isOutOfStock}
                className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  isOutOfStock
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-[var(--primary-color)] text-white hover:opacity-90'
                }`}>
                MUA NGAY
              </button>
            </div>

            {/* Wishlist */}
            <button onClick={toggleWish}
              className={`self-start text-sm font-medium flex items-center gap-1.5 transition ${
                inWish ? 'text-red-500' : 'text-stone hover:text-[var(--primary-color)]'
              }`}>
              <Heart className={`h-4 w-4 ${inWish ? 'fill-red-500' : ''}`} />
              {inWish ? 'Đã yêu thích' : 'Thêm vào yêu thích'}
            </button>
          </div>
        </div>

        {/* Description */}
        {product.moTa && (
          <div className="mt-10 border-t border-gray-200 pt-8">
            <button onClick={() => setDescOpen(!descOpen)}
              className="flex items-center gap-2 text-lg font-bold text-ink mb-4 cursor-pointer">
              <span className="w-1 h-5 bg-[var(--primary-color)] rounded-full inline-block" />
              MÔ TẢ SẢN PHẨM
              <ChevronDown className={`h-5 w-5 ml-auto transition-transform ${descOpen ? 'rotate-180' : ''}`} />
            </button>
            {descOpen && (
              <div className="text-sm text-stone leading-relaxed [&_p]:mb-3 [&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-xl [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5"
                dangerouslySetInnerHTML={{ __html: sanitizedDescription }} />
            )}
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-10 border-t border-gray-200 pt-8">
            <h2 className="text-lg font-bold text-ink mb-5">Sản phẩm liên quan</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map(p => (
                <ProductCard key={p.maSanPham} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
