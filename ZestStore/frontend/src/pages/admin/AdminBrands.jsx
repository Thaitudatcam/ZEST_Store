import { useState, useEffect } from 'react'
import { getBrands, createBrand, updateBrand, deleteBrand } from '../../api/admin'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function AdminBrands() {
  const [brands, setBrands] = useState([])
  const [name, setName] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmSave, setConfirmSave] = useState(false)
  const [confirmEdit, setConfirmEdit] = useState(null)

  const load = () => getBrands().then(setBrands).catch(() => {})
  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    setConfirmSave(false)
    if (!name.trim()) return
    try { await createBrand({ tenThuongHieu: name.trim() }); setName(''); setShowForm(false); load() }
    catch { alert('Lỗi khi thêm thương hiệu') }
  }

  const startEdit = (b) => { setEditingId(b.maThuongHieu); setEditName(b.tenThuongHieu) }

  const handleSave = async () => {
    setConfirmEdit(null)
    if (!editName.trim()) return
    try { await updateBrand(editingId, { tenThuongHieu: editName.trim() }); setEditingId(null); load() }
    catch { alert('Lỗi khi cập nhật thương hiệu') }
  }

  const handleDelete = async (id) => {
    setConfirmDelete(null)
    try { await deleteBrand(id); load() }
    catch { alert('Không thể xóa (thương hiệu đang được dùng cho sản phẩm)') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Thương hiệu</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null) }} className="bg-gold text-noir px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gold-hover flex items-center gap-2">
          <Plus className="h-4 w-4" /> Thêm thương hiệu
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-ivory rounded-2xl shadow-sm border p-4">
          {brands.map((b) => (
            <div key={b.maThuongHieu} className="flex items-center gap-2 px-4 py-2.5 hover:bg-ivory-100 rounded-lg">
              <span className="w-8 text-sm text-stone-light">{b.maThuongHieu}</span>
              {editingId === b.maThuongHieu ? (
                <>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
                  <button onClick={() => setConfirmEdit(b.maThuongHieu)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><Check className="h-4 w-4" /></button>
                  <button onClick={() => setEditingId(null)} className="p-1 text-stone hover:bg-ivory-100 rounded"><X className="h-4 w-4" /></button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium">{b.tenThuongHieu}</span>
                  <button onClick={() => startEdit(b)} className="p-1 text-gold hover:bg-gold/10 rounded"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setConfirmDelete(b.maThuongHieu)} className="p-1 text-bordeaux hover:bg-bordeaux/10 rounded"><Trash2 className="h-3.5 w-3.5" /></button>                </>
              )}
            </div>
          ))}
          {brands.length === 0 && <p className="text-center text-stone py-8">Chưa có thương hiệu</p>}
        </div>

        {showForm && (
          <div className="bg-ivory rounded-2xl shadow-sm border p-6 h-fit">
            <h2 className="font-semibold mb-4">Thêm thương hiệu</h2>
            <form onSubmit={(e) => { e.preventDefault(); setConfirmSave(true) }} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-ink-soft">Tên thương hiệu</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-gold" />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="bg-gold text-noir px-6 py-2 rounded-lg font-semibold hover:bg-gold-hover">Tạo</button>
                <button type="button" onClick={() => setShowForm(false)} className="border px-6 py-2 rounded-lg font-semibold hover:bg-ivory-100">Hủy</button>
              </div>
            </form>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Xác nhận xóa"
        message="Bạn chắc chắn muốn xóa thương hiệu này?"
        confirmText="Xóa"
        onConfirm={() => handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
      <ConfirmDialog
        open={confirmSave}
        title="Thêm thương hiệu"
        message={`Bạn chắc chắn muốn tạo thương hiệu "${name}"?`}
        confirmText="Tạo"
        variant="gold"
        onConfirm={handleAdd}
        onCancel={() => setConfirmSave(false)}
      />
      <ConfirmDialog
        open={confirmEdit !== null}
        title="Cập nhật thương hiệu"
        message={`Bạn chắc chắn muốn cập nhật thương hiệu thành "${editName}"?`}
        confirmText="Lưu"
        variant="gold"
        onConfirm={handleSave}
        onCancel={() => setConfirmEdit(null)}
      />
    </div>
  )
}
