import { useState, useEffect, useRef } from 'react'
import { getProducts } from '../../api/products'
import { toggleProductStatus } from '../../api/admin'
import { searchSuggestions } from '../../api/products'
import { getActiveCategories } from '../../api/categories'
import { getBrands } from '../../api/admin'
import api from '../../api/axios'
import { Plus, Pencil, Trash2, Search, Eye, EyeOff, Loader, Filter, X, SlidersHorizontal } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import SafeImg from '../../components/SafeImg'
import ConfirmDialog from '../../components/ConfirmDialog'

const PAGE_SIZE = 15
const VND = (n) => { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }

export default function AdminProducts() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [confirmToggle, setConfirmToggle] = useState(null)
  const [error, setError] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef(null)
  const debounceRef = useRef(null)

  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [filterCategory, setFilterCategory] = useState('')
  const [filterBrand, setFilterBrand] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriceMin, setFilterPriceMin] = useState('')
  const [filterPriceMax, setFilterPriceMax] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    getActiveCategories().then(setCategories).catch(() => {})
    getBrands().then(setBrands).catch(() => {})
  }, [])

  const load = (pg, q) => {
    api.get('/products/admin/list', { params: { page: pg, size: PAGE_SIZE, ...(q ? { keyword: q } : {}) } })
      .then((r) => r.data).then((d) => {
        setProducts(d.content ?? d ?? [])
        setTotalPages(d.totalPages || 1)
      }).catch(() => setError('Không thể tải sản phẩm'))
  }

  useEffect(() => { load(page, search) }, [page])

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target))
        setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!search.trim()) { setSuggestions([]); setShowSuggestions(false); return }
    const q = search.trim()
    setSearchLoading(true)
    debounceRef.current = setTimeout(() => {
      searchSuggestions(q, 5)
        .then((data) => { if (q === search.trim()) { setSuggestions(data || []); setShowSuggestions(true) } })
        .catch(() => { if (q === search.trim()) setSuggestions([]) })
        .finally(() => { if (q === search.trim()) setSearchLoading(false) })
    }, 300)
  }, [search])

  const handleSearch = (val) => {
    setSearch(val)
    setPage(0)
    load(0, val)
  }

  const handleToggle = async (id) => {
    setConfirmToggle(null)
    try {
      await toggleProductStatus(id)
      load(page, search)
    } catch {}
  }

  const filtered = products.filter(p => {
    if (filterCategory && String(p.danhMuc?.maDanhMuc) !== filterCategory) return false
    if (filterBrand && String(p.maThuongHieu || p.thuongHieu?.maThuongHieu) !== filterBrand) return false
    if (filterStatus === 'active' && p.trangThai !== 1) return false
    if (filterStatus === 'hidden' && p.trangThai !== 0) return false
    const price = Number(p.giaTrungBinh || 0)
    if (filterPriceMin && price < Number(filterPriceMin)) return false
    if (filterPriceMax && price > Number(filterPriceMax)) return false
    return true
  })

  const hasFilter = filterCategory || filterBrand || filterStatus || filterPriceMin || filterPriceMax

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Danh sách sản phẩm</h1>
        <Link to="/admin/products/create" className="bg-[var(--primary-color)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Thêm sản phẩm
        </Link>
      </div>

      {error && <div className="bg-bordeaux/10 border border-bordeaux/20 text-bordeaux text-sm rounded-lg px-4 py-2 mb-4">{error}</div>}

      <div className="bg-ivory rounded-2xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b space-y-3">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-xs" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
              <input value={search} onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
                placeholder="Tìm sản phẩm..." className="pl-9 pr-10 py-2 border rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-gold" />
              {searchLoading && <Loader className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone animate-spin" />}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-ivory border rounded-xl shadow-lg z-50 py-2 max-h-72 overflow-y-auto">
                  {suggestions.map((p) => (
                    <button key={p.maSanPham} onClick={() => { setShowSuggestions(false); setSearch(''); navigate(`/admin/products/${p.maSanPham}/edit`) }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gold/10 transition text-left">
                      <SafeImg src={p.urlAnhDaiDien} className="w-10 h-10 rounded-lg object-cover bg-ivory-100 shrink-0" fallback="https://placehold.co/40x40/e2e8f0/475569?text=P" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.tenSanPham}</p>
                        <p className="text-xs text-gold font-semibold">Tồn: {p.tongTonKho ?? 0}</p>
                      </div>
                      {p.tongTonKho === 0 && <span className="text-[10px] text-bordeaux font-semibold shrink-0">Hết hàng</span>}
                    </button>
                  ))}
                  <div className="border-t mt-1 pt-1">
                    <button onClick={() => { setShowSuggestions(false); load(0, search) }}
                      className="w-full text-left px-4 py-2 text-sm text-gold font-medium hover:bg-gold/10 transition">
                      Xem tất cả kết quả "{search}"
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => setShowFilters(prev => !prev)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition ${showFilters ? 'bg-gold/10 border-gold text-gold' : 'hover:bg-ivory-100'}`}>
              <SlidersHorizontal className="h-4 w-4" /> Bộ lọc
              {hasFilter && <span className="w-2 h-2 bg-gold rounded-full" />}
            </button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-3 items-end pt-2 border-t">
              <div>
                <label className="text-xs text-stone font-medium">Danh mục</label>
                <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(0) }}
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-gold">
                  <option value="">Tất cả</option>
                  {categories.map(c => <option key={c.maDanhMuc} value={c.maDanhMuc}>{c.tenDanhMuc}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-stone font-medium">Thương hiệu</label>
                <select value={filterBrand} onChange={e => { setFilterBrand(e.target.value); setPage(0) }}
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-gold">
                  <option value="">Tất cả</option>
                  {brands.map(b => <option key={b.maThuongHieu} value={b.maThuongHieu}>{b.tenThuongHieu}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-stone font-medium">Trạng thái</label>
                <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(0) }}
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-gold">
                  <option value="">Tất cả</option>
                  <option value="active">Đang bán</option>
                  <option value="hidden">Đã ẩn</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-stone font-medium">Giá từ</label>
                <input type="number" value={filterPriceMin} onChange={e => { setFilterPriceMin(e.target.value); setPage(0) }}
                  placeholder="0" className="w-28 border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-gold" />
              </div>
              <div>
                <label className="text-xs text-stone font-medium">đến</label>
                <input type="number" value={filterPriceMax} onChange={e => { setFilterPriceMax(e.target.value); setPage(0) }}
                  placeholder="∞" className="w-28 border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-gold" />
              </div>
              {hasFilter && (
                <button onClick={() => { setFilterCategory(''); setFilterBrand(''); setFilterStatus(''); setFilterPriceMin(''); setFilterPriceMax(''); setPage(0) }}
                  className="flex items-center gap-1 px-3 py-2 text-xs text-stone hover:text-bordeaux border rounded-lg hover:bg-ivory-100 transition">
                  <X className="h-3 w-3" /> Xóa lọc
                </button>
              )}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ivory-100 border-b">
              <tr>
                <th className="text-center px-3 py-3 font-semibold text-stone w-10">STT</th>
                <th className="text-center px-3 py-3 font-semibold text-stone w-12">Ảnh</th>
                <th className="text-left px-3 py-3 font-semibold text-stone">Mã SP</th>
                <th className="text-left px-3 py-3 font-semibold text-stone">Tên sản phẩm</th>
                <th className="text-left px-3 py-3 font-semibold text-stone">Danh mục</th>
                <th className="text-left px-3 py-3 font-semibold text-stone">Thương hiệu</th>
                <th className="text-right px-3 py-3 font-semibold text-stone">Giá TB</th>
                <th className="text-center px-3 py-3 font-semibold text-stone">Tồn kho</th>
                <th className="text-center px-3 py-3 font-semibold text-stone">Trạng thái</th>
                <th className="text-center px-3 py-3 font-semibold text-stone">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((p, i) => (
                <tr key={p.maSanPham} className="hover:bg-ivory-100">
                  <td className="px-3 py-3 text-center text-xs text-stone">{page * PAGE_SIZE + i + 1}</td>
                  <td className="px-3 py-3 text-center">
                    <div className="relative w-10 h-10 mx-auto">
                      <SafeImg src={p.urlAnhDaiDien} className="w-10 h-10 rounded-lg object-cover bg-ivory-100" fallback="https://placehold.co/40x40/e2e8f0/475569?text=P" />
                      {Number(p.phanTramGiamGia) > 0 && (
                        <span className="absolute -top-1.5 -right-2 bg-bordeaux text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                          -{p.phanTramGiamGia}%
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs font-mono text-stone">SP{String(p.maSanPham).padStart(3, '0')}</td>
                  <td className="px-3 py-3">
                    <span className="font-medium truncate max-w-[200px] block">{p.tenSanPham}</span>
                  </td>
                  <td className="px-3 py-3 text-stone text-xs">{p.danhMuc?.tenDanhMuc || '-'}</td>
                  <td className="px-3 py-3 text-stone text-xs">{p.tenThuongHieu || '-'}</td>
                  <td className="px-3 py-3 text-right text-xs">
                    {Number(p.phanTramGiamGia) > 0 ? (
                      <>
                        <span className="font-bold text-emerald-deep">{VND((p.giaTrungBinh || 0) * (1 - Number(p.phanTramGiamGia) / 100))}</span>
                        <span className="block text-[10px] text-stone line-through">{VND(p.giaTrungBinh || 0)}</span>
                      </>
                    ) : (
                      <span className="font-semibold">{VND(p.giaTrungBinh || 0)}</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${(p.tongTonKho ?? 0) > 0 ? 'bg-emerald-deep/20 text-emerald-deep' : 'bg-bordeaux/20 text-bordeaux'}`}>
                      {p.tongTonKho ?? 0}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <button onClick={() => setConfirmToggle(p.maSanPham)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
                        p.trangThai === 1
                          ? 'bg-emerald-deep/20 text-emerald-deep border-emerald-deep/20 hover:bg-emerald-200'
                          : 'bg-ivory-100 text-stone border-stone/20 hover:bg-ivory-100'
                      }`}>
                      {p.trangThai === 1 ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {p.trangThai === 1 ? 'Hiện' : 'Ẩn'}
                    </button>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      <Link to={`/admin/products/${p.maSanPham}/edit`} className="p-1.5 text-gold hover:bg-gold/10 rounded-lg"><Pencil className="h-4 w-4" /></Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-center text-stone py-8">Không có sản phẩm</p>}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t">
            <button disabled={page === 0} onClick={() => setPage(page - 1)} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-ivory-100 disabled:opacity-40">Trước</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)} className={`px-3 py-1.5 text-xs rounded-lg border ${i === page ? 'bg-gold text-noir border-gold' : 'hover:bg-ivory-100'}`}>{i + 1}</button>
            ))}
            <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-ivory-100 disabled:opacity-40">Sau</button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmToggle !== null}
        title="Đổi trạng thái sản phẩm"
        message={`Bạn có chắc muốn ${products.find(p => p.maSanPham === confirmToggle)?.trangThai === 1 ? 'ẩn' : 'hiện'} sản phẩm này trên website?`}
        confirmText="Xác nhận"
        variant="gold"
        onConfirm={() => handleToggle(confirmToggle)}
        onCancel={() => setConfirmToggle(null)}
      />
    </div>
  )
}
