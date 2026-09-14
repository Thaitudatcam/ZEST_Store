import { useState, useEffect, useRef } from 'react'
import { Search, ScanBarcode, Loader } from 'lucide-react'
import ProductCard from './ProductCard'

export default function ProductGrid({ products, loading, cart, onAdd, onQtyChange, onScanCamera, onSearch, search, onCategoryChange, categories, categoryId }) {
  const searchRef = useRef(null)
  const debounceRef = useRef(null)
  const [localSearch, setLocalSearch] = useState(search || '')

  useEffect(() => {
    setLocalSearch(search || '')
  }, [search])

  const handleSearch = (val) => {
    setLocalSearch(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onSearch(val), 300)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSearch(localSearch)
    }
  }

  const getCartQty = (v) => cart.filter(c => c.maBienThe === v.maBienThe).reduce((s, c) => s + c.soLuong, 0)

  return (
    <div className="flex-1 flex flex-col bg-ivory rounded-2xl border border-stone/10 overflow-hidden">
      <div className="p-4 border-b border-stone/10 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-stone" />
          <input ref={searchRef} value={localSearch} onChange={e => handleSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tìm sản phẩm hoặc nhập mã SKU..."
            className="w-full pl-11 pr-4 py-3 border border-stone/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent bg-white shadow-sm" />
        </div>
        <button onClick={onScanCamera}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[var(--primary-color)] text-[var(--primary-color)] rounded-xl text-sm font-semibold hover:bg-[var(--primary-bg)] transition">
          <ScanBarcode className="h-5 w-5" /> Quét mã bằng camera
        </button>
        <select value={categoryId} onChange={e => onCategoryChange(e.target.value)}
          className="w-full border border-stone/20 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]">
          <option value="">Tất cả danh mục</option>
          {categories.map(c => (
            <option key={c.maDanhMuc} value={c.maDanhMuc}>{c.tenDanhMuc}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="h-6 w-6 text-stone animate-spin" />
            <span className="ml-2 text-sm text-stone">Đang tải...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-stone">
            <p className="text-sm">Không tìm thấy sản phẩm</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
            {products.map(p => (
              <ProductCard key={p.maSanPham} variant={p} mode="grid"
                cartQty={getCartQty(p)} onAdd={onAdd} onQtyChange={onQtyChange} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
