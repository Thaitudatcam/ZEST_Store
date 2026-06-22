import { useState, useEffect } from 'react'
import { getProducts } from '../api/products'
import ProductCard from '../components/ProductCard'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProducts({ page: 0, size: 8, sortBy: 'ngayTao', sortDir: 'desc' })
      .then((data) => setProducts(data.content ?? data ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <section className="bg-gradient-to-br from-blue-700 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Polo Nam Cao Cấp</h1>
          <p className="text-lg text-blue-200 mb-8">Chất liệu cao cấp, thiết kế hiện đại, phong cách trẻ trung</p>
          <a href="/products" className="inline-block bg-white text-blue-700 font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition">Khám phá ngay</a>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">Sản phẩm mới nhất</h2>
        {loading ? <LoadingSpinner className="py-12" /> : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((p) => <ProductCard key={p.maSanPham} product={p} />)}
          </div>
        )}
      </section>
    </div>
  )
}
