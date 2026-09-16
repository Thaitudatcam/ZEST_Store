import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { getProducts } from '../api/products'
import { getActiveCategories } from '../api/categories'
import api from '../api/axios'
import ProductCard from '../components/ProductCard'
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react'

function FilterSection({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-noir-600/10 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-sm font-semibold text-ink mb-2.5 cursor-pointer">
        <span>{title}</span>
        <ChevronDown className={`h-4 w-4 text-stone transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div>{children}</div>}
    </div>
  )
}

export default function ProductListing() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [sizes, setSizes] = useState([])
  const [loading, setLoading] = useState(true)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  const [filterCategory, setFilterCategory] = useState(searchParams.get('category') || '')
  const [filterBrand, setFilterBrand] = useState(searchParams.get('brand') || '')
  const [filterSize, setFilterSize] = useState(searchParams.get('size') || '')
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'ngayTao')
  const [sortDir, setSortDir] = useState(searchParams.get('sortDir') || 'desc')
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '')

  useEffect(() => {
    Promise.all([
      getActiveCategories().catch(() => []),
      api.get('/brands').then(r => r.data).catch(() => []),
      api.get('/sizes').then(r => r.data).catch(() => []),
    ]).then(([cats, brs, sz]) => {
      setCategories(Array.isArray(cats) ? cats : [])
      setBrands(Array.isArray(brs) ? brs : [])
      setSizes(Array.isArray(sz) ? sz : [])
    })
  }, [])

  useEffect(() => {
    const kw = searchParams.get('keyword') || ''
    setKeyword(kw)
  }, [searchParams])

  useEffect(() => {
    setLoading(true)
    const params = { page: 0, size: 50, sortBy, sortDir }
    if (keyword) params.keyword = keyword
    if (filterCategory) params.categoryId = filterCategory
    if (minPrice) params.minPrice = minPrice
    if (maxPrice) params.maxPrice = maxPrice
    getProducts(params)
      .then(d => setProducts(d.content ?? d ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [keyword, filterCategory, minPrice, maxPrice, sortBy, sortDir])

  const filteredProducts = useMemo(() => {
    let list = [...products]
    if (filterBrand) {
      list = list.filter(p => p.tenThuongHieu === filterBrand)
    }
    if (filterSize) {
      list = list.filter(p => p.bienThes?.some(b => b.kichCo?.kichCo === filterSize))
    }
    return list
  }, [products, filterBrand, filterSize])

  const uniqueBrands = useMemo(() => {
    const set = new Set(products.map(p => p.tenThuongHieu).filter(Boolean))
    return [...set]
  }, [products])

  const uniqueMaterials = useMemo(() => {
    const set = new Set(products.map(p => p.chatLieu?.tenThuocTinh).filter(Boolean))
    return [...set]
  }, [products])

  const clearFilters = () => {
    setFilterCategory('')
    setFilterBrand('')
    setFilterSize('')
    setMinPrice('')
    setMaxPrice('')
    setKeyword('')
    setSortBy('ngayTao')
    setSortDir('desc')
    setSearchParams({})
  }

  const hasActiveFilters = keyword || filterCategory || filterBrand || filterSize || minPrice || maxPrice

  const sidebarContent = (
    <div className="space-y-0">
      <FilterSection title="KHOẢNG GIÁ (VNĐ)">
        <div className="flex items-center gap-2">
          <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Từ" className="w-1/2 border border-noir-600/15 rounded-lg px-3 py-2 text-sm bg-ivory text-ink placeholder-stone focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold" />
          <span className="text-stone text-sm">-</span>
          <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Đến" className="w-1/2 border border-noir-600/15 rounded-lg px-3 py-2 text-sm bg-ivory text-ink placeholder-stone focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold" />
        </div>
      </FilterSection>

      <FilterSection title="THƯƠNG HIỆU">
        <div className="space-y-2 max-h-48 overflow-y-auto">
          <label className="flex items-center gap-2.5 text-sm text-ink-soft cursor-pointer hover:text-ink transition">
            <input type="radio" name="brand" checked={filterBrand === ''} onChange={() => setFilterBrand('')}
              className="w-4 h-4 accent-gold" />
            Tất cả
          </label>
          {uniqueBrands.map(b => (
            <label key={b} className="flex items-center gap-2.5 text-sm text-ink-soft cursor-pointer hover:text-ink transition">
              <input type="radio" name="brand" checked={filterBrand === b} onChange={() => setFilterBrand(b)}
                className="w-4 h-4 accent-gold" />
              {b}
            </label>
          ))}
        </div>
      </FilterSection>

      {uniqueMaterials.length > 0 && (
        <FilterSection title="CHẤT LIỆU" defaultOpen={false}>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <label className="flex items-center gap-2.5 text-sm text-ink-soft cursor-pointer hover:text-ink transition">
              <input type="radio" name="material" checked={true} readOnly
                className="w-4 h-4 accent-gold" />
              Tất cả
            </label>
            {uniqueMaterials.map(m => (
              <label key={m} className="flex items-center gap-2.5 text-sm text-ink-soft cursor-pointer hover:text-ink transition">
                <input type="radio" name="material" className="w-4 h-4 accent-gold" />
                {m}
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      <FilterSection title="KÍCH CỠ">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilterSize('')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border transition cursor-pointer ${
              filterSize === ''
                ? 'bg-gold text-noir border-gold'
                : 'bg-ivory text-ink-soft border-noir-600/15 hover:border-gold/50'
            }`}>Tất cả</button>
          {sizes.map(s => (
            <button key={s.maKichCo || s} onClick={() => setFilterSize(s.kichCo || s)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border transition cursor-pointer ${
                filterSize === (s.kichCo || s)
                  ? 'bg-gold text-noir border-gold'
                  : 'bg-ivory text-ink-soft border-noir-600/15 hover:border-gold/50'
              }`}>{s.kichCo || s}</button>
          ))}
        </div>
      </FilterSection>

      {hasActiveFilters && (
        <button onClick={clearFilters}
          className="w-full mt-4 py-2.5 rounded-lg border border-bordeaux/30 text-bordeaux text-sm font-medium hover:bg-bordeaux/5 transition cursor-pointer">
          Xóa bộ lọc
        </button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-ivory-100 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-ink">
              {keyword ? `Kết quả tìm kiếm: "${keyword}"` : 'Tất cả sản phẩm'}
            </h1>
            <p className="text-sm text-stone mt-0.5">{filteredProducts.length} sản phẩm</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg border border-noir-600/15 text-sm text-ink-soft hover:border-gold/50 transition">
              <SlidersHorizontal className="h-4 w-4" /> Lọc
            </button>
            <select value={`${sortBy}-${sortDir}`}
              onChange={(e) => { const [sb, sd] = e.target.value.split('-'); setSortBy(sb); setSortDir(sd) }}
              className="border border-noir-600/15 rounded-lg px-3 py-2 text-sm bg-ivory text-ink focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold cursor-pointer">
              <option value="ngayTao-desc">Mới nhất</option>
              <option value="giaTrungBinh-asc">Giá tăng dần</option>
              <option value="giaTrungBinh-desc">Giá giảm dần</option>
            </select>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="bg-ivory rounded-xl border border-noir-600/10 p-5 sticky top-24">
              <div className="flex items-center gap-2 mb-5">
                <SlidersHorizontal className="h-4 w-4 text-gold" />
                <span className="text-sm font-semibold text-ink">Bộ lọc</span>
              </div>
              {sidebarContent}
            </div>
          </aside>

          {/* Products */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl overflow-hidden border border-noir-600/5 bg-ivory">
                    <div className="aspect-square skeleton" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 w-3/4 skeleton" />
                      <div className="h-4 w-1/3 skeleton" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-stone text-sm">Không tìm thấy sản phẩm phù hợp</p>
                {hasActiveFilters && (
                  <button onClick={clearFilters}
                    className="mt-3 text-gold text-sm font-medium hover:underline cursor-pointer">
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredProducts.map(p => (
                  <ProductCard key={p.maSanPham} product={p} showRating={false} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-noir/50" onClick={() => setMobileFilterOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 bg-ivory shadow-xl overflow-y-auto animate-slide-in">
            <div className="flex items-center justify-between p-4 border-b border-noir-600/10">
              <span className="text-sm font-semibold text-ink">Bộ lọc</span>
              <button onClick={() => setMobileFilterOpen(false)} className="p-1 cursor-pointer">
                <X className="h-5 w-5 text-stone" />
              </button>
            </div>
            <div className="p-4">
              {sidebarContent}
            </div>
            <div className="sticky bottom-0 p-4 border-t border-noir-600/10 bg-ivory">
              <button onClick={() => setMobileFilterOpen(false)}
                className="w-full py-2.5 rounded-lg bg-gold text-noir font-semibold text-sm hover:bg-gold-hover transition cursor-pointer">
                Áp dụng ({filteredProducts.length} sản phẩm)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
