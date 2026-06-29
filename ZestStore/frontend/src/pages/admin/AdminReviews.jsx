import { useState, useEffect } from 'react'
import { getAllReviews, deleteReview, restoreReview } from '../../api/admin'
import { Search, Trash2, Star, RotateCcw, Filter, X, MessageSquare, Eye, EyeOff, BarChart3, ShoppingBag } from 'lucide-react'

const STATUS = { ALL: 'all', ACTIVE: 'active', DELETED: 'deleted' }
const PAGE_SIZE = 15

export default function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [search, setSearch] = useState('')
  const [starFilter, setStarFilter] = useState(0)
  const [statusFilter, setStatusFilter] = useState(STATUS.ALL)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [detailReview, setDetailReview] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)

  const load = () => getAllReviews().then(setReviews).catch(() => setError('Không thể tải đánh giá'))
  useEffect(() => { load() }, [])

  const filtered = reviews.filter((r) => {
    const matchSearch = !search || (r.sanPham || '').toLowerCase().includes(search.toLowerCase()) || (r.khachHang || '').toLowerCase().includes(search.toLowerCase()) || (r.email || '').toLowerCase().includes(search.toLowerCase())
    const matchStar = starFilter === 0 || r.soSao === starFilter
    const matchStatus = statusFilter === STATUS.ALL || (statusFilter === STATUS.DELETED && r.ngayXoa) || (statusFilter === STATUS.ACTIVE && !r.ngayXoa)
    return matchSearch && matchStar && matchStatus
  })

  const handleDelete = async () => {
    if (!confirmDelete) return
    try { await deleteReview(confirmDelete); setError(''); setConfirmDelete(null); load() }
    catch { setError('Xóa thất bại'); setConfirmDelete(null) }
  }

  useEffect(() => { setPage(0) }, [search, starFilter, statusFilter])
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const handleRestore = async (id) => {
    try { await restoreReview(id); setError(''); load() }
    catch { setError('Khôi phục thất bại') }
  }

  const stats = {
    total: reviews.length,
    active: reviews.filter(r => !r.ngayXoa).length,
    deleted: reviews.filter(r => r.ngayXoa).length,
    avgRating: reviews.filter(r => !r.ngayXoa).length > 0
      ? (reviews.filter(r => !r.ngayXoa).reduce((s, r) => s + r.soSao, 0) / reviews.filter(r => !r.ngayXoa).length).toFixed(1)
      : '—',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý đánh giá</h1>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Tổng số</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Eye className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              <p className="text-xs text-gray-500">Đang hiển thị</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <EyeOff className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.deleted}</p>
              <p className="text-xs text-gray-500">Đã ẩn</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Star className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.avgRating}</p>
              <p className="text-xs text-gray-500">Trung bình sao</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm đánh giá..." className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div className="w-px h-6 bg-gray-200" />
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setStarFilter(starFilter === s ? 0 : s)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition ${starFilter === s ? 'bg-amber-400 text-white border-amber-400 font-semibold shadow-sm' : 'text-gray-500 hover:bg-gray-50 border-gray-200'}`}>
                  {s === 0 ? 'Tất cả' : <span className="flex items-center gap-0.5">{s}<Star className="h-3 w-3 fill-current" /></span>}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              {[
                { value: STATUS.ALL, label: 'Tất cả' },
                { value: STATUS.ACTIVE, label: 'Đang hiển thị' },
                { value: STATUS.DELETED, label: 'Đã ẩn' },
              ].map((s) => (
                <button key={s.value} onClick={() => setStatusFilter(s.value)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                    statusFilter === s.value
                      ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-sm'
                      : 'text-gray-500 hover:bg-gray-50 border-gray-200'
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <span className="text-xs text-gray-400">{filtered.length} kết quả</span>
        </div>

        {error && <div className="bg-red-50 border-b border-red-200 text-red-700 text-sm px-4 py-3 flex items-center gap-2"><X className="h-4 w-4" />{error}</div>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Sản phẩm</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Khách hàng</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Đánh giá</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Nội dung</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Ngày tạo</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.map((r) => (
                <tr key={r.maDanhGia} className={`hover:bg-gray-50/50 transition cursor-pointer ${r.ngayXoa ? 'opacity-50' : ''}`} onClick={() => setDetailReview(r)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5 cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedProduct(r) }}>
                      {r.hinhAnh && (
                        <img src={r.hinhAnh} alt="" className="w-8 h-8 rounded-lg object-cover bg-gray-50 shrink-0" />
                      )}
                      <span className="font-medium text-gray-800 truncate max-w-[180px] hover:text-blue-700 transition">{r.sanPham}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{r.khachHang}</p>
                    <p className="text-xs text-gray-400">{r.email}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < r.soSao ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-[220px]">
                    <p className="text-gray-600 truncate">{r.binhLuan || <span className="text-gray-300 italic">—</span>}</p>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500 text-xs">
                    {r.ngayTao ? new Date(r.ngayTao).toLocaleDateString('vi-VN') : '-'}
                  </td>
                  <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                    {r.ngayXoa ? (
                      <button onClick={() => handleRestore(r.maDanhGia)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Khôi phục">
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    ) : (
                      <button onClick={() => setConfirmDelete(r.maDanhGia)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Xóa">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Không có đánh giá nào</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100">
            <button disabled={page === 0} onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition">← Trước</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)}
                className={`w-8 h-8 text-xs rounded-lg border transition ${
                  i === page
                    ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-sm'
                    : 'text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}>{i + 1}</button>
            ))}
            <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition">Sau →</button>
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full mx-4 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2">Xác nhận xóa</h3>
            <p className="text-sm text-gray-600 mb-5">Đánh giá này sẽ bị ẩn khỏi trang sản phẩm. Bạn có thể khôi phục sau.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 border rounded-xl text-sm font-medium hover:bg-gray-50 transition">Hủy</button>
              <button onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition shadow-sm">Xóa</button>
            </div>
          </div>
        </div>
      )}

      {selectedProduct && (() => {
        const p = selectedProduct
        return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4" onClick={() => setSelectedProduct(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full animate-scale-in shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="relative">
              <img src={p.hinhAnh} alt={p.sanPham} className="w-full h-72 object-cover object-center bg-gray-100"
                onError={(e) => { e.target.src = 'https://placehold.co/600x400/e2e8f0/475569?text=Polo' }} />
              <button onClick={() => setSelectedProduct(null)} className="absolute top-3 right-3 bg-white/90 rounded-full p-1.5 hover:bg-white transition shadow-sm">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <h3 className="font-bold text-lg">{p.sanPham}</h3>
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < p.soSao ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                ))}
                <span className="text-sm text-gray-500">{p.soSao}/5</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-700">
                  Đánh giá: <span className="font-medium">{p.khachHang}</span>
                </span>
                {p.ngayTao && (
                  <span className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-700">
                    {new Date(p.ngayTao).toLocaleDateString('vi-VN')}
                  </span>
                )}
              </div>
              {(p.slug || p.maSanPham) && (
                <a href={`/products/${p.slug || p.maSanPham}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-700 font-medium hover:underline mt-1">
                  Xem chi tiết sản phẩm →
                </a>
              )}
            </div>
          </div>
        </div>
      )})()}

      {detailReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDetailReview(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full mx-4 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Chi tiết đánh giá</h3>
              <button onClick={() => setDetailReview(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm">
                  {detailReview.khachHang?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{detailReview.khachHang}</p>
                  <p className="text-xs text-gray-400">{detailReview.email}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Sản phẩm</p>
                <p className="font-medium text-gray-800 cursor-pointer hover:text-blue-700 transition" onClick={() => { setDetailReview(null); setSelectedProduct(detailReview) }}>{detailReview.sanPham}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Đánh giá</p>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-5 w-5 ${i < detailReview.soSao ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-500">{detailReview.soSao}/5</span>
                </div>
              </div>
              {detailReview.binhLuan && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Nội dung</p>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3.5 border border-gray-50 leading-relaxed">{detailReview.binhLuan}</p>
                </div>
              )}
              <div className="flex items-center gap-4 text-xs text-gray-400 pt-2 border-t border-gray-100">
                <span>Ngày: {detailReview.ngayTao ? new Date(detailReview.ngayTao).toLocaleDateString('vi-VN') : '-'}</span>
                {detailReview.ngayXoa && <span className="text-red-400">Đã xóa: {new Date(detailReview.ngayXoa).toLocaleDateString('vi-VN')}</span>}
              </div>
            </div>
            <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
              {detailReview.ngayXoa ? (
                <button onClick={() => { handleRestore(detailReview.maDanhGia); setDetailReview(null) }}
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition shadow-sm flex items-center justify-center gap-1.5">
                  <RotateCcw className="h-4 w-4" /> Khôi phục
                </button>
              ) : (
                <button onClick={() => { setConfirmDelete(detailReview.maDanhGia); setDetailReview(null) }}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition shadow-sm flex items-center justify-center gap-1.5">
                  <Trash2 className="h-4 w-4" /> Xóa đánh giá
                </button>
              )}
              <button onClick={() => setDetailReview(null)}
                className="flex-1 py-2.5 border rounded-xl text-sm font-medium hover:bg-gray-50 transition">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
