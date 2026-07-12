import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getProducts } from '../api/products'
import { getCategories } from '../api/categories'
import { getBestSelling, getPopular, getPersonalized } from '../api/recommendations'
import api from '../api/axios'
import ProductCard from '../components/ProductCard'
import { Truck, Shield, RefreshCw, Headphones, ArrowRight, ShoppingBag, TrendingUp, Sparkles } from 'lucide-react'
import ZS from '../pictures/ZS.png'
import PromoBanner from '../components/PromoBanner'

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
      <section className="relative bg-gradient-to-br from-slate-800 via-blue-900 to-slate-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#ffffff20_0%,_transparent_50%),radial-gradient(ellipse_at_bottom_right,_#ffffff08_0%,_transparent_50%)]" />
        <div className="relative max-w-7xl mx-auto px-4 py-8 md:py-12 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 text-center md:text-left">
            <span className="inline-block bg-white/15 text-white text-xs font-medium tracking-widest px-4 py-1.5 rounded-full mb-5 border border-white/25 backdrop-blur-sm">BỘ SƯU TẬP MỚI 2026</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                  Khẳng Định <br />
                  <span >Phong Cách Của Bạn</span>
              </h2>
              <p className="text-base md:text-lg text-blue-100 mb-8 max-w-lg leading-relaxed">
                  Mỗi chiếc áo polo tại ZestStore được thiết kế để mang đến sự thoải mái,
                  lịch lãm và tự tin, đồng hành cùng bạn trong mọi phong cách sống.
              </p><div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <a
                    href="#products"
                    onClick={scrollToProducts}
                    className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-7 py-3.5 rounded-full shadow-xl transition-all duration-300 hover:bg-yellow-300 hover:text-slate-900 hover:-translate-y-1 hover:shadow-2xl active:scale-95 cursor-pointer"
                >
                    <ShoppingBag className="h-5 w-5" />
                    Mua ngay
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
                {/*<div className="flex gap-8 mt-10 text-center md:text-left">*/}
                {/*    <div>*/}
                {/*        <h3 className="text-3xl font-bold text-yellow-300">500+</h3>*/}
                {/*        <p className="text-blue-100 text-sm">Sản phẩm</p>*/}
                {/*    </div>*/}

                {/*    <div>*/}
                {/*        <h3 className="text-3xl font-bold text-yellow-300">10K+</h3>*/}
                {/*        <p className="text-blue-100 text-sm">Khách hàng</p>*/}
                {/*    </div>*/}

                {/*    <div>*/}
                {/*        <h3 className="text-3xl font-bold text-yellow-300">4.9★</h3>*/}
                {/*        <p className="text-blue-100 text-sm">Đánh giá</p>*/}
                {/*    </div>*/}
                {/*</div>*/}
            </div>
            <div className="flex flex-wrap gap-6 mt-8 text-sm justify-center md:justify-start">
              {[
                { icon: Truck, label: 'Miễn phí vận chuyển' },
                { icon: RefreshCw, label: 'Đổi trả 30 ngày' },
                { icon: Shield, label: 'Chính hãng 100%' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-blue-200">
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="relative w-52 h-52 md:w-72 md:h-72">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent rounded-full animate-pulse" />
              <div className="relative w-full h-full rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/20">
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
          <h2 className="text-2xl font-bold mb-7 text-neutral-900">Tất cả sản phẩm</h2>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-6">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="text-xs text-neutral-500 font-medium tracking-wide">Danh mục</label>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white text-neutral-800">
                  <option value="">Tất cả danh mục</option>
                  {categories.map(c => <option key={c.maDanhMuc} value={c.maDanhMuc}>{c.tenDanhMuc}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-neutral-500 font-medium tracking-wide">Sắp xếp</label>
                <select onChange={(e) => handleSortChange(e.target.value)}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white text-neutral-800">
                  <option value="">Mới nhất</option>
                  <option value="gia-asc">Giá tăng dần</option>
                  <option value="gia-desc">Giá giảm dần</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {allLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-neutral-200 bg-white">
                  <div className="aspect-square skeleton" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 w-3/4 skeleton" />
                    <div className="h-4 w-1/3 skeleton" />
                  </div>
                </div>
              ))}
            </div>
          ) : allProducts.length === 0 ? (
            <p className="text-center py-12 text-neutral-400">Không tìm thấy sản phẩm</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {allProducts.map((p, i) => (
                <div key={p.maSanPham} className="animate-fade-in">
                  <ProductCard product={p} showRating={false} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>




    </div>
  )
}
