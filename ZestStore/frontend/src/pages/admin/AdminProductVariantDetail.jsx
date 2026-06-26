import { useState, useEffect } from 'react'
import api from '../../api/axios'
import SafeImg from '../../components/SafeImg'
import { Search } from 'lucide-react'

const VND = (n) => { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }

export default function AdminProductVariantDetail() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterColor, setFilterColor] = useState('')
  const [filterSize, setFilterSize] = useState('')
  const [colors, setColors] = useState([])
  const [sizes, setSizes] = useState([])

  useEffect(() => {
    Promise.all([
      api.get('/products/admin/variant-list').then(r => r.data),
      api.get('/colors').then(r => r.data),
      api.get('/sizes').then(r => r.data),
    ]).then(([rowsData, cl, sz]) => {
      setColors(Array.isArray(cl) ? cl : [])
      setSizes(Array.isArray(sz) ? sz : [])
      setRows(Array.isArray(rowsData) ? rowsData : [])
    }).catch(() => {})
    .finally(() => setLoading(false))
  }, [])

  const filtered = rows.filter(r => {
    if (search && !r.tenSanPham.toLowerCase().includes(search.toLowerCase())) return false
    if (filterColor && r.mauSac !== filterColor) return false
    if (filterSize && r.kichCo !== filterSize) return false
    return true
  })

  if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded-2xl" />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sản phẩm chi tiết</h1>
      </div>

      <div className="bg-white rounded-2xl border p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-gray-500 font-medium">Tìm kiếm</label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên sản phẩm..."
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Màu sắc</label>
            <select value={filterColor} onChange={(e) => setFilterColor(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tất cả màu</option>
              {colors.map(c => <option key={c.maMauSac} value={c.mauSac}>{c.mauSac}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Kích cỡ</label>
            <select value={filterSize} onChange={(e) => setFilterSize(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tất cả size</option>
              {sizes.map(s => <option key={s.maKichCo} value={s.kichCo}>{s.kichCo}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-gray-50">
              <th className="text-left px-3 py-2 font-semibold text-gray-600">Sản phẩm</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-600">Màu</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-600">Size</th>
              <th className="text-right px-3 py-2 font-semibold text-gray-600">Giá</th>
              <th className="text-center px-3 py-2 font-semibold text-gray-600">Tồn kho</th>
              <th className="text-center px-3 py-2 font-semibold text-gray-600">Trạng thái</th>
            </tr></thead>
            <tbody className="divide-y">
              {filtered.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50 transition">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <SafeImg src={r.urlAnhDaiDien} className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0"
                        fallback="https://placehold.co/40x40/e2e8f0/475569?text=P" />
                      <span className="font-medium truncate max-w-[200px]">{r.tenSanPham}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {r.maMauHex && <span className="w-4 h-4 rounded-full border shrink-0" style={{ backgroundColor: r.maMauHex }} />}
                      <span>{r.mauSac}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">{r.kichCo}</td>
                  <td className="px-3 py-2 text-right font-semibold">{VND(r.gia)}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.tonKho > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {r.tonKho}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.trangThai === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {r.trangThai === 1 ? 'Hoạt động' : 'Ẩn'}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Không có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
