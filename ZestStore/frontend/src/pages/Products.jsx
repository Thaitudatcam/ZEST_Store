import { useState, useEffect } from 'react'
import { getProducts } from '../api/products'
import { getActiveCategories } from '../api/categories'
import ProductCard from '../components/ProductCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { Search } from 'lucide-react'

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [catId, setCatId] = useState('')
  const [page, setPage] = useState(0)

  useEffect(() => {
    getActiveCategories().then((d) => setCategories(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = { page, size: 12, sortBy: 'ngayTao', sortDir: 'desc' }
    if (keyword) params.keyword = keyword
    if (catId) params.categoryId = catId
    getProducts(params).then((data) => setProducts(data.content ?? data ?? [])).finally(() => setLoading(false))
  }, [keyword, catId, page])

  const handleSearch = (e) => { e.preventDefault(); setPage(0) }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm sản phẩm..." className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold" />
          <button type="submit" className="bg-gold text-noir px-4 py-2 rounded-lg hover:bg-gold-hover"><Search className="h-5 w-5" /></button>
        </form>
        <select value={catId} onChange={(e) => { setCatId(e.target.value); setPage(0) }} className="border rounded-lg px-4 py-2">
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => <option key={c.maDanhMuc} value={c.maDanhMuc}>{c.tenDanhMuc}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner className="py-12" /> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => <ProductCard key={p.maSanPham} product={p} />)}
          </div>
          {products.length === 0 && <p className="text-center text-stone py-12">Không tìm thấy sản phẩm</p>}
          <div className="flex justify-center gap-2 mt-8">
            {page > 0 && <button onClick={() => setPage(page - 1)} className="px-4 py-2 border rounded-lg hover:bg-ivory-100">Trước</button>}
            <button onClick={() => setPage(page + 1)} className="px-4 py-2 border rounded-lg hover:bg-ivory-100">Sau</button>
          </div>
        </>
      )}
    </div>
  )
}
