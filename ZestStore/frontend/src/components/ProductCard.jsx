import { Link } from 'react-router-dom'
import SafeImg from './SafeImg'

const VND = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

export default function ProductCard({ product }) {
  const price = product.giaTrungBinh ?? (product.bienThes?.[0]?.gia ?? 0)
  const slug = product.slug || product.maSanPham

  return (
    <Link to={`/products/${slug}`} className="group bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition">
      <div className="aspect-square bg-gray-100 overflow-hidden">
        <SafeImg src={product.urlAnhDaiDien} alt={product.tenSanPham} className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-300" />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-sm text-gray-800 truncate">{product.tenSanPham}</h3>
        <p className="text-blue-700 font-bold mt-1">{VND(price)}</p>
      </div>
    </Link>
  )
}

export { VND }