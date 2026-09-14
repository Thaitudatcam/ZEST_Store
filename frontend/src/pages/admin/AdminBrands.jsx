import { useEffect, useMemo, useState } from 'react'
import { getBrands, createBrand, updateBrand, toggleBrand } from '../../api/admin'
import { Plus, Pencil, Check, X, Eye, EyeOff, Sparkles, Search } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function AdminBrands({ embedded = false }) {
  const [brands, setBrands] = useState([])
  const [name, setName] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [confirmSave, setConfirmSave] = useState(false)
  const [confirmEdit, setConfirmEdit] = useState(null)
  const [search, setSearch] = useState('')
  const load = () => getBrands().then(setBrands).catch(() => {})
  useEffect(() => { load() }, [])
  const visibleBrands = useMemo(() => brands.filter(brand => brand.tenThuongHieu?.toLowerCase().includes(search.trim().toLowerCase())), [brands, search])
  const handleAdd = async () => { setConfirmSave(false); if (!name.trim()) return; try { await createBrand({ tenThuongHieu: name.trim() }); setName(''); setShowForm(false); load() } catch { alert('Không thể thêm thương hiệu') } }
  const startEdit = (brand) => { setEditingId(brand.maThuongHieu); setEditName(brand.tenThuongHieu) }
  const handleSave = async () => { setConfirmEdit(null); if (!editName.trim()) return; try { await updateBrand(editingId, { tenThuongHieu: editName.trim() }); setEditingId(null); load() } catch { alert('Không thể cập nhật thương hiệu') } }
  const handleToggle = async (id) => { try { await toggleBrand(id); load() } catch { alert('Không thể đổi trạng thái thương hiệu') } }

  return <div className={embedded ? '' : 'max-w-6xl mx-auto'}>
    {!embedded && <h1 className="text-2xl font-bold mb-6">Thương hiệu</h1>}
    <div className="rounded-2xl border border-gold/20 bg-gradient-to-r from-gold/10 via-ivory to-ivory p-5 sm:p-6 mb-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5"><div className="flex items-start gap-3"><div className="p-2 rounded-xl bg-gold/20 text-gold"><Sparkles className="h-5 w-5" /></div><div><h2 className="font-bold text-lg">Thương hiệu</h2><p className="text-sm text-stone mt-0.5">Quản lý các thương hiệu dùng khi tạo sản phẩm.</p></div></div><button onClick={() => { setShowForm(value => !value); setEditingId(null) }} className="flex items-center gap-2 px-4 py-2.5 bg-gold text-noir rounded-xl text-sm font-bold hover:bg-gold-hover transition"><Plus className="h-4 w-4" /> Thêm thương hiệu</button></div>
      {showForm && <form onSubmit={e => { e.preventDefault(); setConfirmSave(true) }} className="flex flex-wrap items-end gap-3 pt-5 border-t border-gold/20"><div className="flex-1 min-w-[220px]"><label className="block text-xs font-bold uppercase tracking-wide text-stone mb-2">Tên thương hiệu</label><input value={name} onChange={e => setName(e.target.value)} required placeholder="Nhập tên thương hiệu..." className="w-full bg-white border border-stone/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/60" /></div><button type="submit" className="px-5 py-3 bg-noir text-ivory rounded-xl text-sm font-bold">Tạo thương hiệu</button><button type="button" onClick={() => setShowForm(false)} className="p-3 border rounded-xl hover:bg-white" aria-label="Hủy"><X className="h-4 w-4" /></button></form>}
    </div>
    <div className="bg-ivory rounded-2xl border overflow-hidden shadow-sm"><div className="px-5 sm:px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">Danh sách thương hiệu</h2><p className="text-xs text-stone mt-0.5">{visibleBrands.length} mục hiển thị</p></div><div className="relative w-full sm:w-60"><Search className="absolute h-4 w-4 left-3 top-1/2 -translate-y-1/2 text-stone" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm thương hiệu..." className="w-full rounded-xl border border-stone/20 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/60" /></div></div>
      {visibleBrands.length === 0 ? <div className="py-10 text-center text-sm text-stone">Chưa có thương hiệu phù hợp.</div> : <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">{visibleBrands.map(brand => <div key={brand.maThuongHieu} className="group flex items-center justify-between rounded-xl border border-stone/10 bg-white px-4 py-3.5 hover:border-gold/50 hover:shadow-md transition-all"><div className="flex items-center gap-3 min-w-0"><div className="h-9 w-9 rounded-xl bg-gold/10 text-gold flex items-center justify-center shrink-0"><Sparkles className="h-4 w-4" /></div>{editingId === brand.maThuongHieu ? <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus className="min-w-0 flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold" /> : <span className="font-semibold truncate">{brand.tenThuongHieu}</span>}</div><div className="flex items-center gap-1">{editingId === brand.maThuongHieu ? <><button onClick={() => setConfirmEdit(brand.maThuongHieu)} className="p-2 text-emerald-deep hover:bg-emerald-deep/10 rounded-lg" title="Lưu"><Check className="h-4 w-4" /></button><button onClick={() => setEditingId(null)} className="p-2 text-stone hover:bg-ivory-100 rounded-lg" title="Hủy"><X className="h-4 w-4" /></button></> : <><span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${brand.ngayXoa ? 'text-stone bg-stone/10' : 'text-emerald-deep bg-emerald-deep/10'}`}>{brand.ngayXoa ? 'Ẩn' : 'Hiện'}</span><button onClick={() => startEdit(brand)} className="p-2 text-stone hover:text-gold hover:bg-gold/10 rounded-lg" title="Sửa"><Pencil className="h-4 w-4" /></button><button onClick={() => handleToggle(brand.maThuongHieu)} className="p-2 text-stone hover:text-noir hover:bg-ivory-100 rounded-lg" title={brand.ngayXoa ? 'Hiện' : 'Ẩn'}>{brand.ngayXoa ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button></>}</div></div>)}</div>}
    </div>
    <ConfirmDialog open={confirmSave} title="Thêm thương hiệu" message={`Bạn chắc chắn muốn tạo thương hiệu "${name}"?`} confirmText="Tạo" variant="gold" onConfirm={handleAdd} onCancel={() => setConfirmSave(false)} />
    <ConfirmDialog open={confirmEdit !== null} title="Cập nhật thương hiệu" message={`Bạn chắc chắn muốn cập nhật thương hiệu thành "${editName}"?`} confirmText="Lưu" variant="gold" onConfirm={handleSave} onCancel={() => setConfirmEdit(null)} />
  </div>
}
