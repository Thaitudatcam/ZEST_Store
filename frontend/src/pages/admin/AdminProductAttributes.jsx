import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Trash2, Tags, Search, Palette, Ruler, MapPin, Shirt, Sparkles, Layers, FolderTree } from 'lucide-react'
import api from '../../api/axios'
import { useToast } from '../../context/ToastContext'
import AdminCategories from './AdminCategories'
import AdminBrands from './AdminBrands'

const TYPES = {
  category: { title: 'Danh mục', icon: FolderTree },
  brand: { title: 'Thương hiệu', icon: Sparkles },
  color: { title: 'Màu sắc', icon: Palette, endpoint: '/colors', valueKey: 'mauSac', idKey: 'maMauSac', payload: (value, hex) => ({ tenMauSac: value, maMauHex: hex || '#000000' }) },
  size: { title: 'Kích cỡ', icon: Ruler, endpoint: '/sizes', valueKey: 'kichCo', idKey: 'maKichCo', payload: (value) => ({ tenKichCo: value }) },
  origin: { title: 'Xuất xứ', icon: MapPin, loai: 'XUAT_XU' },
  shirtType: { title: 'Loại áo', icon: Shirt, loai: 'LOAI_AO' },
  fit: { title: 'Kiểu dáng', icon: Sparkles, loai: 'KIEU_DANG' },
  material: { title: 'Chất liệu', icon: Layers, loai: 'CHAT_LIEU' },
  collar: { title: 'Cổ áo', icon: Shirt, loai: 'CO_AO' },
}

