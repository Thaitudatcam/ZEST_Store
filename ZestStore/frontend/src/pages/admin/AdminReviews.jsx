import { useState, useEffect } from 'react'
import { getAllReviews, deleteReview, restoreReview } from '../../api/admin'
import { Search, Trash2, Star, RotateCcw, Filter } from 'lucide-react'

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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Quản lý đánh giá</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm đánh giá..." className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Filter className="h-4 w-4 text-gray-400" />
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => setStarFilter(starFilter === s ? 0 : s)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition ${starFilter === s ? 'bg-amber-400 text-white border-amber-400' : 'hover:bg-gray-100'}`}>
              {s === 0 ? 'Tất cả' : <span className="flex items-center gap-0.5">{s}<Star className="h-3 w-3 fill-current" /></span>}
            </button>
          ))}
        </div>
        <div className="w-px h-6 bg-gray-200" />
        <div className="flex gap-1">
          {[
            { value: STATUS.ALL, label: 'Tất cả' },
            { value: STATUS.ACTIVE, label: 'Hoạt động' },
            { value: STATUS.DELETED, label: 'Đã xóa' },
          ].map((s) => (
            <button key={s.value} onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition ${statusFilter === s.value ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2 mb-4">{error}</div>}

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Sản phẩm</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Khách hàng</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Sao</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Bình luận</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Ngày</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paged.map((r) => (
                <tr key={r.maDanhGia} className={`hover:bg-gray-50 ${r.ngayXoa ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3 font-medium">{r.sanPham}</td>
                  <td className="px-4 py-3">{r.khachHang}<br /><span className="text-xs text-gray-400">{r.email}</span></td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < r.soSao ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-[250px] truncate text-gray-600">{r.binhLuan || '-'}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{r.ngayTao ? new Date(r.ngayTao).toLocaleDateString('vi-VN') : '-'}</td>
                  <td className="px-4 py-3 text-center">
                    {r.ngayXoa ? (
                      <button onClick={() => handleRestore(r.maDanhGia)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Khôi phục">
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    ) : (
                      <button onClick={() => setConfirmDelete(r.maDanhGia)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Xóa">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-center text-gray-500 py-8">Không có đánh giá nào</p>}
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
            <h3 className="font-bold text-lg mb-2">Xác nhận</h3>
            <p className="text-sm text-gray-600 mb-4">Xóa đánh giá này?</p>
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
