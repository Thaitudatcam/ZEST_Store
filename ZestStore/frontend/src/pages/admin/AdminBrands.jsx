import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { createBrand, updateBrand, deleteBrand } from '../../api/admin'
import { Plus, Pencil, Trash2, Globe, Image, X } from 'lucide-react'
import Toast from '../../components/Toast'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function AdminBrands() {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ tenThuongHieu: '', moTa: '', website: '', logoUrl: '', trangThai: '1' })
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [toast, setToast] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/brands').then((r) => setBrands(r.data)).catch(() => setToast({ type: 'error', message: 'Không thể tải thương hiệu' })).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditing(null); setForm({ tenThuongHieu: '', moTa: '', website: '', logoUrl: '', trangThai: '1' }); setShowForm(true) }

  const openEdit = (b) => { setEditing(b); setForm({ tenThuongHieu: b.tenThuongHieu, moTa: b.moTa || '', website: b.website || '', logoUrl: b.logoUrl || '', trangThai: String(b.trangThai ?? 1) }); setShowForm(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) await updateBrand(editing.maThuongHieu, form)
      else await createBrand(form)
      setToast({ type: 'success', message: editing ? 'Cập nhật thành công' : 'Thêm thành công' })
      setShowForm(false); setEditing(null); load()
    } catch { setToast({ type: 'error', message: 'Lỗi lưu thương hiệu' }) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Xóa thương hiệu này?')) return
    try { await deleteBrand(id); setToast({ type: 'success', message: 'Xóa thành công' }); load() }
    catch { setToast({ type: 'error', message: 'Không thể xóa thương hiệu này' }) }
  }

  const activeBrands = brands.filter((b) => b.trangThai !== 0)
  const inactiveBrands = brands.filter((b) => b.trangThai === 0)

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Thương hiệu</h1>
        <button onClick={openAdd} title="Thêm thương hiệu mới" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Thêm thương hiệu
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {loading ? <LoadingSpinner className="py-12" /> : brands.length === 0 ? (
            <p className="text-center text-gray-500 py-8 bg-white rounded-2xl shadow-sm border">Chưa có thương hiệu</p>
          ) : (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Đang hoạt động ({activeBrands.length})</h2>
              {activeBrands.map((b) => <BrandCard key={b.maThuongHieu} brand={b} onEdit={openEdit} onDelete={handleDelete} />)}
              {inactiveBrands.length > 0 && (
                <>
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mt-6">Tạm ẩn ({inactiveBrands.length})</h2>
                  {inactiveBrands.map((b) => <BrandCard key={b.maThuongHieu} brand={b} onEdit={openEdit} onDelete={handleDelete} />)}
                </>
              )}
            </div>
          )}
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border p-6 h-fit sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">{editing ? 'Sửa thương hiệu' : 'Thêm thương hiệu'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Tên thương hiệu <span className="text-red-500">*</span></label>
                <input value={form.tenThuongHieu} onChange={(e) => setForm({ ...form, tenThuongHieu: e.target.value })} required className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Mô tả</label>
                <textarea value={form.moTa} onChange={(e) => setForm({ ...form, moTa: e.target.value })} rows={3} className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> Website</label>
                <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1"><Image className="h-3.5 w-3.5" /> Logo URL</label>
                <input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://..." className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                {form.logoUrl && <img src={form.logoUrl} alt="" className="mt-2 h-10 object-contain border rounded" onError={(e) => e.target.style.display = 'none'} />}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Trạng thái</label>
                <select value={form.trangThai} onChange={(e) => setForm({ ...form, trangThai: e.target.value })} className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                  <option value="1">Đang hiển thị</option>
                  <option value="0">Tạm ẩn</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 flex-1">{editing ? 'Cập nhật' : 'Tạo'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="border px-6 py-2 rounded-lg font-semibold hover:bg-gray-50">Hủy</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

function BrandCard({ brand, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow transition-shadow">
      <div className="flex items-center gap-4">
        {brand.logoUrl ? (
          <img src={brand.logoUrl} alt={brand.tenThuongHieu} className="w-12 h-12 rounded-lg object-contain bg-gray-50 border" onError={(e) => e.target.style.display = 'none'} />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">{brand.tenThuongHieu?.charAt(0)}</div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{brand.tenThuongHieu}</h3>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${brand.trangThai !== 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {brand.trangThai !== 0 ? 'Đang bán' : 'Ẩn'}
            </span>
          </div>
          {brand.moTa && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{brand.moTa}</p>}
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
            {brand.website && <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {brand.website.replace(/https?:\/\//, '')}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onEdit(brand)} title="Sửa thương hiệu" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="h-3.5 w-3.5" /></button>
          <button onClick={() => onDelete(brand.maThuongHieu)} title="Xóa thương hiệu" className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    </div>
  )
}