export default function AdminProductAttributes() {
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const typeKey = params.get('type') || 'color'
  const config = TYPES[typeKey] || TYPES.color
  const [items, setItems] = useState([])
  const [value, setValue] = useState('')
  const [hex, setHex] = useState('#000000')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const isCollection = typeKey === 'category' || typeKey === 'brand'
  const isGeneric = Boolean(config.loai)

  const loadItems = async () => {
    setLoading(true)
    try {
      const response = isGeneric
        ? await api.get('/thuoc-tinh', { params: { loai: config.loai } })
        : await api.get(config.endpoint)
      setItems(Array.isArray(response.data) ? response.data : [])
    } catch {
      toast.error(`Không thể tải ${config.title.toLowerCase()}`)
    } finally { setLoading(false) }
  }

  useEffect(() => { if (isCollection) { setLoading(false); return }; loadItems() }, [typeKey])

  const getValue = (item) => isGeneric ? item.giaTri : item[config.valueKey]
  const getId = (item) => isGeneric ? item.maThuocTinh : item[config.idKey]
  const getHex = (item) => item.maMauHex || item.hex || item.maMau || '#000000'
  const visibleItems = items.filter(item => getValue(item)?.toLowerCase().includes(search.trim().toLowerCase()))

  const handleAdd = async (event) => {
    event.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    try {
      const response = isGeneric
        ? await api.post('/thuoc-tinh', { loaiThuocTinh: config.loai, giaTri: trimmed })
        : await api.post(config.endpoint, config.payload(trimmed, hex))
      setItems(prev => [...prev, response.data]); setValue(''); toast.success(`Đã thêm ${config.title.toLowerCase()}`)
    } catch (error) { toast.error(error.response?.data?.message || `Không thể thêm ${config.title.toLowerCase()}`) }
  }

  const canDelete = isGeneric || typeKey === 'color'
  const handleDelete = async (item) => {
    if (!canDelete || !window.confirm(`Xóa “${getValue(item)}”?`)) return
    try {
      const endpoint = isGeneric ? `/thuoc-tinh/${getId(item)}` : `/colors/${getId(item)}`
      await api.delete(endpoint); setItems(prev => prev.filter(current => getId(current) !== getId(item))); toast.success('Đã xóa')
    } catch { toast.error('Không thể xóa thuộc tính này') }
  }

  const description = useMemo(() => isGeneric
    ? 'Thuộc tính mô tả sản phẩm, dùng để chọn khi tạo hoặc chỉnh sửa sản phẩm.'
    : 'Thuộc tính biến thể, dùng để tạo SKU và quản lý tồn kho.', [isGeneric])

  return (
    <div className="max-w-[1440px] mx-auto pb-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-noir via-noir-800 to-noir p-6 sm:p-7 mb-6 shadow-xl">
        <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4"><div className="p-3 rounded-2xl bg-gold text-noir shadow-lg"><Tags className="h-6 w-6" /></div><div><p className="text-gold text-xs font-bold uppercase tracking-[0.18em] mb-1">Dữ liệu dùng chung</p><h1 className="text-2xl sm:text-3xl font-bold text-ivory">Danh mục & thuộc tính</h1><p className="text-sm text-ivory/60 mt-1">Quản lý dữ liệu chuẩn cho toàn bộ sản phẩm.</p></div></div>
          {!isCollection && <div className="rounded-xl bg-white/10 px-4 py-2 text-sm text-ivory"><span className="text-gold font-bold text-lg">{items.length}</span> {config.title.toLowerCase()}</div>}
        </div>
      </div>
      <div className="bg-ivory border rounded-2xl p-2 mb-6 shadow-sm"><div className="flex flex-wrap gap-1.5">{Object.entries(TYPES).map(([key, type]) => <button key={key} onClick={() => { setSearch(''); setParams({ type: key }) }} className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${typeKey === key ? 'bg-noir text-ivory shadow-md' : 'text-stone hover:bg-gold/10 hover:text-noir'}`}><type.icon className={`h-4 w-4 ${typeKey === key ? 'text-gold' : 'text-stone'}`} /> {type.title}</button>)}</div></div>
      {isCollection ? (typeKey === 'category' ? <AdminCategories embedded /> : <AdminBrands embedded />) : <>
        <div className="rounded-2xl border border-gold/20 bg-gradient-to-r from-gold/10 via-ivory to-ivory p-5 sm:p-6 mb-5 shadow-sm">
          <div className="flex items-start gap-3 mb-5"><div className="p-2 rounded-xl bg-gold/20 text-gold"><config.icon className="h-5 w-5" /></div><div><h2 className="font-bold text-lg">{config.title}</h2><p className="text-sm text-stone mt-0.5">{description}</p></div></div>
          <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3"><div className="flex-1 min-w-[220px]"><label className="block text-xs font-bold uppercase tracking-wide text-stone mb-2">Tên {config.title.toLowerCase()}</label><input value={value} onChange={event => setValue(event.target.value)} placeholder={`Nhập ${config.title.toLowerCase()}...`} className="w-full bg-white border border-stone/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/60 focus:border-gold transition" /></div>{typeKey === 'color' && <div><label className="block text-xs font-bold uppercase tracking-wide text-stone mb-2">Mã màu</label><input type="color" value={hex} onChange={event => setHex(event.target.value)} className="h-11 w-14 bg-white border border-stone/20 rounded-xl p-1.5 cursor-pointer" /></div>}<button type="submit" className="flex items-center gap-2 px-5 py-3 bg-gold text-noir rounded-xl text-sm font-bold shadow-sm hover:bg-gold-hover hover:-translate-y-0.5 transition"><Plus className="h-4 w-4" /> Thêm mới</button></form>
        </div>
        <div className="bg-ivory rounded-2xl border overflow-hidden shadow-sm"><div className="px-5 sm:px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">Danh sách {config.title.toLowerCase()}</h2><p className="text-xs text-stone mt-0.5">{visibleItems.length} mục hiển thị</p></div><div className="relative w-full sm:w-60"><Search className="absolute h-4 w-4 left-3 top-1/2 -translate-y-1/2 text-stone" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder={`Tìm ${config.title.toLowerCase()}...`} className="w-full rounded-xl border border-stone/20 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/60" /></div></div>
          {loading ? <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-3">{[1, 2, 3, 4].map(index => <div key={index} className="h-16 rounded-xl bg-ivory-100 animate-pulse" />)}</div> : visibleItems.length === 0 ? <div className="p-10 text-center"><div className="inline-flex p-3 rounded-2xl bg-ivory-100 text-stone mb-3"><config.icon className="h-6 w-6" /></div><p className="font-semibold">Chưa có dữ liệu phù hợp</p><p className="text-sm text-stone mt-1">Thêm một giá trị mới ở phía trên để bắt đầu.</p></div> : <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">{visibleItems.map(item => <div key={getId(item)} className="group flex items-center justify-between rounded-xl border border-stone/10 bg-white px-4 py-3.5 hover:border-gold/50 hover:shadow-md transition-all"><div className="flex items-center gap-3 min-w-0">{typeKey === 'color' ? <span className="h-9 w-9 rounded-xl border-2 border-white shadow ring-1 ring-stone/15 shrink-0" style={{ backgroundColor: getHex(item) }} /> : <div className="h-9 w-9 rounded-xl bg-gold/10 text-gold flex items-center justify-center shrink-0"><config.icon className="h-4 w-4" /></div>}<span className="font-semibold truncate">{getValue(item)}</span></div>{canDelete && <button onClick={() => handleDelete(item)} className="p-2 text-stone hover:text-bordeaux hover:bg-bordeaux/10 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition" title="Xóa"><Trash2 className="h-4 w-4" /></button>}</div>)}</div>}
        </div>
      </>}
    </div>
  )
}
