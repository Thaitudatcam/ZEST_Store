import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/axios'

export default function AdminProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [form, setForm] = useState({ tenSanPham: '', slug: '', moTa: '', giaBan: '', giaGoc: '', soLuongTon: 0, maDanhMuc: '' })
  const [categories, setCategories] = useState([])
  const [sub, setSub] = useState(false)

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data)).catch(() => {})
    if (isEdit) api.get(`/products/detail/${id}`).then((r) => {
      const p = r.data
      setForm({ tenSanPham: p.tenSanPham || '', slug: p.slug || '', moTa: p.moTa || '', giaBan: p.giaBan || '', giaGoc: p.giaGoc || '', soLuongTon: p.soLuongTon || 0, maDanhMuc: p.maDanhMuc || '' })
    }).catch(() => navigate('/admin/products'))
  }, [id])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault(); setSub(true)
    try {
      const body = { ...form, giaBan: Number(form.giaBan), giaGoc: Number(form.giaGoc), soLuongTon: Number(form.soLuongTon), maDanhMuc: form.maDanhMuc ? Number(form.maDanhMuc) : null }
      if (isEdit) await api.put(`/products/${id}`, body)
      else await api.post('/products', body)
      navigate('/admin/products')
    } catch { alert('Lỗi lưu sản phẩm') } finally { setSub(false) }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-700">Tên sản phẩm</label>
            <input name="tenSanPham" value={form.tenSanPham} onChange={handleChange} required className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Slug</label>
            <input name="slug" value={form.slug} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Danh mục</label>
            <select name="maDanhMuc" value={form.maDanhMuc} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">-- Chọn --</option>
              {categories.map((c) => <option key={c.maDanhMuc} value={c.maDanhMuc}>{c.tenDanhMuc}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Giá bán</label>
            <input name="giaBan" type="number" value={form.giaBan} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Giá gốc</label>
            <input name="giaGoc" type="number" value={form.giaGoc} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Tồn kho</label>
            <input name="soLuongTon" type="number" value={form.soLuongTon} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Mô tả</label>
          <textarea name="moTa" value={form.moTa} onChange={handleChange} rows={4} className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={sub} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">{sub ? 'Đang lưu...' : 'Lưu'}</button>
          <button type="button" onClick={() => navigate('/admin/products')} className="border px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-50">Hủy</button>
        </div>
      </form>
    </div>
  )
}
