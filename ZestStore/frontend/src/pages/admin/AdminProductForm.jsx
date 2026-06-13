import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Upload, Trash2, Star } from 'lucide-react'
import api from '../../api/axios'

export default function AdminProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [form, setForm] = useState({ tenSanPham: '', slug: '', moTa: '', gia: '', maDanhMuc: '' })
  const [categories, setCategories] = useState([])
  const [sub, setSub] = useState(false)
  const [images, setImages] = useState([])
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data)).catch(() => {})
    if (isEdit) api.get(`/products/detail/${id}`).then((r) => {
      const p = r.data.product || r.data
      setForm({ tenSanPham: p.tenSanPham || '', slug: p.slug || '', moTa: p.moTa || '', gia: p.gia || '', maDanhMuc: p.danhMuc?.maDanhMuc || '' })
      setImages(r.data.images || [])
    }).catch(() => navigate('/admin/products'))
  }, [id])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault(); setSub(true)
    try {
      const body = { tenSanPham: form.tenSanPham, slug: form.slug, moTa: form.moTa, gia: Number(form.gia), maDanhMuc: form.maDanhMuc ? Number(form.maDanhMuc) : null, trangThai: 'active' }
      if (isEdit) { await api.put(`/products/${id}`, body); navigate('/admin/products') }
      else { const res = await api.post('/products', body); navigate(`/admin/products/${res.data.maSanPham}/edit`) }
    } catch { alert('Lỗi lưu sản phẩm') } finally { setSub(false) }
  }

  const handleUpload = async () => {
    if (!files.length) return
    setUploading(true)
    try {
      for (const img of images) await api.delete(`/products/images/${img.maAnh}`)
      const newImgs = []
      for (let i = 0; i < files.length; i++) {
        const fd = new FormData()
        fd.append('file', files[i])
        fd.append('isMain', (i === 0).toString())
        const res = await api.post(`/upload/product/${id}`, fd)
        newImgs.push(res.data)
      }
      setImages(newImgs)
      setFiles([])
    } catch { alert('Lỗi upload ảnh') }
    finally { setUploading(false) }
  }

  const handleDeleteImage = async (imageId) => {
    try { await api.delete(`/products/images/${imageId}`); setImages((prev) => prev.filter((img) => img.maAnh !== imageId)) }
    catch { alert('Lỗi xóa ảnh') }
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
            <label className="text-sm font-medium text-gray-700">Giá</label>
            <input name="gia" type="number" value={form.gia} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
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

      {isEdit && (
        <div className="bg-white rounded-2xl shadow-sm border p-6 mt-6 space-y-4">
          <h2 className="font-semibold text-lg">Hình ảnh sản phẩm</h2>
          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {images.map((img) => (
                <div key={img.maAnh} className="relative group rounded-lg overflow-hidden border bg-gray-100">
                  <img src={img.urlAnh} alt="" className="aspect-square w-full object-cover object-center" />
                  {img.laAnhChinh && <Star className="absolute top-1 left-1 h-4 w-4 text-yellow-400 fill-yellow-400" />}
                  <button type="button" onClick={() => handleDeleteImage(img.maAnh)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">Thêm ảnh</label>
              <input type="file" accept="image/*" multiple onChange={(e) => setFiles([...e.target.files])} className="w-full border rounded-lg px-3 py-2 mt-1 text-sm" />
            </div>
            <button type="button" onClick={handleUpload} disabled={!files.length || uploading} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"><Upload className="h-4 w-4" /> {uploading ? 'Đang tải...' : 'Tải lên'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
