import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { createSize, updateSize, deleteSize } from '../../api/admin'
import { Plus, Pencil, Trash2, ArrowUpDown } from 'lucide-react'
import Toast from '../../components/Toast'
import LoadingSpinner from '../../components/LoadingSpinner'

const LOAI_SIZE = [
  { value: '', label: 'Không phân loại' },
  { value: 'clothing', label: '👕 Quần áo' },
  { value: 'shoes', label: '👟 Giày dép' },
  { value: 'accessory', label: '🧢 Phụ kiện' },
  { value: 'other', label: '📦 Khác' },
]

export default function AdminSizes() {
  const [sizes, setSizes] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ kichCo: '', thuTu: '', loai: '' })
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [toast, setToast] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/sizes').then((r) => {
      const list = r.data.sort((a, b) => (a.thuTu ?? 999) - (b.thuTu ?? 999) || a.kichCo?.localeCompare(b.kichCo))
      setSizes(list)
    }).catch(() => setToast({ type: 'error', message: 'Không thể tải kích cỡ' })).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditing(null); setForm({ kichCo: '', thuTu: '', loai: '' }); setShowForm(true) }

  const openEdit = (s) => { setEditing(s); setForm({ kichCo: s.kichCo, thuTu: s.thuTu != null ? String(s.thuTu) : '', loai: s.loai || '' }); setShowForm(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = { ...form }
      if (data.thuTu === '') delete data.thuTu
      if (editing) await updateSize(editing.maKichCo, data)
      else await createSize(data)
      setToast({ type: 'success', message: editing ? 'Cập nhật thành công' : 'Thêm thành công' })
      setShowForm(false); setEditing(null); load()
    } catch { setToast({ type: 'error', message: 'Lỗi lưu kích cỡ' }) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Xóa kích cỡ này?')) return
    try { await deleteSize(id); setToast({ type: 'success', message: 'Xóa thành công' }); load() }
    catch { setToast({ type: 'error', message: 'Không thể xóa kích cỡ này' }) }
  }

  const grouped = {}
  for (const s of sizes) {
    const key = s.loai || 'other'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(s)
  }
  const loaiLabels = Object.fromEntries(LOAI_SIZE.filter((l) => l.value).map((l) => [l.value, l.label]))

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Kích cỡ</h1>
        <button onClick={openAdd} title="Thêm kích cỡ mới" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Thêm kích cỡ
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {loading ? <LoadingSpinner className="py-12" /> : sizes.length === 0 ? (
            <p className="text-center text-gray-500 py-8 bg-white rounded-2xl shadow-sm border">Chưa có kích cỡ</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([loai, items]) => (
                <div key={loai}>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">{loaiLabels[loai] || 'Khác'} ({items.length})</h2>
                  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left px-4 py-2.5 font-semibold text-gray-600 w-12">TT</th>
                          <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Kích cỡ</th>
                          <th className="text-left px-4 py-2.5 font-semibold text-gray-600 hidden sm:table-cell">Loại</th>
                          <th className="text-center px-4 py-2.5 font-semibold text-gray-600 w-20">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {items.map((s) => (
                          <tr key={s.maKichCo} className="hover:bg-gray-50">
                            <td className="px-4 py-2.5 text-gray-400 text-xs">{s.thuTu ?? '—'}</td>
                            <td className="px-4 py-2.5 font-medium">{s.kichCo}</td>
                            <td className="px-4 py-2.5 text-gray-500 hidden sm:table-cell">{loaiLabels[s.loai] || '—'}</td>
                            <td className="px-4 py-2.5 text-center">
                              <div className="flex justify-center gap-1">
                                <button onClick={() => openEdit(s)} title="Sửa kích cỡ" className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="h-3.5 w-3.5" /></button>
                                <button onClick={() => handleDelete(s.maKichCo)} title="Xóa kích cỡ" className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border p-6 h-fit sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">{editing ? 'Sửa kích cỡ' : 'Thêm kích cỡ'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><Pencil className="h-4 w-4 rotate-45" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Kích cỡ <span className="text-red-500">*</span></label>
                <input value={form.kichCo} onChange={(e) => setForm({ ...form, kichCo: e.target.value })} required placeholder="VD: M, L, XL..." className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1"><ArrowUpDown className="h-3.5 w-3.5" /> Thứ tự hiển thị</label>
                <input type="number" value={form.thuTu} onChange={(e) => setForm({ ...form, thuTu: e.target.value })} placeholder="Số nhỏ = hiện trước" className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                <p className="text-xs text-gray-400 mt-1">VD: XS=1, S=2, M=3, L=4, XL=5</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Phân loại</label>
                <select value={form.loai} onChange={(e) => setForm({ ...form, loai: e.target.value })} className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                  {LOAI_SIZE.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
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
