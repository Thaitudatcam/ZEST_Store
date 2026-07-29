import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getProducts } from '../api/products'
import { getCategories } from '../api/categories'
import { getBestSelling, getPopular, getPersonalized } from '../api/recommendations'
import api from '../api/axios'
import ProductCard from '../components/ProductCard'
import { Truck, Shield, RefreshCw, Headphones, ArrowRight, ShoppingBag, TrendingUp, Sparkles, Filter, ChevronDown } from 'lucide-react'
import ZS from '../pictures/ZS.png'
import PromoBanner from '../components/PromoBanner'
import Aurora from '../components/ui/Aurora'
import RotatingText from '../components/ui/RotatingText'
import SpotlightCard from '../components/ui/SpotlightCard'
import GradientText from '../components/ui/GradientText'
import FadeContent from '../components/ui/FadeContent'

const rawStrip = Object.entries(import.meta.glob('../pictures/strip/*.{png,jpg,jpeg,webp}', { eager: true, query: '?url', import: 'default' }))
const stripData = rawStrip
  .filter(([path]) => !path.endsWith('-back.'))
  .map(([path, src]) => ({
    front: src,
    title: path.split('/').pop().replace(/\.[^.]+$/, '')
  }))

export default function Home() {
  const productRef = useRef(null)
  const [latestProducts, setLatestProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [sizes, setSizes] = useState([])
  const [loading, setLoading] = useState(true)
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [bestSelling, setBestSelling] = useState([])
  const [forYou, setForYou] = useState([])
  const [forYouTitle, setForYouTitle] = useState('')

  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterSize, setFilterSize] = useState('')
  const [sortDir, setSortDir] = useState('desc')
  const [sortBy, setSortBy] = useState('ngayTao')
  const [allProducts, setAllProducts] = useState([])
  const [allLoading, setAllLoading] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const [prodData, catData, sz, best] = await Promise.all([
          getProducts({ page: 0, size: 8, sortBy: 'ngayTao', sortDir: 'desc' }),
          getCategories(),
          api.get('/sizes').then(r => r.data),
          getBestSelling(8).catch(() => []),
        ]);
        setLatestProducts(prodData.content ?? prodData ?? []);
        setBestSelling(Array.isArray(best) ? best : []);
        const roots = Array.isArray(catData) ? catData.filter((c) => !c.maDanhMucCha) : [];
        setCategories(roots);
        setSizes(Array.isArray(sz) ? sz : []);
      } catch {} finally { setLoading(false); }
    })();
    getPersonalized(8).then(d => { setForYou(d); setForYouTitle('Gợi ý cho bạn'); }).catch(() =>
      getPopular(8).then(d => { setForYou(d); setForYouTitle('Phổ biến nhất'); }).catch(() => {})
    );
  }, [])

  useEffect(() => {
    setAllLoading(true)
    const params = { page: 0, size: 50, sortBy, sortDir }
    if (searchQuery) params.keyword = searchQuery
    if (filterCategory) params.categoryId = filterCategory
    getProducts(params)
      .then(d => setAllProducts(d.content ?? d ?? []))
      .catch(() => {})
      .finally(() => setAllLoading(false))
  }, [searchQuery, filterCategory, filterSize, sortBy, sortDir])

  const scrollToProducts = (e) => {
    e.preventDefault()
    productRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleSortChange = (val) => {
    if (val === 'gia-asc') { setSortBy('gia'); setSortDir('asc') }
    else if (val === 'gia-desc') { setSortBy('gia'); setSortDir('desc') }
    else { setSortBy('ngayTao'); setSortDir('desc') }
  }

  return (
    <div className="animate-fade-in">

      {/* ──────── HERO ──────── */}
      <section className="relative bg-noir text-ivory overflow-hidden min-h-[90vh] flex items-center">
        <Aurora colorStops={['#C9A227', '#8B6914', '#0B0B0F']} amplitude={0.8} blend={0.6} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-12 flex flex-col md:flex-row items-center gap-6 w-full">
          <div className="flex-1 text-center md:text-left">
            <span className="inline-flex items-center gap-2 bg-gold/10 text-gold text-[11px] font-semibold tracking-[0.25em] uppercase px-4 py-1.5 rounded-full mb-5 border border-gold/30 backdrop-blur-sm">
              <Sparkles className="h-3 w-3" /> Bộ Sưu Tập Mới 2026
            </span>
              <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight min-h-[1.2em]">
                  <RotatingText texts={['Khẳng Định Phong Cách', 'Tự Tin Tỏa Sáng', 'Chất Riêng Của Bạn']} mainClassName="text-ivory" rotationInterval={3000} splitBy="characters" staggerDuration={0.02} />
              </h2>
              <p className="text-base md:text-lg text-stone-light/70 mb-8 max-w-lg leading-relaxed">
                  Mỗi chiếc áo polo tại ZestStore được thiết kế để mang đến sự thoải mái,
                  lịch lãm và tự tin, đồng hành cùng bạn trong mọi phong cách sống.
              </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start mb-8">
              <a href="#products" onClick={scrollToProducts}
                className="group inline-flex items-center gap-2 bg-gold text-noir font-semibold px-8 py-3.5 rounded-full shadow-gold transition-all duration-300 hover:bg-gold-light hover:-translate-y-1 active:scale-95 cursor-pointer">
                <ShoppingBag className="h-5 w-5" /> Mua ngay <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" /></a>
            </div>
            <div className="flex flex-wrap gap-6 text-sm justify-center md:justify-start">
              {[
                { icon: Truck, label: 'Miễn phí vận chuyển' },
                { icon: RefreshCw, label: 'Đổi trả 30 ngày' },
                { icon: Shield, label: 'Chính hãng 100%' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-stone-light/60">
                  <Icon className="h-4 w-4 text-gold/70" /> <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="relative w-52 h-52 md:w-80 md:h-80">
              <div className="absolute inset-0 bg-gradient-to-tr from-gold/20 to-transparent rounded-full animate-pulse" />
              <div className="relative w-full h-full rounded-2xl shadow-lux overflow-hidden ring-1 ring-gold/30">
                <img src={ZS} alt="Polo Nam" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

        {/* ──────── PROMO BANNER ──────── */}
        <PromoBanner />




      {/* ──────── PRODUCT LISTING WITH FILTERS ──────── */}
      <section ref={productRef} id="all-products" className="py-14">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-7">
            <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-gold-dark mb-2">Khám phá</span>
            <h2 className="font-serif text-3xl font-bold text-ink"><GradientText from="#8B6914" to="#C9A227">Tất cả sản phẩm</GradientText></h2>
          </div>

          {/* Filters */}
          <div className="bg-ivory rounded-xl border border-gold/15 p-4 mb-6 shadow-lux">
            <button onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="relative flex items-center gap-1.5 text-sm text-ink-soft hover:text-gold-dark transition">
              <Filter className="h-4 w-4" />
              <span>Bộ lọc</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-all duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
              {(filterCategory !== '' || sortBy !== 'ngayTao' || sortDir !== 'desc') && (
                <span className="absolute -top-1 -right-4 w-2 h-2 bg-gold rounded-full" />
              )}
            </button>
            <div className={`overflow-hidden transition-all duration-200 ${isFilterOpen ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="text-xs text-stone font-medium tracking-wide">Danh mục</label>
                  <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full border border-noir-600/15 rounded-lg px-3 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold bg-ivory text-ink">
                    <option value="">Tất cả danh mục</option>
                    {categories.map(c => <option key={c.maDanhMuc} value={c.maDanhMuc}>{c.tenDanhMuc}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-stone font-medium tracking-wide">Sắp xếp</label>
                  <select onChange={(e) => handleSortChange(e.target.value)}
                    className="w-full border border-noir-600/15 rounded-lg px-3 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold bg-ivory text-ink">
                    <option value="">Mới nhất</option>
                    <option value="gia-asc">Giá tăng dần</option>
                    <option value="gia-desc">Giá giảm dần</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {allLoading ? (
            <FadeContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-gold/15 bg-ivory">
                  <div className="aspect-square skeleton" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 w-3/4 skeleton" />
                    <div className="h-4 w-1/3 skeleton" />
                  </div>
                </div>
              ))}
            </div>
            </FadeContent>
          ) : allProducts.length === 0 ? (
            <FadeContent><p className="text-center py-12 text-stone">Không tìm thấy sản phẩm</p></FadeContent>
          ) : (
            <FadeContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {allProducts.map((p, i) => (
                <div key={p.maSanPham} className="animate-fade-in">
                  <SpotlightCard spotlightColor="rgba(201, 162, 39, 0.18)" className="h-full">
                    <ProductCard product={p} showRating={false} />
                  </SpotlightCard>
                </div>
              ))}
            </div>
            </FadeContent>
          )}
        </div>
      </section>




    </div>
  )
}
