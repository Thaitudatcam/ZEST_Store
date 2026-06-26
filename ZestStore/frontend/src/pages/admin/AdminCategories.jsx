import { useState, useEffect } from 'react'
import { getCategoryTree } from '../../api/categories'
import { createCategory, updateCategory, deleteCategory } from '../../api/admin'
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown, Package, X } from 'lucide-react'
import Toast from '../../components/Toast'
import LoadingSpinner from '../../components/LoadingSpinner'

const ICON_OPTIONS = [
  { value: '', label: 'Không icon', emoji: '📁' },
  { value: 'shirt', label: 'Áo', emoji: '👕' },
  { value: 'pants', label: 'Quần', emoji: '👖' },
  { value: 'shoes', label: 'Giày', emoji: '👟' },
  { value: 'hat', label: 'Mũ', emoji: '🧢' },
  { value: 'bag', label: 'Túi', emoji: '👜' },
  { value: 'accessory', label: 'Phụ kiện', emoji: '⌚' },
  { value: 'sport', label: 'Thể thao', emoji: '🏃' },
  { value: 'other', label: 'Khác', emoji: '📦' },
]
const ICON_MAP = Object.fromEntries(ICON_OPTIONS.filter((i) => i.value).map((i) => [i.value, i.emoji]))

function getBreadcrumb(cat, allCats) {
  const parts = [cat.tenDanhMuc]
  let parent = cat.maDanhMucCha
  while (parent) {
    const p = allCats.find((c) => c.maDanhMuc === parent)
    if (!p) break
    parts.unshift(p.tenDanhMuc)
    parent = p.maDanhMucCha
  }
  return parts.join(' → ')
}

function flattenTree(items, depth = 0) {
  let result = []
  for (const item of items) {
    result.push({ ...item, depth })
    if (item.children) result = result.concat(flattenTree(item.children, depth + 1))
  }
  return result
}

