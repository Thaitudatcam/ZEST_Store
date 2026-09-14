import { useState, useEffect } from 'react'
import { getCategoryTree } from '../../api/categories'
import { createCategory, updateCategory, toggleCategory } from '../../api/admin'
import { Plus, Pencil, ChevronRight, ChevronDown, Eye, EyeOff } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog'

function TreeNode({ cat, onEdit, onToggle, depth = 0 }) {
  const [open, setOpen] = useState(true)
  const hasChildren = cat.children?.length > 0
  return (
    <div>
      <div className={`flex items-center gap-2 px-4 py-2.5 hover:bg-ivory-100 rounded-lg transition ${depth > 0 ? 'ml-6' : ''}`}>
        {hasChildren ? (
          <button onClick={() => setOpen(!open)} className="text-stone">{open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button>
        ) : <div className="w-4" />}
        <span className="flex-1 text-sm font-medium">{cat.tenDanhMuc}</span>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${cat.hienThi === false ? 'text-stone-light bg-stone/10 border-stone/20' : 'text-emerald-deep bg-emerald-deep/10 border-emerald-deep/20'}`}>{cat.hienThi === false ? 'Ẩn' : 'Hiện'}</span>
        <button onClick={() => onEdit(cat)} className="p-1 text-gold hover:bg-gold/10 rounded"><Pencil className="h-3.5 w-3.5" /></button>
        <button onClick={() => onToggle(cat.maDanhMuc)} className={`p-1 rounded ${cat.hienThi === false ? 'text-emerald-600 hover:bg-emerald-50' : 'text-stone hover:bg-ivory-100'}`} title={cat.hienThi === false ? 'Hiện' : 'Ẩn'}>
          {cat.hienThi === false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </button>
      </div>
      {open && hasChildren && cat.children.map((c) => <TreeNode key={c.maDanhMuc} cat={c} onEdit={onEdit} onToggle={onToggle} depth={depth + 1} />)}
    </div>
  )
}

export default function AdminCategories() {
  const [cats, setCats] = useState([])
  const [form, setForm] = useState({ tenDanhMuc: '', slug: '', maDanhMucCha: '', hienThi: true })
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [confirmSave, setConfirmSave] = useState(false)

  const load = () => getCategoryTree().then(setCats).catch(() => {})
  useEffect(() => { load() }, [])

  const handleEdit = (cat) => { setEditing(cat); setForm({ tenDanhMuc: cat.tenDanhMuc, slug: cat.slug || '', maDanhMucCha: cat.maDanhMucCha || '', hienThi: cat.hienThi !== false }); setShowForm(true) }

  const handleSubmit = async () => {
    setConfirmSave(false)
    try {
      if (editing) await updateCategory(editing.maDanhMuc, form)
      else await createCategory(form)
      setShowForm(false); setEditing(null); setForm({ tenDanhMuc: '', slug: '', maDanhMucCha: '', hienThi: true }); load()
    } catch { alert('Lỗi') }
  }

  const handleToggle = async (id) => {
    try { await toggleCategory(id); load() } catch { alert('Lỗi khi đổi trạng thái danh mục') }
  }

  const flatten = (items, depth = 0) => {
    let result = []
    for (const item of items) {
      result.push({ ...item, depth })
      if (item.children) result = result.concat(flatten(item.children, depth + 1))
    }
    return result
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Danh mục</h1>
        <button onClick={() => { setEditing(null); setForm({ tenDanhMuc: '', slug: '', maDanhMucCha: '', hienThi: true }); setShowForm(true) }} className="bg-gold text-noir px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gold-hover flex items-center gap-2">
          <Plus className="h-4 w-4" /> Thêm danh mục
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-ivory rounded-2xl shadow-sm border p-4">
          {cats.map((c) => <TreeNode key={c.maDanhMuc} cat={c} onEdit={handleEdit} onToggle={handleToggle} />)}
          {cats.length === 0 && <p className="text-center text-stone py-8">Chưa có danh mục</p>}
        </div>

        {showForm && (
          <div className="bg-ivory rounded-2xl shadow-sm border p-6 h-fit">
            <h2 className="font-semibold mb-4">{editing ? 'Sửa danh mục' : 'Thêm danh mục'}</h2>
            <form onSubmit={(e) => { e.preventDefault(); setConfirmSave(true) }} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-ink-soft">Tên danh mục</label>
                <input value={form.tenDanhMuc} onChange={(e) => setForm({ ...form, tenDanhMuc: e.target.value })} required className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-gold" />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-soft">Slug</label>
                <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-gold" />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-soft">Danh mục cha</label>
                <select value={form.maDanhMucCha} onChange={(e) => setForm({ ...form, maDanhMucCha: e.target.value })} className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-gold">
                  <option value="">-- Không có (danh mục gốc) --</option>
                  {flatten(cats).filter((c) => !editing || c.maDanhMuc !== editing.maDanhMuc).map((c) => (
                    <option key={c.maDanhMuc} value={c.maDanhMuc}>{'— '.repeat(c.depth + 1)}{c.tenDanhMuc}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-ink-soft cursor-pointer">
                <input type="checkbox" checked={form.hienThi} onChange={(e) => setForm({ ...form, hienThi: e.target.checked })} className="h-4 w-4 rounded accent-gold" />
                Hiển thị trên website
              </label>
              <div className="flex gap-3">
                <button type="submit" className="bg-gold text-noir px-6 py-2 rounded-lg font-semibold hover:bg-gold-hover">{editing ? 'Cập nhật' : 'Tạo'}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="border px-6 py-2 rounded-lg font-semibold hover:bg-ivory-100">Hủy</button>
              </div>
            </form>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmSave}
        title={editing ? 'Cập nhật danh mục' : 'Thêm danh mục'}
        message={`Bạn chắc chắn muốn ${editing ? 'cập nhật' : 'tạo'} danh mục "${form.tenDanhMuc}"?`}
        confirmText={editing ? 'Cập nhật' : 'Tạo'}
        variant="gold"
        onConfirm={handleSubmit}
        onCancel={() => setConfirmSave(false)}
      />
    </div>
  )
}
