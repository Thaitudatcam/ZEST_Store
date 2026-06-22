import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getProducts } from '../api/products'
import { getCategories } from '../api/categories'
import ProductCard from '../components/ProductCard'
import { Truck, Shield, RefreshCw, Headphones, ArrowRight, ShoppingBag } from 'lucide-react'
import ZS from '../pictures/ZS.png'

const rawStrip = Object.entries(import.meta.glob('../pictures/strip/*.{png,jpg,jpeg,webp}', { eager: true, query: '?url', import: 'default' }))
const stripData = rawStrip
  .filter(([path]) => !path.endsWith('-back.'))
  .map(([path, src]) => ({
    front: src,
    title: path.split('/').pop().replace(/\.[^.]+$/, '')
  }))

export default function Home() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [newsletterEmail, setNewsletterEmail] = useState('')

  useEffect(() => {
    Promise.all([
      getProducts({ page: 0, size: 8, sortBy: 'ngayTao', sortDir: 'desc' }),
      getCategories()
    ]).then(([prodData, catData]) => {
      setProducts(prodData.content ?? prodData ?? [])
      const roots = Array.isArray(catData) ? catData.filter((c) => !c.maDanhMucCha) : []
      setCategories(roots)
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div className="animate-fade-in">

      {/* ──────── HERO ──────── */}
      <section className="relative bg-gradient-to-br  via-blue-500  text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, #fff 0%, transparent 50%), radial-gradient(circle at 75% 50%, #fff 0%, transparent 50%)' }} />
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 text-center md:text-left">
            <span className="inline-block bg-white/80 text-black text-xs font-bold px-3 py-1 rounded-full mb-4">Bộ sưu tập mới 2026</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">Phong cách <br/>Polo đẳng cấp</h2>
            <p className="text-base md:text-lg text-white mb-8 max-w-lg">Chất liệu cotton cao cấp, form chuẩn, đa dạng màu sắc, mang đến sự thoải mái và tự tin cho mọi người.</p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <Link to="/products" className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition shadow-lg">
                <ShoppingBag className="h-5 w-5" /> Mua ngay <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/products" className="inline-flex items-center gap-2 border border-white/40 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/40 transition">
                Xem bộ sưu tập
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 mt-8 text-sm justify-center md:justify-start">
              {[
                { icon: Truck, label: 'Miễn phí vận chuyển' },
                { icon: RefreshCw, label: 'Đổi trả 30 ngày' },
                { icon: Shield, label: 'Chính hãng 100%' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-yellow-300" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="relative w-72 h-72 md:w-96 md:h-96">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/30 to-transparent rounded-full animate-pulse" />
              <img src={ZS} alt="Polo Nam" className="relative w-full h-full object-cover rounded-2xl shadow-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ──────── BRAND VALUES ──────── */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 justify-items-center">
          {[
            { icon: Truck, title: 'Free Ship', desc: 'Đơn hàng từ 299K' },
            { icon: Shield, title: 'Chính hãng', desc: 'Cam kết 100%' },
            { icon: RefreshCw, title: 'Đổi trả', desc: 'Trong 30 ngày' },
            { icon: Headphones, title: 'Hỗ trợ', desc: 'Hotline 24/7' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <Icon className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-800">{title}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

        {stripData.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 py-8">
                <h2 className="text-2xl font-bold mb-6">Bộ sưu tập</h2>
                <div className="flex gap-2 h-[500px] overflow-hidden rounded-xl">
                    {stripData.map((item, i) => (
                        <div key={i}
                              className="group relative flex-1 overflow-hidden rounded-lg transition-all duration-500 hover:flex-[2] cursor-default">
                            <img src={item.front}
                                 className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="absolute bottom-0 left-0 right-0 p-4 text-white translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                <p className="font-bold text-sm drop-shadow-lg">{item.title}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        )}

      {/* ──────── LATEST PRODUCTS ──────── */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Sản phẩm mới nhất</h2>
          <Link to="/products" className="text-sm text-blue-700 font-medium hover:underline flex items-center gap-1">Xem tất cả <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden border">
                <div className="aspect-square skeleton" />
                <div className="p-3 space-y-2">
                  <div className="h-3 w-3/4 skeleton" />
                  <div className="h-4 w-1/3 skeleton" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((p, i) => (
              <div key={p.maSanPham} style={{ animationDelay: `${i * 0.05}s` }} className="animate-fade-in">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ──────── TRENDING ──────── */}
      {products.length > 0 && (
        <section className="bg-blue-50 py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Bán chạy nhất</h2>
              <Link to="/products" className="text-sm text-blue-700 font-medium hover:underline flex items-center gap-1">Xem tất cả <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products.slice(0, 4).map((p, i) => (
                <div key={p.maSanPham} style={{ animationDelay: `${(i + 4) * 0.05}s` }} className="animate-fade-in">
                  <ProductCard product={{ ...p, phanTramGiamGia: 15 }} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ──────── NEWSLETTER ──────── */}
      <section className="bg-gradient-to-r  via-blue-600  text-white py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Đăng ký nhận thông tin</h2>
          <p className="text-white mb-6">Nhận ưu đãi độc quyền và cập nhật sản phẩm mới qua email.</p>
          <form onSubmit={(e) => { e.preventDefault(); setNewsletterEmail('') }} className="flex gap-3 max-w-md mx-auto">
            <input type="email" value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)} placeholder="Email của bạn" required className="flex-1 px-4 py-3 rounded-lg text-black border border-gray-400 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-blue-300" />
            <button type="submit" className="bg-red-500 text-white font-semibold px-6 py-3 rounded-lg  transition shrink-0">Đăng ký</button>
          </form>
        </div>
      </section>

    </div>
  )
}
