import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { Plus, Pencil, Trash2, Search, AlertTriangle, ArrowUpDown, Copy, Download, CheckCheck, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import SafeImg from '../../components/SafeImg'
import LoadingSpinner from '../../components/LoadingSpinner'
import Toast from '../../components/Toast'

const PAGE_SIZE = 15

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [sortBy, setSortBy] = useState('ngayTao')
  const [sortDir, setSortDir] = useState('desc')
  const [selected, setSelected] = useState([])
  const [busy, setBusy] = useState(false)

  const load = (pg, q, sb, sd) => {
    setLoading(true); setError('')
    const params = { page: pg, size: PAGE_SIZE, sortBy: sb || sortBy, sortDir: sd || sortDir }
    if (q) params.keyword = q
    api.get('/products/admin', { params }).then((r) => {
      const d = r.data
      setProducts(d.content ?? d ?? [])
      setTotalPages(d.totalPages || 1)
      setSelected([])
    })
      .catch(() => setError('Không thể tải danh sách sản phẩm'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(page, search, sortBy, sortDir) }, [page, sortBy, sortDir])

  const handleSearch = (val) => {
    setSearch(val)
    setPage(0)
    load(0, val, sortBy, sortDir)
  }

  const handleSort = (col) => {
    if (sortBy === col) {
      const newDir = sortDir === 'desc' ? 'asc' : 'desc'
      setSortDir(newDir)
      load(page, search, col, newDir)
    } else {
      setSortBy(col)
      setSortDir('desc')
      load(page, search, col, 'desc')
    }
  }

  const handleToggleStatus = async (id) => {
    if (!confirm('Bạn có chắc muốn thay đổi trạng thái sản phẩm này?')) return
    try {
      const res = await api.put(`/products/${id}/status`)
      setProducts((prev) => prev.map((p) =>
        p.maSanPham === id ? { ...p, trangThai: res.data.trangThai } : p
      ))
    } catch { setToast({ type: 'error', message: 'Lỗi thay đổi trạng thái' }) }
  }

  const sortLabel = (col) => {
    if (sortBy !== col) return ''
    if (col === 'trangThai') return sortDir === 'asc' ? ' ↑ Ngừng bán' : ' ↓ Đang bán'
    return sortDir === 'asc' ? ' ↑ Tăng dần' : ' ↓ Giảm dần'
  }

  const sortIcon = (col) => (
    <span className={`inline-flex items-center gap-0.5 ml-1 transition-colors ${sortBy === col ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
      <ArrowUpDown className={`h-3.5 w-3.5 ${sortBy === col && sortDir === 'asc' ? 'rotate-180' : ''}`} />
      {sortBy === col && <span className="text-[11px]">{col === 'trangThai' ? (sortDir === 'asc' ? 'Ngừng bán' : 'Đang bán') : (sortDir === 'asc' ? 'Tăng dần' : 'Giảm dần')}</span>}
    </span>
  )

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await api.delete(`/products/${confirmDelete}`)
      setConfirmDelete(null)
      setToast({ type: 'success', message: 'Xóa sản phẩm thành công' })
      load(page, search)
    } catch { setToast({ type: 'error', message: 'Lỗi xóa sản phẩm' }) }
  }

  const toggleSelect = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    if (selected.length === products.length) setSelected([])
    else setSelected(products.map((p) => p.maSanPham))
  }

  const batchToggleStatus = async (status) => {
    if (!selected.length || busy) return
    if (!confirm(`Bạn có chắc muốn ${status === 1 ? 'bật' : 'tắt'} ${selected.length} sản phẩm đã chọn?`)) return
    setBusy(true)
    let ok = 0, fail = 0
    for (const id of selected) {
      try { await api.put(`/products/${id}/status`); ok++ }
      catch { fail++ }
    }
    setToast({ type: fail === 0 ? 'success' : 'error', message: `${ok} thành công${fail ? `, ${fail} lỗi` : ''}` })
    setBusy(false); load(page, search)
  }

  const batchDelete = async () => {
    if (!selected.length || busy) return
    if (!confirm(`Xóa ${selected.length} sản phẩm đã chọn?`)) return
    setBusy(true)
    let ok = 0, fail = 0
    for (const id of selected) {
      try { await api.delete(`/products/${id}`); ok++ }
      catch { fail++ }
    }
    setToast({ type: fail === 0 ? 'success' : 'error', message: `${ok} thành công${fail ? `, ${fail} lỗi` : ''}` })
    setBusy(false); load(page, search)
  }

  const handleDuplicate = async (product) => {
    try {
      const detail = await api.get(`/products/detail/${product.maSanPham}`)
      const p = detail.data.product || detail.data
      const maDanhMuc = product.danhMuc?.maDanhMuc || p.danhMuc?.maDanhMuc
      if (!maDanhMuc) { setToast({ type: 'error', message: 'Sản phẩm gốc thiếu danh mục, không thể nhân bản' }); return }
      const newProduct = await api.post('/products', {
        tenSanPham: `${p.tenSanPham} (Copy)`,
        slug: `${p.slug}-copy-${Date.now()}`,
        moTa: p.moTa || '',
        urlAnhDaiDien: p.urlAnhDaiDien || '',
        maDanhMuc: Number(maDanhMuc),
        trangThai: 0
      })
      const newId = newProduct.data.maSanPham
      const variants = detail.data.variants || []
      if (variants.length > 0) {
        await Promise.all(variants.map((v) =>
          api.post(`/products/${newId}/variants`, {
            sku: `${v.sku}-COPY`, maThuongHieu: v.thuongHieu?.maThuongHieu || v.maThuongHieu,
            maKichCo: v.kichCo?.maKichCo || v.maKichCo, maMauSac: v.mauSac?.maMauSac || v.maMauSac,
            gia: v.gia, tonKho: 0
          })
        ))
      }
      setToast({ type: 'success', message: 'Nhân bản thành công' })
      load(page, search)
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.defaultMessage || 'Lỗi nhân bản sản phẩm'
      setToast({ type: 'error', message })
    }
  }

  const handleExport = () => {
    if (products.length === 0) return
    const headers = ['Tên sản phẩm', 'Danh mục', 'Giá TB', 'Trạng thái']
    const rows = products.map((p) => [
      p.tenSanPham, p.danhMuc?.tenDanhMuc || '',
      p.giaTrungBinh || 0, p.trangThai === 1 ? 'Đang bán' : 'Ngừng bán'
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `san-pham-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
    setToast({ type: 'success', message: 'Xuất file thành công' })
  }

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quản lý sản phẩm</h1>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} title="Xuất danh sách sản phẩm ra file CSV"
            className="border px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 flex items-center gap-2">
            <Download className="h-4 w-4" /> Xuất CSV
          </button>
          <Link to="/admin/products/create" title="Thêm sản phẩm mới"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
            <Plus className="h-4 w-4" /> Thêm sản phẩm
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
          <button onClick={() => load(page, search)} title="Thử tải lại danh sách" className="ml-auto underline font-medium">Thử lại</button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Tìm sản phẩm..." className="pl-9 pr-4 py-2 border rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner className="py-16" size="lg" />
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500">Không có sản phẩm {search ? 'phù hợp' : ''}</p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={products.length > 0 && selected.length === products.length} onChange={toggleSelectAll} title="Chọn tất cả" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">
                  Sản phẩm
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Danh mục</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 cursor-pointer select-none hover:text-blue-600" onClick={() => handleSort('giaTrungBinh')} title={`Sắp xếp theo giá${sortLabel('giaTrungBinh')}`}>
                  Giá TB {sortIcon('giaTrungBinh')}
                </th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 cursor-pointer select-none hover:text-blue-600" onClick={() => handleSort('trangThai')} title={`Sắp xếp theo trạng thái${sortLabel('trangThai')}`}>
                  Trạng thái {sortIcon('trangThai')}
                </th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p) => (
                <tr key={p.maSanPham} className={`hover:bg-gray-50 ${selected.includes(p.maSanPham) ? 'bg-blue-50/50' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.includes(p.maSanPham)} onChange={() => toggleSelect(p.maSanPham)} title={selected.includes(p.maSanPham) ? 'Bỏ chọn' : 'Chọn sản phẩm'} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <SafeImg src={p.urlAnhDaiDien} className="w-10 h-10 rounded-lg object-cover bg-gray-100" fallback="https://placehold.co/40x40/e2e8f0/475569?text=P" />
                      <span className="font-medium truncate max-w-[200px]">{p.tenSanPham}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.danhMuc?.tenDanhMuc || '-'}</td>
                  <td className="px-4 py-3 text-right font-semibold">{VND(p.giaTrungBinh ?? 0)}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleToggleStatus(p.maSanPham)} title="Nhấn để thay đổi trạng thái"
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition-all hover:opacity-80 ${
                        p.trangThai === 1
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                      {p.trangThai === 1 ? 'Đang bán' : 'Ngừng bán'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      <Link to={`/admin/products/${p.maSanPham}/edit`} title="Sửa sản phẩm" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="h-4 w-4" /></Link>
                      <button onClick={() => handleDuplicate(p)} title="Nhân bản sản phẩm" className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"><Copy className="h-4 w-4" /></button>
                      <button onClick={() => setConfirmDelete(p.maSanPham)} title="Xóa sản phẩm" className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t">
            <button disabled={page === 0} onClick={() => setPage(page - 1)} title="Trang trước" className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-100 disabled:opacity-40">Trước</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)} title={`Trang ${i + 1}`} className={`px-3 py-1.5 text-xs rounded-lg border ${i === page ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100'}`}>{i + 1}</button>
            ))}
            <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} title="Trang sau" className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-100 disabled:opacity-40">Sau</button>
          </div>
        )}
      </div>

      {selected.length > 0 && (
        <div className="mb-4 flex items-center gap-3 bg-blue-50 border border-blue-200 px-4 py-3 rounded-xl text-sm">
          <span className="font-medium text-blue-800">Đã chọn <strong>{selected.length}</strong> sản phẩm</span>
          <div className="flex gap-2 ml-auto">
            <button onClick={() => batchToggleStatus(1)} disabled={busy} title="Bật tất cả sản phẩm đã chọn" className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 disabled:opacity-50 flex items-center gap-1">
              <CheckCheck className="h-3.5 w-3.5" /> Bật
            </button>
            <button onClick={() => batchToggleStatus(0)} disabled={busy} title="Tắt tất cả sản phẩm đã chọn" className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs hover:bg-orange-600 disabled:opacity-50 flex items-center gap-1">
              <X className="h-3.5 w-3.5" /> Tắt
            </button>
            <button onClick={batchDelete} disabled={busy} title="Xóa các sản phẩm đã chọn" className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 disabled:opacity-50 flex items-center gap-1">
              <Trash2 className="h-3.5 w-3.5" /> Xóa
            </button>
          </div>
        </div>
      )}

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
