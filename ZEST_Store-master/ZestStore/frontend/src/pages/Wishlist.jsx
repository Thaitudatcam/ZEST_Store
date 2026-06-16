import { useState, useEffect } from 'react'
import { getWishlist, removeWishlist } from '../api/wishlist'
import ProductCard from '../components/ProductCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Wishlist() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { getWishlist().then(setItems).finally(() => setLoading(false)) }, [])

  if (loading) return <LoadingSpinner className="py-20" />

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Sản phẩm yêu thích</h1>
      {items.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Heart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p>Chưa có sản phẩm yêu thích</p>
          <Link to="/products" className="text-blue-700 font-semibold hover:underline mt-2 inline-block">Khám phá ngay</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((i) => (
            <div key={i.maSanPham} className="relative">
              <button onClick={() => { removeWishlist(i.maSanPham); setItems(items.filter((x) => x.maSanPham !== i.maSanPham)) }} className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow z-10 text-red-400 hover:text-red-600"><Heart className="h-4 w-4 fill-red-400" /></button>
              <ProductCard product={i} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
