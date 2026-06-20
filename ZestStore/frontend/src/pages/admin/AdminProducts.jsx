import { useState, useEffect } from 'react'
import { getProducts } from '../../api/products'
import api from '../../api/axios'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => { getProducts({ page: 0, size: 100 }).then((d) => setProducts(d.content ?? d ?? [])).catch(() => {}) }, [])

  const handleDelete = async (id) => {
    if (!confirm('Xóa sản phẩm này?')) return
    try { await api.delete(`/products/${id}`); setProducts(products.filter((p) => p.maSanPham !== id)) } catch {}
  }

  const list = products.filter((p) => !search || (p.tenSanPham || '').toLowerCase().includes(search.toLowerCase()))

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
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm sản phẩm..." className="pl-9 pr-4 py-2 border rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
              {list.map((p) => (
                <tr key={p.maSanPham} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.urlAnhDaiDien || 'https://placehold.co/40x40/e2e8f0/475569?text=P'} className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                      <span className="font-medium truncate max-w-[200px]">{p.tenSanPham}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.danhMuc?.tenDanhMuc || '-'}</td>
                  <td className="px-4 py-3 text-right font-semibold">{VND(p.giaTrungBinh ?? 0)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      <Link to={`/admin/products/${p.maSanPham}/edit`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="h-4 w-4" /></Link>
                      <button onClick={() => handleDelete(p.maSanPham)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function VND(n) { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }