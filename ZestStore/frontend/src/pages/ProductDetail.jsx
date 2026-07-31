import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getProductBySlug, getProducts } from '../api/products'
import { addToCart } from '../api/cart'
import { getProductReviews } from '../api/reviews'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { ShoppingCart, Heart, Star, MessageSquare, ChevronRight, Zap, ChevronDown, ThumbsUp, BadgeCheck, Filter, ArrowUpDown, ChevronLeft } from 'lucide-react'
import TiltedCard from '../components/ui/TiltedCard'
import { VND } from '../components/ProductCard'
import Toast from '../components/Toast'
import VariantModal from '../components/VariantModal'
import { addWishlist, removeWishlist, checkWishlist } from '../api/wishlist'
import SafeImg from '../components/SafeImg'
import ProductCard from '../components/ProductCard'
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
  const [reviewSort, setReviewSort] = useState('newest')
  const [reviewPage, setReviewPage] = useState(0)
  const [previewIdx, setPreviewIdx] = useState(0)
  const [colorIdx, setColorIdx] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [buyNowMode, setBuyNowMode] = useState(false)
  const [relatedProducts, setRelatedProducts] = useState([])
  const variantRef = useRef(null)
  const [highlightVariant, setHighlightVariant] = useState(false)

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
        const catId = prod.danhMuc?.maDanhMuc
        if (catId) {
          getProducts({ categoryId: catId, page: 0, size: 8 }).then(data => {
            const list = (data.content || data).filter(x => x.maSanPham !== prod.maSanPham).slice(0, 4)
            setRelatedProducts(list)
          }).catch(() => {})
        }
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

  const scrollToVariants = () => {
    variantRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setHighlightVariant(true)
    setTimeout(() => setHighlightVariant(false), 3000)
  }

  const handleAddClick = () => {
    if (!user) return navigate('/login')
    if (isOutOfStock) return setToast({ message: 'Sản phẩm đã hết hàng', type: 'error' })
    setBuyNowMode(false)
    if (variants.length > 1 && !selectedVar) return scrollToVariants()
    handleAddCart()
  }

  const handleBuyNow = async () => {
    if (!user) return navigate('/login')
    if (isOutOfStock) return setToast({ message: 'Sản phẩm đã hết hàng', type: 'error' })
    setBuyNowMode(true)
    if (variants.length > 1 && !selectedVar) return scrollToVariants()
    try {
      const variantId = selectedVar || (variants[0]?.maBienThe)
      if (!variantId) return setToast({ message: 'Sản phẩm chưa có biến thể', type: 'error' })
      await addToCart({ maBienThe: variantId, soLuong: qty })
      refreshCount()
      const selected = [{
        maBienThe: variantId,
        soLuong: qty,
        tenSanPham: product.tenSanPham,
        donGia: variantPrice,
        urlAnh: mainImg,
        maSanPham: product.maSanPham,
      }]
      navigate('/checkout', { state: { selectedItems: selected } })
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Mua thất bại', type: 'error' })
    }
  }

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square bg-ivory-100 rounded-2xl skeleton" />
        <div className="space-y-4">
          <div className="h-6 bg-ivory-100 rounded-lg w-1/4 skeleton" />
          <div className="h-10 bg-ivory-100 rounded-lg w-3/4 skeleton" />
          <div className="h-10 bg-ivory-100 rounded-lg w-1/3 skeleton" />
          <div className="h-4 bg-ivory-100 rounded-lg w-full skeleton" />
          <div className="h-4 bg-ivory-100 rounded-lg w-2/3 skeleton" />
          <div className="h-12 bg-ivory-100 rounded-xl w-full mt-6 skeleton" />
          <div className="h-14 bg-ivory-100 rounded-xl w-full skeleton" />
        </div>
      </div>
    </div>
  )

  if (!product) return <div className="text-center py-20 text-stone">Không tìm thấy sản phẩm</div>

  const selectedColorId = selectedVar ? variants.find(v => v.maBienThe === selectedVar)?.mauSac?.maMauSac : null
  const filteredImages = images
  const thumbnails = [
    ...filteredImages.map(i => ({ url: i.urlAnh, maBienThe: i.maBienThe ?? i.bienThe?.maBienThe })),
    ...variants
      .filter(v => v.urlAnh)
      .sort((a, b) => (a.kichCo?.maKichCo || 0) - (b.kichCo?.maKichCo || 0))
      .filter((v, i, arr) => {
        const colorId = v.mauSac?.maMauSac
        return !colorId || arr.findIndex(x => x.mauSac?.maMauSac === colorId) === i
      })
      .map(v => ({ url: v.urlAnh, maBienThe: v.maBienThe })),
  ].filter((t, i, arr) => t.url && arr.findIndex(x => x.url === t.url) === i)
  const allImages = thumbnails.map(t => t.url)
  const selectedVariantImg = selectedVar ? variants.find(v => v.maBienThe === selectedVar)?.urlAnh : null
  const mainImg = imageUrl(selectedVariantImg) || imageUrl(allImages[previewIdx]) || imageUrl(product.urlAnhDaiDien) || 'https://placehold.co/600x600/e2e8f0/475569?text=Polo'
  const variantPrice = selectedVar ? (variants.find(v => v.maBienThe === selectedVar)?.gia || product.giaThapNhat || 0) : (product.giaThapNhat ?? variants[0]?.gia ?? 0)
  const selectedVariant = selectedVar ? variants.find(v => v.maBienThe === selectedVar) : (variants[0] || null)
  const selectedStock = selectedVariant?.tonKho ?? 0
  const totalStock = variants.reduce((sum, v) => sum + (v.tonKho || 0), 0)
  const isOutOfStock = totalStock === 0
  const isSelectedOutOfStock = selectedStock === 0

  const colorGroups = useMemo(() => {
    const groups = []
    const seen = new Set()
    variants.forEach((v) => {
      const id = v.mauSac?.maMauSac
      if (!id || seen.has(id)) return
      seen.add(id)
      const inColor = variants.filter((x) => x.mauSac?.maMauSac === id)
      const firstWithImg = inColor.find((x) => x.urlAnh)
      groups.push({
        maMauSac: id,
        mauSac: v.mauSac,
        image: firstWithImg?.urlAnh || product?.urlAnhDaiDien,
        sizes: inColor.filter((x, i, arr) => arr.findIndex((y) => y.kichCo?.maKichCo === x.kichCo?.maKichCo) === i),
        inStock: inColor.some((x) => (x.tonKho || 0) > 0),
      })
    })
    return groups
  }, [variants, product])
  const colorCount = colorGroups.length

  const pickVariantForColor = (group) => {
    if (!group) return null
    const withStock = group.sizes.find((s) => (s.tonKho || 0) > 0)
    return withStock?.maBienThe || group.sizes[0]?.maBienThe || null
  }

  const syncColorIdx = (variantId) => {
    const v = variants.find((x) => x.maBienThe === variantId)
    if (!v) return
    const idx = colorGroups.findIndex((g) => g.maMauSac === v.mauSac?.maMauSac)
    if (idx >= 0) setColorIdx(idx)
  }

  const goPrevColor = () => {
    if (colorCount <= 1) return
    const next = (colorIdx - 1 + colorCount) % colorCount
    setColorIdx(next)
    const vId = pickVariantForColor(colorGroups[next])
    if (vId) {
      setSelectedVar(vId)
      const tIdx = thumbnails.findIndex((t) => t.maBienThe === vId)
      setPreviewIdx(tIdx >= 0 ? tIdx : 0)
    }
  }

  const goNextColor = () => {
    if (colorCount <= 1) return
    const next = (colorIdx + 1) % colorCount
    setColorIdx(next)
    const vId = pickVariantForColor(colorGroups[next])
    if (vId) {
      setSelectedVar(vId)
      const tIdx = thumbnails.findIndex((t) => t.maBienThe === vId)
      setPreviewIdx(tIdx >= 0 ? tIdx : 0)
    }
  }

  const REVIEWS_PER_PAGE = 5
  const sortedReviews = [...reviews].sort((a, b) => {
    if (reviewSort === 'newest') return new Date(b.ngayTao) - new Date(a.ngayTao)
    if (reviewSort === 'highest') return b.soSao - a.soSao
    if (reviewSort === 'lowest') return a.soSao - b.soSao
    return 0
  })
  const totalReviewPages = Math.ceil(sortedReviews.length / REVIEWS_PER_PAGE)
  const pagedReviews = sortedReviews.slice(reviewPage * REVIEWS_PER_PAGE, (reviewPage + 1) * REVIEWS_PER_PAGE)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <nav className="flex items-center gap-1.5 text-sm text-stone mb-6">
        <Link to="/" className="hover:text-gold transition-colors">Trang chủ</Link>
        <ChevronRight className="h-3 w-3 text-stone" />
        <Link to="/products" className="hover:text-gold transition-colors">Sản phẩm</Link>
        <ChevronRight className="h-3 w-3 text-stone" />
        <span className="text-ink font-semibold truncate max-w-[200px]">{product.tenSanPham}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="max-w-lg mx-auto md:mx-0">
          <div className="relative mb-3">
            <div className="flex items-center animate-float">
              {colorCount > 1 && (
                <button onClick={goPrevColor} aria-label="Màu trước"
                  className="shrink-0 z-10 mr-1.5 md:mr-3 w-9 h-9 rounded-full bg-ivory/95 hover:bg-ivory text-ink shadow-md border border-stone/15 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95">
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <div key={mainImg} className="relative flex-1 aspect-square bg-ivory-100 rounded-2xl overflow-hidden shadow-lg animate-fade-in">
                <div className="hidden md:block w-full h-full">
                  <TiltedCard imageSrc={mainImg} altText={product.tenSanPham} containerHeight="100%" containerWidth="100%" imageHeight="100%" imageWidth="100%" rotateAmplitude={10} scaleOnHover={1.03} />
                </div>
                <div className="block md:hidden w-full h-full">
                  <SafeImg src={mainImg} alt={product.tenSanPham} className="w-full h-full object-cover object-center" />
                </div>
              </div>
              {colorCount > 1 && (
                <button onClick={goNextColor} aria-label="Màu tiếp theo"
                  className="shrink-0 z-10 ml-1.5 md:ml-3 w-9 h-9 rounded-full bg-ivory/95 hover:bg-ivory text-ink shadow-md border border-stone/15 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95">
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-4/5 h-5 rounded-[50%] bg-noir/15 blur-xl pointer-events-none" />
          </div>
          {allImages.length > 1 && (
            <div className="relative">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {allImages.map((url, idx) => (
                    <button
                        key={idx}
                        onClick={() => {
                            setPreviewIdx(idx)
                            const vId = thumbnails[idx]?.maBienThe
                            if (vId) { setSelectedVar(vId); syncColorIdx(vId) }
                        }}
                        className={`w-20 h-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                            idx === previewIdx
                                ? 'border-gold ring-2 ring-blue-200 shadow-md'
                                : 'border-stone/20 hover:border-stone/30  hover:shadow-sm'
                        }`}
                    >
                        <SafeImg
                            src={url}
                            alt=""
                            className="w-full h-full object-cover object-center"
                        />
                    </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          {product.danhMuc?.tenDanhMuc && (
            <span className="inline-block text-[11px] font-semibold text-gold bg-gold/10 px-2.5 py-1 rounded-full mb-2">
              {product.danhMuc.tenDanhMuc}
            </span>
          )}
          <h1 className="text-3xl font-bold text-ink mb-1">{product.tenSanPham}</h1>
          <div className="flex items-center gap-2 mb-5">
            {!selectedVar}
            <p className="text-4xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">{VND(variantPrice)}</p>
          </div>

          {variants.length > 0 && (() => {
            const uniqueColors = []
            const seenColors = new Set()
            variants.forEach(v => {
              const id = v.mauSac?.maMauSac
              if (id && !seenColors.has(id)) { seenColors.add(id); uniqueColors.push(v) }
            })

            const uniqueSizes = []
            const seenSizes = new Set()
            variants.forEach(v => {
              const id = v.kichCo?.maKichCo
              if (id && !seenSizes.has(id)) { seenSizes.add(id); uniqueSizes.push(v) }
            })

            const selectedSizeId = selectedVar ? variants.find(v => v.maBienThe === selectedVar)?.kichCo?.maKichCo : null

            const sizesForColor = (selectedColorId
              ? variants.filter(v => v.mauSac?.maMauSac === selectedColorId)
              : variants).filter((v, i, arr) => {
                const id = v.kichCo?.maKichCo
                return id && arr.findIndex(x => x.kichCo?.maKichCo === id) === i
              })

            return (
              <div ref={variantRef} className={`relative mb-5 transition-all duration-500 ${highlightVariant ? 'bg-gradient-to-r from-red-100/90 via-rose-100/90 to-red-100/90 -mx-2 px-2 py-1 rounded-2xl' : ''}`}>
                {highlightVariant && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-600 to-red-600 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full shadow-lg shadow-red-300/50 whitespace-nowrap z-10 animate-pulse">
                    Vui lòng chọn màu sắc & kích cỡ
                  </div>
                )}
                <div className="mb-4">
                  <label className="font-semibold text-sm mb-2.5 block text-ink-soft">Màu sắc:</label>
                  <div className="flex gap-3 flex-wrap">
                    {uniqueColors.map((v) => {
                      const hasStock = variants.some(x => x.mauSac?.maMauSac === v.mauSac?.maMauSac && (x.tonKho || 0) > 0)
                      const selected = selectedColorId === v.mauSac?.maMauSac
                      return (
                        <button key={v.mauSac?.maMauSac}
                          onClick={() => {
                            const firstAvail = hasStock ? variants.find(x => x.mauSac?.maMauSac === v.mauSac?.maMauSac && (x.tonKho || 0) > 0) || variants.find(x => x.mauSac?.maMauSac === v.mauSac?.maMauSac) : variants.find(x => x.mauSac?.maMauSac === v.mauSac?.maMauSac)
                            const vId = firstAvail?.maBienThe || v.maBienThe
                            setSelectedVar(vId)
                            syncColorIdx(vId)
                            const idx = thumbnails.findIndex(t => t.maBienThe === vId)
                            setPreviewIdx(idx >= 0 ? idx : 0)
                          }}
                          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                            selected
                              ? 'bg-gold text-noir shadow-md shadow-blue-200'
                              : 'bg-ivory border border-stone/20 hover:border-stone/30 hover:shadow-sm'
                          }`}>
                          {v.mauSac?.maMauHex && (
                            <span className={`w-5 h-5 rounded-full ${selected ? 'ring-2 ring-white ring-offset-1 ring-offset-blue-700' : 'ring-1 ring-gray-300'}`}
                              style={{ backgroundColor: v.mauSac.maMauHex }} />
                          )}
                          <span>{v.mauSac?.mauSac}</span>
                          {!hasStock && <span className="text-[10px] font-medium text-bordeaux">(Hết)</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-sm mb-2.5 block text-ink-soft">Kích cỡ:</label>
                  <div className="flex gap-2 flex-wrap">
                    {sizesForColor.map((v) => {
                      const disabled = (v.tonKho || 0) === 0
                      const selected = selectedVar === v.maBienThe
                      return (
                        <button key={v.maBienThe}
                          onClick={() => {
                            if (disabled) return
                            setSelectedVar(v.maBienThe)
                            syncColorIdx(v.maBienThe)
                            const idx = thumbnails.findIndex(t => t.maBienThe === v.maBienThe)
                            setPreviewIdx(idx >= 0 ? idx : 0)
                          }}
                          disabled={disabled}
                          className={`min-w-[3rem] px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                            selected
                              ? 'bg-gold text-noir shadow-md shadow-blue-200'
                              : disabled
                                ? 'bg-ivory-100 text-stone border border-stone/10 cursor-not-allowed line-through'
                                : 'bg-ivory border border-stone/20 hover:border-stone/30 hover:shadow-sm'
                          }`}>
                          {v.kichCo?.kichCo || 'N/A'}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <p className="text-xs text-stone mt-3">
                  Tồn kho: <span className="font-medium text-stone">{selectedStock}</span>
                  {selectedStock === 0 && <span className="ml-2 text-bordeaux font-semibold">(Hết hàng)</span>}
                </p>
              </div>
            )
          })()}

          <div className="flex items-center gap-4 mb-5">
            <div className="flex items-center bg-ivory-100 border border-stone/20 rounded-xl overflow-hidden">
              <button onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1}
                className="px-3.5 py-2.5 text-stone hover:bg-ivory-100 hover:text-ink transition font-medium text-lg leading-none disabled:opacity-30 disabled:cursor-not-allowed">−</button>
              <input type="number" value={qty} min={1} max={selectedStock || 1}
                onChange={e => {
                  const v = parseInt(e.target.value) || 1
                  setQty(Math.max(1, Math.min(selectedStock || 1, v)))
                }}
                onBlur={e => { if (!e.target.value || parseInt(e.target.value) < 1) setQty(1) }}
                className="w-16 px-2 py-2.5 border-x border-stone/20 text-center font-semibold text-ink text-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              <button onClick={() => setQty(Math.min(selectedStock, qty + 1))} disabled={qty >= selectedStock}
                className="px-3.5 py-2.5 text-stone hover:bg-ivory-100 hover:text-ink transition font-medium text-lg leading-none disabled:opacity-30 disabled:cursor-not-allowed">+</button>
            </div>
            {selectedStock > 0 && <span className="text-xs text-stone">Còn lại: <strong>{selectedStock}</strong></span>}
          </div>

          <div className="flex gap-3">
            <button onClick={handleBuyNow} disabled={isOutOfStock || isSelectedOutOfStock}
              className={`flex-1 font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm ${
                isOutOfStock || isSelectedOutOfStock
                  ? 'bg-ivory-100 text-stone cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
              }`}>
              <Zap className="h-5 w-5" /> Mua ngay
            </button>
            <button onClick={handleAddClick} disabled={isOutOfStock || isSelectedOutOfStock}
              className={`font-semibold py-3.5 px-5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border-2 ${
                isOutOfStock || isSelectedOutOfStock
                  ? 'bg-ivory-100 text-stone border-stone/20 cursor-not-allowed'
                  : 'border-gold text-gold hover:bg-gold/10 hover:shadow-sm active:scale-95'
              }`}>
              <ShoppingCart className="h-5 w-5" />
            </button>
            <button onClick={toggleWish}
              className={`p-3.5 rounded-xl border transition-all duration-200 ${
                inWish
                  ? 'text-bordeaux border-bordeaux/20 bg-bordeaux/10 hover:bg-bordeaux/20'
                  : 'border-stone/20 hover:border-stone/30 hover:bg-ivory-100 hover:shadow-sm'
              }`}>
              <Heart className={`h-5 w-5 transition-all duration-200 ${inWish ? 'fill-red-500 scale-110' : ''}`} />
            </button>
          </div>

          {msg && <p className="mt-3 text-sm text-emerald-deep font-semibold">{msg}</p>}
        </div>
      </div>

      {product.moTa && (
        <div className="mt-10">
          <div className="bg-ivory border border-stone/10 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-transparent px-6 py-4 border-b border-stone/10">
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <span className="w-1 h-5 bg-gold rounded-full inline-block" />
                Mô tả sản phẩm
              </h2>
            </div>
            <div className="p-6 text-stone leading-relaxed whitespace-pre-line text-sm">
              {product.moTa}
            </div>
          </div>
        </div>
      )}

      <div className="mt-10">
        <div className="bg-ivory border border-stone/10 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-amber-50 to-transparent px-6 py-4 border-b border-stone/10 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <span className="w-1 h-5 bg-gold/100 rounded-full inline-block" />
              Đánh giá sản phẩm
            </h2>
            {user && (
              <Link to="/orders" className="text-xs font-medium text-gold hover:text-gold hover:underline">
                Viết đánh giá →
              </Link>
            )}
          </div>
          <div className="p-6">
            <div className="flex items-start gap-8 flex-wrap">
              <div className="text-center min-w-[100px]">
                <span className="text-5xl font-bold text-ink">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</span>
                <div className="flex gap-0.5 justify-center mt-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${avgRating > 0 && i < Math.round(avgRating) ? 'fill-amber-400 text-gold' : 'text-stone'}`} />
                  ))}
                </div>
                <p className="text-sm text-stone mt-1 font-medium">{reviewCount} đánh giá</p>
              </div>
              <div className="flex-1 min-w-[200px] space-y-1.5 pt-1">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviews.filter(r => r.soSao === star).length
                  const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0
                  return (
                    <div key={star} className="flex items-center gap-2 text-sm">
                      <span className="text-stone w-5 text-right text-xs font-medium">{star}</span>
                      <Star className="h-3 w-3 text-gold fill-amber-400 shrink-0" />
                      <div className="flex-1 h-2.5 bg-ivory-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-stone w-6 text-xs text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {reviewCount > 1 && (
              <div className="flex items-center gap-2 border-t border-stone/10 pt-4 mt-4">
                <Filter className="h-3.5 w-3.5 text-stone" />
                <span className="text-xs text-stone mr-1">Sắp xếp:</span>
                {[
                  { value: 'newest', label: 'Mới nhất' },
                  { value: 'highest', label: 'Đánh giá cao' },
                  { value: 'lowest', label: 'Đánh giá thấp' },
                ].map((opt) => (
                  <button key={opt.value} onClick={() => { setReviewSort(opt.value); setReviewPage(0) }}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                      reviewSort === opt.value
                        ? 'bg-gold text-noir border-gold font-semibold'
                        : 'text-stone border-stone/20 hover:border-gold/30 hover:text-gold'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {reviewCount > 0 && (
        <div className="mt-6">
          <div className="space-y-3">
            {pagedReviews.map((r) => (
              <div key={r.maDanhGia} className="bg-ivory border border-stone/10 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                      {r.nguoiDung?.hoTen?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-ink">{r.nguoiDung?.hoTen || 'Khách hàng'}</p>
                        {r.donHang && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-deep bg-emerald-deep/10 px-1.5 py-0.5 rounded-full">
                            <BadgeCheck className="h-3 w-3" /> Đã mua hàng
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone mt-0.5">{r.ngayTao ? new Date(r.ngayTao).toLocaleDateString('vi-VN') : ''}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < r.soSao ? 'text-gold fill-amber-400' : 'text-stone'}`} />
                    ))}
                  </div>
                </div>
                {r.binhLuan && (
                  <p className="text-sm text-stone leading-relaxed bg-ivory-100 rounded-xl p-3.5 border border-stone/5">
                    {r.binhLuan}
                  </p>
                )}
              </div>
            ))}
          </div>

          {totalReviewPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-5">
              <button disabled={reviewPage === 0} onClick={() => setReviewPage(reviewPage - 1)}
                className="px-3 py-1.5 text-xs border rounded-lg hover:bg-ivory-100 disabled:opacity-30 disabled:cursor-not-allowed transition">
                ← Trước
              </button>
              {Array.from({ length: totalReviewPages }, (_, i) => (
                <button key={i} onClick={() => setReviewPage(i)}
                  className={`w-8 h-8 text-xs rounded-lg border transition ${
                    i === reviewPage
                      ? 'bg-gold text-noir border-gold font-semibold shadow-sm'
                      : 'text-stone border-stone/20 hover:bg-ivory-100'
                  }`}>
                  {i + 1}
                </button>
              ))}
              <button disabled={reviewPage >= totalReviewPages - 1} onClick={() => setReviewPage(reviewPage + 1)}
                className="px-3 py-1.5 text-xs border rounded-lg hover:bg-ivory-100 disabled:opacity-30 disabled:cursor-not-allowed transition">
                Sau →
              </button>
            </div>
          )}
        </div>
      )}

      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            <h2 className="text-lg font-bold text-ink whitespace-nowrap">Có thể bạn cũng thích</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map(p => (
              <ProductCard key={p.maSanPham} product={p} />
            ))}
          </div>
        </div>
      )}

      {modalOpen && (
        <VariantModal
          variants={variants}
          images={images}
          onConfirm={async (vid, sl) => {
            setModalOpen(false)
            if (!user) return navigate('/login')
            if (buyNowMode) {
              const v = variants.find(x => x.maBienThe === vid) || {}
              const s = { ...v.sanPham } || {}
              try {
                await addToCart({ maBienThe: vid, soLuong: sl || qty })
                refreshCount()
              } catch {}
              navigate('/checkout', {
                state: {
                  selectedItems: [{
                    maBienThe: vid,
                    soLuong: sl || qty,
                    tenSanPham: s.tenSanPham || product.tenSanPham,
                    donGia: v.gia || variantPrice,
                    urlAnh: v.urlAnh || mainImg,
                    maSanPham: s.maSanPham || product.maSanPham,
                  }]
                }
              })
              return
            }
            try {
              await addToCart({ maBienThe: vid, soLuong: sl || qty })
              refreshCount()
              setToast({ message: 'Đã thêm vào giỏ hàng!', type: 'success' })
            } catch (err) {
              setToast({ message: err.response?.data?.message || 'Thêm thất bại', type: 'error' })
            }
          }}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
