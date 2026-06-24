import { useState, useEffect } from 'react'
import { getProducts } from '../../api/products'
import api from '../../api/axios'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import SafeImg from '../../components/SafeImg'

const PAGE_SIZE = 15

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const load = (pg, q) => {
    getProducts({ page: pg, size: PAGE_SIZE, ...(q ? { keyword: q } : {}) }).then((d) => {
      setProducts(d.content ?? d ?? [])
      setTotalPages(d.totalPages || 1)
    }).catch(() => {})
  }

  useEffect(() => { load(page, search) }, [page])

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sản phẩm</h1>
        <Link to="/admin/products/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Thêm sản phẩm
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Tìm sản phẩm..." className="pl-9 pr-4 py-2 border rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Sản phẩm</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Danh mục</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Giá TB</th>
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
                  <td className="px-4 py-3 text-right font-semibold">{VND(p.giaTrungBinh ?? 0)}</td>
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