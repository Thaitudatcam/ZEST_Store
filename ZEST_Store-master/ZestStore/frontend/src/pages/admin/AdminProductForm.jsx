import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Upload, Trash2, Plus } from 'lucide-react'
import api from '../../api/axios'
import { VND } from '../../components/ProductCard'

export default function AdminProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [form, setForm] = useState({ tenSanPham: '', slug: '', moTa: '', urlAnhDaiDien: '', maDanhMuc: '' })
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [sizes, setSizes] = useState([])
  const [colors, setColors] = useState([])
  const [sub, setSub] = useState(false)
  const [variants, setVariants] = useState([])
  const [showVariantForm, setShowVariantForm] = useState(false)
  const [vform, setVform] = useState({ sku: '', maThuongHieu: '', maKichCo: '', maMauSac: '', gia: '', tonKho: '' })

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data)).catch(() => {})
    api.get('/brands').then((r) => setBrands(r.data)).catch(() => {})
    api.get('/sizes').then((r) => setSizes(r.data)).catch(() => {})
    api.get('/colors').then((r) => setColors(r.data)).catch(() => {})
    if (isEdit) {
      api.get(`/products/detail/${id}`).then((r) => {
        const p = r.data.product || r.data
        setForm({ tenSanPham: p.tenSanPham || '', slug: p.slug || '', moTa: p.moTa || '', urlAnhDaiDien: p.urlAnhDaiDien || '', maDanhMuc: p.danhMuc?.maDanhMuc || '' })
        setVariants(r.data.variants || [])
      }).catch(() => navigate('/admin/products'))
    }
  }, [id])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault(); setSub(true)
    try {
      const body = { tenSanPham: form.tenSanPham, slug: form.slug, moTa: form.moTa, urlAnhDaiDien: form.urlAnhDaiDien, maDanhMuc: form.maDanhMuc ? Number(form.maDanhMuc) : null }
      if (isEdit) { await api.put(`/products/${id}`, body); navigate('/admin/products') }
      else { const res = await api.post('/products', body); navigate(`/admin/products/${res.data.maSanPham}/edit`) }
    } catch { alert('Lỗi lưu sản phẩm') } finally { setSub(false) }
  }

  const addVariant = async () => {
    if (!vform.sku || !vform.gia) return alert('SKU và giá không được để trống')
    try {
      if (isEdit) {
        const res = await api.post(`/products/${id}/variants`, {
          sku: vform.sku, maThuongHieu: Number(vform.maThuongHieu), maKichCo: Number(vform.maKichCo),
          maMauSac: Number(vform.maMauSac), gia: Number(vform.gia), tonKho: Number(vform.tonKho) || 0
        })
        setVariants((prev) => [...prev, res.data])
      }
      setVform({ sku: '', maThuongHieu: '', maKichCo: '', maMauSac: '', gia: '', tonKho: '' })
      setShowVariantForm(false)
    } catch (err) { alert(err.response?.data?.message || 'Lỗi thêm biến thể') }
  }

  const deleteVariant = async (vid) => {
    if (!confirm('Xóa biến thể này?')) return
    try { await api.delete(`/products/variants/${vid}`); setVariants((prev) => prev.filter((v) => v.maBienThe !== vid)) }
    catch { alert('Lỗi xóa biến thể') }
  }

  const handleUpload = async () => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file || !variants.length) return
      const fd = new FormData()
      fd.append('file', file)
      const res = await api.post(`/upload/variant/${variants[0].maBienThe}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm((f) => ({ ...f, urlAnhDaiDien: res.data.urlAnh || `/api/files/${res.data.maAnh}` }))
    }
    input.click()
  }

  return (
    <div className="max-w-3xl">
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
            <label className="text-sm font-medium text-gray-700">Ảnh đại diện (URL)</label>
            <input name="urlAnhDaiDien" value={form.urlAnhDaiDien} onChange={handleChange} placeholder="URL hoặc upload bên dưới" className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
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

     
          <div className="bg-white rounded-2xl shadow-sm border p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Biến thể</h2>
              <button type="button" onClick={() => setShowVariantForm(true)} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 hover:bg-blue-700">
                <Plus className="h-4 w-4" /> Thêm
              </button>
            </div>
            {variants.length > 0 ? (
              <div className="space-y-2">
                {variants.map((v) => (
                  <div key={v.maBienThe} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex-1 text-sm">
                      <span className="font-mono text-blue-700">{v.sku}</span>
                      <span className="text-gray-500 mx-2">|</span>
                      {v.thuongHieu?.tenThuongHieu && <span>{v.thuongHieu.tenThuongHieu}</span>}
                      {v.kichCo?.kichCo && <span> - Size {v.kichCo.kichCo}</span>}
                      {v.mauSac?.mauSac && <span> - {v.mauSac.mauSac}</span>}
                      <span className="text-gray-500 mx-2">|</span>
                      {VND(v.gia)} | Tồn: {v.tonKho}
                    </div>
                    <button onClick={() => deleteVariant(v.maBienThe)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-500">Chưa có biến thể</p>}

            {showVariantForm && (
              <div className="mt-4 p-4 border rounded-lg bg-gray-50 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input value={vform.sku} onChange={(e) => setVform({ ...vform, sku: e.target.value })} placeholder="SKU" className="border rounded-lg px-3 py-2 text-sm" />
                  <input type="number" value={vform.gia} onChange={(e) => setVform({ ...vform, gia: e.target.value })} placeholder="Giá" className="border rounded-lg px-3 py-2 text-sm" />
                  <select value={vform.maThuongHieu} onChange={(e) => setVform({ ...vform, maThuongHieu: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
                    <option value="">-- Thương hiệu --</option>
                    {brands.map((b) => <option key={b.maThuongHieu} value={b.maThuongHieu}>{b.tenThuongHieu}</option>)}
                  </select>
                  <select value={vform.maKichCo} onChange={(e) => setVform({ ...vform, maKichCo: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
                    <option value="">-- Kích cỡ --</option>
                    {sizes.map((s) => <option key={s.maKichCo} value={s.maKichCo}>{s.kichCo}</option>)}
                  </select>
                  <select value={vform.maMauSac} onChange={(e) => setVform({ ...vform, maMauSac: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
                    <option value="">-- Màu sắc --</option>
                    {colors.map((c) => <option key={c.maMauSac} value={c.maMauSac}>{c.mauSac}</option>)}
                  </select>
                  <input type="number" value={vform.tonKho} onChange={(e) => setVform({ ...vform, tonKho: e.target.value })} placeholder="Tồn kho" className="border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={addVariant} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Thêm</button>
                  <button type="button" onClick={() => setShowVariantForm(false)} className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-100">Hủy</button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border p-6 mt-6">
            <h2 className="font-semibold text-lg mb-4">Ảnh đại diện</h2>
            {form.urlAnhDaiDien && (
              <div className="mb-3 w-32 h-32 rounded-lg overflow-hidden border bg-gray-100">
                <img src={form.urlAnhDaiDien} alt="" className="w-full h-full object-cover object-center" />
              </div>
            )}
            <button type="button" onClick={handleUpload} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-1">
              <Upload className="h-4 w-4" /> Upload ảnh
            </button>
          </div>
        
    </div>
  )
}