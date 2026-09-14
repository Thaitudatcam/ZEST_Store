import { useEffect, useMemo, useState } from 'react'
import { getCategoryTree } from '../../api/categories'
import { createCategory, updateCategory, toggleCategory } from '../../api/admin'
import { Plus, Pencil, Eye, EyeOff, FolderTree, Search, X } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog'

const emptyForm = { tenDanhMuc: '', slug: '', maDanhMucCha: '', hienThi: true }

export default function AdminCategories({ embedded = false }) {
  const [cats, setCats] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [confirmSave, setConfirmSave] = useState(false)
  const [search, setSearch] = useState('')
  const load = () => getCategoryTree().then(setCats).catch(() => {})
  useEffect(() => { load() }, [])

  const flatCategories = useMemo(() => {
    const flatten = (items, depth = 0) => items.flatMap(item => [{ ...item, depth }, ...flatten(item.children || [], depth + 1)])
    return flatten(cats)
  }, [cats])
  const visibleCategories = flatCategories.filter(item => item.tenDanhMuc?.toLowerCase().includes(search.trim().toLowerCase()))
  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true) }
  const openEdit = (cat) => { setEditing(cat); setForm({ tenDanhMuc: cat.tenDanhMuc, slug: cat.slug || '', maDanhMucCha: cat.maDanhMucCha || '', hienThi: cat.hienThi !== false }); setShowForm(true) }
  const handleSubmit = async () => { setConfirmSave(false); try { if (editing) await updateCategory(editing.maDanhMuc, form); else await createCategory(form); setShowForm(false); setEditing(null); setForm(emptyForm); load() } catch { alert('Không thể lưu danh mục') } }
  const handleToggle = async (id) => { try { await toggleCategory(id); load() } catch { alert('Không thể đổi trạng thái danh mục') } }

  return <div className={embedded ? '' : 'max-w-6xl mx-auto'}>
    {!embedded && <h1 className="text-2xl font-bold mb-6">Danh mục</h1>}
    <div className="rounded-2xl border border-gold/20 bg-gradient-to-r from-gold/10 via-ivory to-ivory p-5 sm:p-6 mb-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5"><div className="flex items-start gap-3"><div className="p-2 rounded-xl bg-gold/20 text-gold"><FolderTree className="h-5 w-5" /></div><div><h2 className="font-bold text-lg">Danh mục</h2><p className="text-sm text-stone mt-0.5">Phân nhóm sản phẩm theo cấu trúc cha và con.</p></div></div><button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-gold text-noir rounded-xl text-sm font-bold hover:bg-gold-hover transition"><Plus className="h-4 w-4" /> Thêm danh mục</button></div>
      {showForm && <form onSubmit={e => { e.preventDefault(); setConfirmSave(true) }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-5 border-t border-gold/20">
        <input value={form.tenDanhMuc} onChange={e => setForm({ ...form, tenDanhMuc: e.target.value })} required placeholder="Tên danh mục" className="bg-white border border-stone/20 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/60" />
        <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="Slug (không bắt buộc)" className="bg-white border border-stone/20 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/60" />
        <select value={form.maDanhMucCha} onChange={e => setForm({ ...form, maDanhMucCha: e.target.value })} className="bg-white border border-stone/20 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/60"><option value="">Không có danh mục cha</option>{flatCategories.filter(c => !editing || c.maDanhMuc !== editing.maDanhMuc).map(c => <option key={c.maDanhMuc} value={c.maDanhMuc}>{'— '.repeat(c.depth)}{c.tenDanhMuc}</option>)}</select>
        <div className="flex gap-2"><button type="submit" className="flex-1 py-2.5 bg-noir text-ivory rounded-xl text-sm font-bold">{editing ? 'Lưu thay đổi' : 'Tạo danh mục'}</button><button type="button" onClick={() => { setShowForm(false); setEditing(null); setForm(emptyForm) }} className="p-2.5 rounded-xl border hover:bg-white" aria-label="Hủy"><X className="h-4 w-4" /></button></div>
        <label className="sm:col-span-2 lg:col-span-4 flex items-center gap-2 text-xs text-stone"><input type="checkbox" checked={form.hienThi} onChange={e => setForm({ ...form, hienThi: e.target.checked })} className="accent-gold" /> Hiển thị danh mục trên website</label>
      </form>}
    </div>
    <div className="bg-ivory rounded-2xl border overflow-hidden shadow-sm"><div className="px-5 sm:px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">Danh sách danh mục</h2><p className="text-xs text-stone mt-0.5">{visibleCategories.length} mục hiển thị</p></div><div className="relative w-full sm:w-60"><Search className="absolute h-4 w-4 left-3 top-1/2 -translate-y-1/2 text-stone" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm danh mục..." className="w-full rounded-xl border border-stone/20 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/60" /></div></div>
      {visibleCategories.length === 0 ? <div className="py-10 text-center text-sm text-stone">Chưa có danh mục phù hợp.</div> : <div className="p-3 sm:p-4 space-y-2.5">{visibleCategories.map(cat => {
        const parent = flatCategories.find(item => item.maDanhMuc === cat.maDanhMucCha)
        return <div key={cat.maDanhMuc} style={{ marginLeft: `${Math.min(cat.depth, 3) * 34}px` }} className={`group relative flex items-center justify-between rounded-xl border px-4 py-3.5 hover:border-gold/50 hover:shadow-md transition-all ${cat.depth ? 'border-l-4 border-l-gold/60 bg-gold/5' : 'border-stone/10 bg-white'}`}>
          {cat.depth > 0 && <span className="absolute -left-9 top-1/2 h-px w-8 bg-gold/60" />}
          <div className="flex items-center gap-3 min-w-0"><div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${cat.depth ? 'bg-white text-gold border border-gold/20' : 'bg-gold/10 text-gold'}`}><FolderTree className="h-4 w-4" /></div><div className="min-w-0"><p className="font-semibold truncate">{cat.tenDanhMuc}</p><p className="text-[11px] text-stone">{cat.depth ? `↳ Thuộc: ${parent?.tenDanhMuc || 'danh mục cha'} · cấp ${cat.depth + 1}` : 'Danh mục gốc'}</p></div></div><div className="flex items-center gap-1"><span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${cat.hienThi === false ? 'text-stone bg-stone/10' : 'text-emerald-deep bg-emerald-deep/10'}`}>{cat.hienThi === false ? 'Ẩn' : 'Hiện'}</span><button onClick={() => openEdit(cat)} className="p-2 text-stone hover:text-gold hover:bg-gold/10 rounded-lg" title="Sửa"><Pencil className="h-4 w-4" /></button><button onClick={() => handleToggle(cat.maDanhMuc)} className="p-2 text-stone hover:text-noir hover:bg-ivory-100 rounded-lg" title={cat.hienThi === false ? 'Hiện' : 'Ẩn'}>{cat.hienThi === false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button></div>
        </div>
      })}</div>}
    </div>
    <ConfirmDialog open={confirmSave} title={editing ? 'Cập nhật danh mục' : 'Thêm danh mục'} message={`Bạn chắc chắn muốn ${editing ? 'cập nhật' : 'tạo'} danh mục "${form.tenDanhMuc}"?`} confirmText={editing ? 'Cập nhật' : 'Tạo'} variant="gold" onConfirm={handleSubmit} onCancel={() => setConfirmSave(false)} />
  </div>
}