function TreeNode({ cat, onEdit, onDelete, depth = 0 }) {
  const [open, setOpen] = useState(true)
  const hasChildren = cat.children?.length > 0
  return (
    <div>
      <div className={`flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 rounded-lg transition group ${depth > 0 ? 'ml-6' : ''}`}>
        {hasChildren ? (
          <button onClick={() => setOpen(!open)} className="text-gray-400 hover:text-gray-600" title={open ? 'Thu gọn' : 'Mở rộng'}>{open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button>
        ) : <div className="w-4" />}
        <span className="text-lg">{ICON_MAP[cat.icon] || '📁'}</span>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium">{cat.tenDanhMuc}</span>
          {cat.productCount > 0 && <span className="ml-2 text-xs text-gray-400">({cat.productCount} SP)</span>}
        </div>
        <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
          <button onClick={() => onEdit(cat)} title="Sửa danh mục" className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="h-3.5 w-3.5" /></button>
          <button onClick={() => onDelete(cat.maDanhMuc)} title="Xóa danh mục" className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      {open && hasChildren && cat.children.map((c) => <TreeNode key={c.maDanhMuc} cat={c} onEdit={onEdit} onDelete={onDelete} depth={depth + 1} />)}
    </div>
  )
}

export default function AdminCategories() {
  const [cats, setCats] = useState([])
  const [form, setForm] = useState({ tenDanhMuc: '', slug: '', maDanhMucCha: '', icon: '', moTa: '' })
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [toast, setToast] = useState(null)
  const [selectedCat, setSelectedCat] = useState(null)

  const load = () => getCategoryTree().then(setCats).catch(() => {})
  useEffect(() => { load() }, [])

  const flatCats = flattenTree(cats)

  const openAdd = (parent) => {
    setEditing(null)
    setForm({ tenDanhMuc: '', slug: '', maDanhMucCha: parent ? String(parent.maDanhMuc) : '', icon: '', moTa: '' })
    setShowForm(true)
  }

  const openEdit = (cat) => {
    setEditing(cat)
    setForm({ tenDanhMuc: cat.tenDanhMuc, slug: cat.slug || '', maDanhMucCha: '', icon: cat.icon || '', moTa: cat.moTa || '' })
    setShowForm(true)
    setSelectedCat(cat)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = { ...form }
      if (!data.maDanhMucCha) delete data.maDanhMucCha
      if (editing) await updateCategory(editing.maDanhMuc, data)
      else await createCategory(data)
      setToast({ type: 'success', message: editing ? 'Cập nhật thành công' : 'Thêm thành công' })
      setShowForm(false); setEditing(null); setSelectedCat(null); load()
    } catch { setToast({ type: 'error', message: 'Lỗi lưu danh mục' }) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Xóa danh mục này?')) return
    try { await deleteCategory(id); setToast({ type: 'success', message: 'Xóa thành công' }); load() }
    catch { setToast({ type: 'error', message: 'Không thể xóa (có thể có sản phẩm con)' }) }
  }

  const totalProducts = flatCats.reduce((sum, c) => sum + (c.productCount || 0), 0)

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Danh mục</h1>
        <button onClick={() => openAdd(null)} title="Thêm danh mục mới" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Thêm danh mục
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <Package className="h-4 w-4" /> Tổng cộng: <strong>{flatCats.length}</strong> danh mục, <strong>{totalProducts}</strong> sản phẩm
          </div>

          <div className="bg-white rounded-2xl shadow-sm border p-4">
            {cats.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Chưa có danh mục</p>
            ) : (
              cats.map((c) => <TreeNode key={c.maDanhMuc} cat={c} onEdit={openEdit} onDelete={handleDelete} />)
            )}
          </div>

          {selectedCat && (
            <div className="bg-white rounded-2xl shadow-sm border p-4">
              <h3 className="font-semibold text-sm text-gray-600 mb-2">Chi tiết danh mục</h3>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{ICON_MAP[selectedCat.icon] || '📁'}</span>
                <div>
                  <p className="font-medium">{selectedCat.tenDanhMuc}</p>
                  <p className="text-xs text-gray-400">{getBreadcrumb(selectedCat, flatCats)}</p>
                </div>
              </div>
              {selectedCat.moTa && <p className="text-sm text-gray-600 line-clamp-3">{selectedCat.moTa}</p>}
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                <span><Package className="h-3 w-3 inline" /> {selectedCat.productCount || 0} sản phẩm</span>
                {selectedCat.slug && <span className="font-mono">/{selectedCat.slug}</span>}
              </div>
            </div>
          )}
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border p-6 h-fit sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">{editing ? 'Sửa danh mục' : 'Thêm danh mục'}</h2>
              <button onClick={() => { setShowForm(false); setEditing(null); setSelectedCat(null) }} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Tên danh mục <span className="text-red-500">*</span></label>
                <input value={form.tenDanhMuc} onChange={(e) => setForm({ ...form, tenDanhMuc: e.target.value })} required className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Slug</label>
                <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Icon</label>
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {ICON_OPTIONS.map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setForm({ ...form, icon: opt.value })}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition ${form.icon === opt.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'hover:border-gray-300'}`}>
                      <span className="text-lg">{opt.emoji}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Mô tả</label>
                <textarea value={form.moTa} onChange={(e) => setForm({ ...form, moTa: e.target.value })} rows={3} className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Danh mục cha</label>
                <select value={form.maDanhMucCha} onChange={(e) => setForm({ ...form, maDanhMucCha: e.target.value })} className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                  <option value="">-- Không có (danh mục gốc) --</option>
                  {flatCats.filter((c) => !editing || c.maDanhMuc !== editing.maDanhMuc).map((c) => (
                    <option key={c.maDanhMuc} value={c.maDanhMuc}>{'— '.repeat(c.depth + 1)}{c.tenDanhMuc}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 flex-1">{editing ? 'Cập nhật' : 'Tạo'}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); setSelectedCat(null) }} className="border px-6 py-2 rounded-lg font-semibold hover:bg-gray-50">Hủy</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
