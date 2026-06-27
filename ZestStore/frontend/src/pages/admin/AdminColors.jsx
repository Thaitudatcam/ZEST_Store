import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { createColor, updateColor, deleteColor } from '../../api/admin'
import { Plus, Pencil, Trash2, Palette } from 'lucide-react'
import Toast from '../../components/Toast'
import LoadingSpinner from '../../components/LoadingSpinner'

const NHOM_MAU = [
  { value: '', label: 'Không nhóm', color: '#9ca3af' },
  { value: 'do', label: '🔴 Đỏ - Cam', color: '#ef4444' },
  { value: 'xanh', label: '🔵 Xanh', color: '#3b82f6' },
  { value: 'trang', label: '⚪ Trắng - Kem', color: '#f3f4f6' },
  { value: 'den', label: '⚫ Đen - Xám', color: '#374151' },
  { value: 'vàng', label: '🟡 Vàng - Nâu', color: '#eab308' },
  { value: 'tim', label: '🟣 Tím - Hồng', color: '#a855f7' },
  { value: 'khac', label: '🌈 Khác', color: '#14b8a6' },
]

export default function AdminColors() {
  const [colors, setColors] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ mauSac: '', maMauHex: '#000000', nhomMau: '' })
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [toast, setToast] = useState(null)
  const [filterNhom, setFilterNhom] = useState('')

  const load = () => {
    setLoading(true)
    api.get('/colors').then((r) => setColors(r.data)).catch(() => setToast({ type: 'error', message: 'Không thể tải màu sắc' })).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditing(null); setForm({ mauSac: '', maMauHex: '#000000', nhomMau: '' }); setShowForm(true) }

  const openEdit = (c) => { setEditing(c); setForm({ mauSac: c.mauSac, maMauHex: c.maMauHex || '#000000', nhomMau: c.nhomMau || '' }); setShowForm(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) await updateColor(editing.maMauSac, form)
      else await createColor(form)
      setToast({ type: 'success', message: editing ? 'Cập nhật thành công' : 'Thêm thành công' })
      setShowForm(false); setEditing(null); load()
    } catch { setToast({ type: 'error', message: 'Lỗi lưu màu sắc' }) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Xóa màu sắc này?')) return
    try { await deleteColor(id); setToast({ type: 'success', message: 'Xóa thành công' }); load() }
    catch { setToast({ type: 'error', message: 'Không thể xóa màu sắc này' }) }
  }

  const filtered = filterNhom ? colors.filter((c) => c.nhomMau === filterNhom) : colors
  const nhomLabels = Object.fromEntries(NHOM_MAU.filter((n) => n.value).map((n) => [n.value, n.label]))

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Màu sắc</h1>
        <button onClick={openAdd} title="Thêm màu sắc mới" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Thêm màu sắc
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {loading ? <LoadingSpinner className="py-12" /> : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-gray-500">Lọc theo nhóm:</span>
                <button onClick={() => setFilterNhom('')} className={`px-3 py-1 rounded-full text-xs border ${!filterNhom ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100'}`}>Tất cả</button>
                {NHOM_MAU.filter((n) => n.value).map((n) => (
                  <button key={n.value} onClick={() => setFilterNhom(n.value)} className={`px-3 py-1 rounded-full text-xs border ${filterNhom === n.value ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100'}`}>{n.label}</button>
                ))}
              </div>

              {filtered.length === 0 ? (
                <p className="text-center text-gray-500 py-8 bg-white rounded-2xl shadow-sm border">Không có màu sắc</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filtered.map((c) => (
                    <div key={c.maMauSac} className="bg-white rounded-xl shadow-sm border p-3 hover:shadow transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="w-8 h-8 rounded-lg border-2 shadow-sm" style={{ backgroundColor: c.maMauHex || '#ccc' }} />
                        <div className="flex gap-0.5">
                          <button onClick={() => openEdit(c)} title="Sửa màu" className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="h-3 w-3" /></button>
                          <button onClick={() => handleDelete(c.maMauSac)} title="Xóa màu" className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="h-3 w-3" /></button>
                        </div>
                      </div>
                      <p className="font-medium text-sm truncate">{c.mauSac}</p>
                      <p className="text-xs text-gray-400 font-mono">{c.maMauHex || '—'}</p>
                      {c.nhomMau && <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600">{nhomLabels[c.nhomMau]?.replace(/^[^\s]+\s/, '') || c.nhomMau}</span>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border p-6 h-fit sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">{editing ? 'Sửa màu sắc' : 'Thêm màu sắc'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><Pencil className="h-4 w-4 rotate-45" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl border-2 shadow-sm" style={{ backgroundColor: form.maMauHex || '#ccc' }} />
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">Mã màu Hex</label>
                  <div className="flex gap-2 items-center mt-1">
                    <input type="color" value={form.maMauHex || '#000000'} onChange={(e) => setForm({ ...form, maMauHex: e.target.value })} className="w-10 h-9 p-0.5 border rounded cursor-pointer" />
                    <input value={form.maMauHex} onChange={(e) => setForm({ ...form, maMauHex: e.target.value })} placeholder="#FF0000" className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Tên màu <span className="text-red-500">*</span></label>
                <input value={form.mauSac} onChange={(e) => setForm({ ...form, mauSac: e.target.value })} required placeholder="VD: Đỏ, Xanh dương..." className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1"><Palette className="h-3.5 w-3.5" /> Nhóm màu</label>
                <select value={form.nhomMau} onChange={(e) => setForm({ ...form, nhomMau: e.target.value })} className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                  {NHOM_MAU.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
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
