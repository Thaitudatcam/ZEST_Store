import { useState, useEffect } from 'react'
import { getAllReviews, deleteReview, restoreReview } from '../../api/admin'
import { Search, Trash2, Star, RotateCcw, X, MessageSquare, Eye, EyeOff } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog'

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
  const [confirmRestore, setConfirmRestore] = useState(null)
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
    setConfirmRestore(null)
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
        <div className="bg-ivory rounded-xl border border-stone/10 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold/20 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{stats.total}</p>
              <p className="text-xs text-stone">Tổng số</p>
            </div>
          </div>
        </div>
        <div className="bg-ivory rounded-xl border border-stone/10 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-deep/20 rounded-lg flex items-center justify-center">
              <Eye className="h-5 w-5 text-emerald-deep" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{stats.active}</p>
              <p className="text-xs text-stone">Đang hiển thị</p>
            </div>
          </div>
        </div>
        <div className="bg-ivory rounded-xl border border-stone/10 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-bordeaux/20 rounded-lg flex items-center justify-center">
              <EyeOff className="h-5 w-5 text-bordeaux" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{stats.deleted}</p>
              <p className="text-xs text-stone">Đã ẩn</p>
            </div>
          </div>
        </div>
        <div className="bg-ivory rounded-xl border border-stone/10 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold/20 rounded-lg flex items-center justify-center">
              <Star className="h-5 w-5 text-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{stats.avgRating}</p>
              <p className="text-xs text-stone">Trung bình sao</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-ivory rounded-2xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b border-stone/10 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm đánh giá..." className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent" />
            </div>
            <div className="w-px h-6 bg-ivory-100" />
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setStarFilter(starFilter === s ? 0 : s)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition ${starFilter === s ? 'bg-gold text-noir border-gold/40 font-semibold shadow-sm' : 'text-stone hover:bg-ivory-100 border-stone/20'}`}>
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
                      ? 'bg-gold text-noir border-gold font-semibold shadow-sm'
                      : 'text-stone hover:bg-ivory-100 border-stone/20'
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <span className="text-xs text-stone">{filtered.length} kết quả</span>
        </div>

        {error && <div className="bg-bordeaux/10 border-b border-bordeaux/20 text-bordeaux text-sm px-4 py-3 flex items-center gap-2"><X className="h-4 w-4" />{error}</div>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ivory-100 border-b border-stone/10">
                <th className="text-left px-4 py-3 font-semibold text-stone text-xs uppercase tracking-wider">Sản phẩm</th>
                <th className="text-left px-4 py-3 font-semibold text-stone text-xs uppercase tracking-wider">Khách hàng</th>
                <th className="text-center px-4 py-3 font-semibold text-stone text-xs uppercase tracking-wider">Đánh giá</th>
                <th className="text-left px-4 py-3 font-semibold text-stone text-xs uppercase tracking-wider">Nội dung</th>
                <th className="text-center px-4 py-3 font-semibold text-stone text-xs uppercase tracking-wider">Ngày tạo</th>
                <th className="text-center px-4 py-3 font-semibold text-stone text-xs uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.map((r) => (
                <tr key={r.maDanhGia} className={`hover:bg-ivory-100/50 transition cursor-pointer ${r.ngayXoa ? 'opacity-50' : ''}`} onClick={() => setDetailReview(r)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5 cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedProduct(r) }}>
                      {r.hinhAnh && (
                        <img src={r.hinhAnh} alt="" className="w-8 h-8 rounded-lg object-cover bg-ivory-100 shrink-0" />
                      )}
                      <span className="font-medium text-ink truncate max-w-[180px] hover:text-gold transition">{r.sanPham}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{r.khachHang}</p>
                    <p className="text-xs text-stone">{r.email}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < r.soSao ? 'text-gold fill-amber-400' : 'text-stone'}`} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-[220px]">
                    <p className="text-stone truncate">{r.binhLuan || <span className="text-stone italic">—</span>}</p>
                  </td>
                  <td className="px-4 py-3 text-center text-stone text-xs">
                    {r.ngayTao ? new Date(r.ngayTao).toLocaleDateString('vi-VN') : '-'}
                  </td>
                  <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                    {r.ngayXoa ? (
                      <button onClick={() => setConfirmRestore(r.maDanhGia)} className="p-2 text-emerald-deep hover:bg-emerald-deep/10 rounded-lg transition" title="Khôi phục">
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    ) : (
                      <button onClick={() => setConfirmDelete(r.maDanhGia)} className="p-2 text-bordeaux hover:text-bordeaux hover:bg-bordeaux/10 rounded-lg transition" title="Xóa">
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
          <div className="text-center py-12 text-stone">
            <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Không có đánh giá nào</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-stone/10">
            <button disabled={page === 0} onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 text-xs border rounded-lg hover:bg-ivory-100 disabled:opacity-30 disabled:cursor-not-allowed transition">← Trước</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)}
                className={`w-8 h-8 text-xs rounded-lg border transition ${
                  i === page
                    ? 'bg-gold text-noir border-gold font-semibold shadow-sm'
                    : 'text-stone border-stone/20 hover:bg-ivory-100'
                }`}>{i + 1}</button>
            ))}
            <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 text-xs border rounded-lg hover:bg-ivory-100 disabled:opacity-30 disabled:cursor-not-allowed transition">Sau →</button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Xác nhận xóa"
        message="Đánh giá này sẽ bị ẩn khỏi trang sản phẩm. Bạn có thể khôi phục sau."
        confirmText="Xóa"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
      <ConfirmDialog
        open={confirmRestore !== null}
        title="Khôi phục đánh giá"
        message="Bạn có chắc muốn khôi phục đánh giá này?"
        confirmText="Khôi phục"
        variant="gold"
        onConfirm={() => handleRestore(confirmRestore)}
        onCancel={() => setConfirmRestore(null)}
      />

      {selectedProduct && (() => {
        const p = selectedProduct
        return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4" onClick={() => setSelectedProduct(null)}>
          <div className="bg-ivory rounded-2xl max-w-lg w-full animate-scale-in shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="relative">
              <img src={p.hinhAnh} alt={p.sanPham} className="w-full h-72 object-cover object-center bg-ivory-100"
                onError={(e) => { e.target.src = 'https://placehold.co/600x400/e2e8f0/475569?text=Polo' }} />
              <button onClick={() => setSelectedProduct(null)} className="absolute top-3 right-3 bg-ivory/90 rounded-full p-1.5 hover:bg-ivory transition shadow-sm">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <h3 className="font-bold text-lg">{p.sanPham}</h3>
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < p.soSao ? 'text-gold fill-amber-400' : 'text-stone'}`} />
                ))}
                <span className="text-sm text-stone">{p.soSao}/5</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="bg-ivory-100 px-3 py-1 rounded-full text-xs text-ink-soft">
                  Đánh giá: <span className="font-medium">{p.khachHang}</span>
                </span>
                {p.ngayTao && (
                  <span className="bg-ivory-100 px-3 py-1 rounded-full text-xs text-ink-soft">
                    {new Date(p.ngayTao).toLocaleDateString('vi-VN')}
                  </span>
                )}
              </div>
              {(p.slug || p.maSanPham) && (
                <a href={`/products/${p.slug || p.maSanPham}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-gold font-medium hover:underline mt-1">
                  Xem chi tiết sản phẩm →
                </a>
              )}
            </div>
          </div>
        </div>
      )})()}

      {detailReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDetailReview(null)}>
          <div className="bg-ivory rounded-2xl max-w-lg w-full mx-4 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Chi tiết đánh giá</h3>
              <button onClick={() => setDetailReview(null)} className="text-stone hover:text-stone text-xl leading-none">&times;</button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-stone/10">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm">
                  {detailReview.khachHang?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-semibold text-ink">{detailReview.khachHang}</p>
                  <p className="text-xs text-stone">{detailReview.email}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-stone uppercase tracking-wider font-semibold mb-1">Sản phẩm</p>
                <p className="font-medium text-ink cursor-pointer hover:text-gold transition" onClick={() => { setDetailReview(null); setSelectedProduct(detailReview) }}>{detailReview.sanPham}</p>
              </div>
              <div>
                <p className="text-xs text-stone uppercase tracking-wider font-semibold mb-1">Đánh giá</p>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-5 w-5 ${i < detailReview.soSao ? 'text-gold fill-amber-400' : 'text-stone'}`} />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-stone">{detailReview.soSao}/5</span>
                </div>
              </div>
              {detailReview.binhLuan && (
                <div>
                  <p className="text-xs text-stone uppercase tracking-wider font-semibold mb-1">Nội dung</p>
                  <p className="text-sm text-stone bg-ivory-100 rounded-xl p-3.5 border border-stone/5 leading-relaxed">{detailReview.binhLuan}</p>
                </div>
              )}
              <div className="flex items-center gap-4 text-xs text-stone pt-2 border-t border-stone/10">
                <span>Ngày: {detailReview.ngayTao ? new Date(detailReview.ngayTao).toLocaleDateString('vi-VN') : '-'}</span>
                {detailReview.ngayXoa && <span className="text-bordeaux">Đã xóa: {new Date(detailReview.ngayXoa).toLocaleDateString('vi-VN')}</span>}
              </div>
            </div>
            <div className="flex gap-3 mt-5 pt-4 border-t border-stone/10">
              {detailReview.ngayXoa ? (
                <button onClick={() => { setConfirmRestore(detailReview.maDanhGia); setDetailReview(null) }}
                  className="flex-1 py-2.5 bg-emerald-deep text-white rounded-xl text-sm font-medium hover:bg-emerald-deep transition shadow-sm flex items-center justify-center gap-1.5">
                  <RotateCcw className="h-4 w-4" /> Khôi phục
                </button>
              ) : (
                <button onClick={() => { setConfirmDelete(detailReview.maDanhGia); setDetailReview(null) }}
                  className="flex-1 py-2.5 bg-bordeaux text-noir rounded-xl text-sm font-medium hover:bg-bordeaux transition shadow-sm flex items-center justify-center gap-1.5">
                  <Trash2 className="h-4 w-4" /> Xóa đánh giá
                </button>
              )}
              <button onClick={() => setDetailReview(null)}
                className="flex-1 py-2.5 border rounded-xl text-sm font-medium hover:bg-ivory-100 transition">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
