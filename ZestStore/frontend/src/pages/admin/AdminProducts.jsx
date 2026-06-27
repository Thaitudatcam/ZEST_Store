import { useState, useEffect, useRef } from 'react'
import { getProducts } from '../../api/products'
import { toggleProductStatus } from '../../api/admin'
import { searchSuggestions } from '../../api/products'
import api from '../../api/axios'
import { Plus, Pencil, Trash2, Search, Eye, EyeOff, Loader } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import SafeImg from '../../components/SafeImg'

const PAGE_SIZE = 15

export default function AdminProducts() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [error, setError] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef(null)
  const debounceRef = useRef(null)

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

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await api.delete(`/products/${confirmDelete}`)
      setConfirmDelete(null)
      load(page, search)
    } catch {}
  }

  const handleToggle = async (id) => {
    try {
      await toggleProductStatus(id)
      load(page, search)
    } catch {}
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sản phẩm</h1>
        <Link to="/admin/products/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Thêm sản phẩm
        </Link>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2 mb-4">{error}</div>}

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative max-w-xs" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={search} onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
              placeholder="Tìm sản phẩm..." className="pl-9 pr-10 py-2 border rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {searchLoading && <Loader className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white border rounded-xl shadow-lg z-50 py-2 max-h-72 overflow-y-auto">
                {suggestions.map((p) => (
                  <button key={p.maSanPham} onClick={() => { setShowSuggestions(false); setSearch(''); navigate(`/admin/products/${p.maSanPham}/edit`) }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-blue-50 transition text-left">
                    <SafeImg src={p.urlAnhDaiDien} className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0" fallback="https://placehold.co/40x40/e2e8f0/475569?text=P" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.tenSanPham}</p>
                      <p className="text-xs text-blue-700 font-semibold">{VND(p.tongGiaTri || 0)}</p>
                    </div>
                    {p.tongTonKho === 0 && <span className="text-[10px] text-red-500 font-semibold shrink-0">Hết hàng</span>}
                  </button>
                ))}
                <div className="border-t mt-1 pt-1">
                  <button onClick={() => { setShowSuggestions(false); load(0, search) }}
                    className="w-full text-left px-4 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 transition">
                    Xem tất cả kết quả "{search}"
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Sản phẩm</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Danh mục</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Tổng tiền</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Trạng thái</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p) => (
                <tr key={p.maSanPham} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <SafeImg src={p.urlAnhDaiDien} className="w-10 h-10 rounded-lg object-cover bg-gray-100" fallback="https://placehold.co/40x40/e2e8f0/475569?text=P" />
                      <span className="font-medium truncate max-w-[200px]">{p.tenSanPham}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.danhMuc?.tenDanhMuc || '-'}</td>
                  <td className="px-4 py-3 text-right font-semibold">{VND(p.tongGiaTri ?? 0)}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleToggle(p.maSanPham)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
                        p.trangThai === 1
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200'
                          : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                      }`}>
                      {p.trangThai === 1 ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {p.trangThai === 1 ? 'Hiện' : 'Ẩn'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      <Link to={`/admin/products/${p.maSanPham}/edit`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="h-4 w-4" /></Link>
                      <button onClick={() => setConfirmDelete(p.maSanPham)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {products.length === 0 && <p className="text-center text-gray-500 py-8">Không có sản phẩm</p>}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t">
            <button disabled={page === 0} onClick={() => setPage(page - 1)} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-100 disabled:opacity-40">Trước</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)} className={`px-3 py-1.5 text-xs rounded-lg border ${i === page ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100'}`}>{i + 1}</button>
            ))}
            <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-100 disabled:opacity-40">Sau</button>
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2">Xác nhận xóa</h3>
            <p className="text-sm text-gray-600 mb-4">Bạn chắc chắn muốn xóa sản phẩm này?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 border rounded-xl text-sm font-medium hover:bg-gray-50">Hủy</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function VND(n) { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }
