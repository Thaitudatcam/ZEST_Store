import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Search, Package, Layers } from 'lucide-react'
import { createCampaign, updateCampaign, getCampaign } from '../../api/admin'
import { getProducts, getProductVariants } from '../../api/products'
import SafeImg from '../../components/SafeImg'
import ConfirmDialog from '../../components/ConfirmDialog'

const VND = (n) => { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }

const variantColor = (v) =>
  v.mauSac?.mauSac || (typeof v.mauSac === 'string' ? v.mauSac : '') || v.tenMauSac || '—'
const variantColorHex = (v) => v.mauSac?.maMauHex || v.maMauHex || ''
const variantSize = (v) =>
  v.kichCo?.kichCo || (typeof v.kichCo === 'string' ? v.kichCo : '') || v.tenKichCo || '—'

export default function AdminCampaignForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [form, setForm] = useState({
    tenChuongTrinh: '', kieuGiamGia: 1, giaTriGiam: '', ngayBatDau: '', ngayKetThuc: '',
  })
  const [loadingDetail, setLoadingDetail] = useState(isEdit)
  const [products, setProducts] = useState([])
  const [prodSearch, setProdSearch] = useState('')
  const [selectedProducts, setSelectedProducts] = useState([])
  const [variantCache, setVariantCache] = useState({})
  const [loadingVariants, setLoadingVariants] = useState({})
  const [selectedVariants, setSelectedVariants] = useState([])
  const [saving, setSaving] = useState(false)
  const [confirmSave, setConfirmSave] = useState(false)
  const [varSearch, setVarSearch] = useState('')
  const [filterColor, setFilterColor] = useState('')
  const [filterSize, setFilterSize] = useState('')
  const [priceRange, setPriceRange] = useState([0, 3000000])

  useEffect(() => {
    getProducts({ page: 0, size: 200 })
      .then(r => setProducts(r.content || r || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!isEdit) return
    getCampaign(id)
      .then(async (c) => {
        const start = c.ngayBatDau ? String(c.ngayBatDau).slice(0, 16) : ''
        const end = c.ngayKetThuc ? String(c.ngayKetThuc).slice(0, 16) : ''
        setForm({
          tenChuongTrinh: c.tenChuongTrinh || '',
          kieuGiamGia: c.kieuGiamGia ?? 1,
          giaTriGiam: c.giaTriGiam ?? '',
          ngayBatDau: start,
          ngayKetThuc: end,
        })
        setSelectedProducts(c.maSanPhamIds || [])
        setSelectedVariants(c.maBienTheIds || [])
        const cache = {}
        await Promise.all((c.maSanPhamIds || []).map(async (pid) => {
          try { cache[pid] = await getProductVariants(pid) || [] }
          catch { cache[pid] = [] }
        }))
        setVariantCache(cache)
      })
      .catch(() => {
        alert('Không tải được chương trình')
        navigate('/admin/campaigns')
      })
      .finally(() => setLoadingDetail(false))
  }, [id])

  const filteredProducts = useMemo(() => {
    const q = prodSearch.trim().toLowerCase()
    if (!q) return products
    return products.filter(sp =>
      (sp.tenSanPham || '').toLowerCase().includes(q) ||
      String(sp.maSanPham || '').includes(q),
    )
  }, [products, prodSearch])

  const loadVariants = async (productId) => {
    if (variantCache[productId]) return
    setLoadingVariants(m => ({ ...m, [productId]: true }))
    try {
      const r = await getProductVariants(productId)
      setVariantCache(m => ({ ...m, [productId]: r || [] }))
    } catch {
      setVariantCache(m => ({ ...m, [productId]: [] }))
    } finally {
      setLoadingVariants(m => ({ ...m, [productId]: false }))
    }
  }

  const toggleProduct = (pid) => {
    setSelectedProducts(prev => {
      if (prev.includes(pid)) {
        const ids = new Set((variantCache[pid] || []).map(v => v.maBienThe))
        setSelectedVariants(sv => sv.filter(x => !ids.has(x)))
        return prev.filter(x => x !== pid)
      }
      loadVariants(pid)
      return [...prev, pid]
    })
  }

  const toggleVariant = (variantId) => {
    setSelectedVariants(prev =>
      prev.includes(variantId) ? prev.filter(x => x !== variantId) : [...prev, variantId],
    )
  }

  const toggleAllVariants = (productId) => {
    const list = variantCache[productId] || []
    const ids = list.map(v => v.maBienThe)
    const all = ids.length > 0 && ids.every(x => selectedVariants.includes(x))
    setSelectedVariants(prev =>
      all ? prev.filter(x => !ids.includes(x)) : [...new Set([...prev, ...ids])],
    )
  }

  const toggleAllProducts = () => {
    const ids = filteredProducts.map(sp => sp.maSanPham)
    const allSelected = ids.length > 0 && ids.every(x => selectedProducts.includes(x))
    if (allSelected) {
      ids.forEach(pid => {
        const vids = new Set((variantCache[pid] || []).map(v => v.maBienThe))
        setSelectedVariants(sv => sv.filter(x => !vids.has(x)))
      })
      setSelectedProducts(prev => prev.filter(x => !ids.includes(x)))
    } else {
      ids.forEach(pid => loadVariants(pid))
      setSelectedProducts(prev => [...new Set([...prev, ...ids])])
    }
  }

  const toggleAllFilteredVariants = () => {
    const ids = filteredVariants.map(v => v.maBienThe)
    const all = ids.length > 0 && ids.every(x => selectedVariants.includes(x))
    setSelectedVariants(prev =>
      all ? prev.filter(x => !ids.includes(x)) : [...new Set([...prev, ...ids])],
    )
  }

  const preview = useMemo(() => {
    const val = Number(form.giaTriGiam)
    if (!val || val <= 0) return null
    if (form.kieuGiamGia === 1 && val > 100) return null
    return { kieu: Number(form.kieuGiamGia), value: val }
  }, [form.giaTriGiam, form.kieuGiamGia])

  const previewPrice = (gia) => {
    if (!preview || gia == null) return null
    const g = Number(gia)
    if (preview.kieu === 1) return Math.max(0, Math.round(g * (1 - preview.value / 100)))
    return Math.max(0, Math.round(g - preview.value))
  }

  const previewPctOf = (sp) => {
    if (!preview) return null
    if (preview.kieu === 1) return preview.value
    const min = Number(sp.giaThapNhat ?? sp.giaTrungBinh ?? 0)
    if (!min || min <= 0) return null
    return Math.min(100, Math.round((preview.value * 100) / min * 10) / 10)
  }

  const previewVariantIds = useMemo(() => {
    if (!preview) return new Set()
    if (selectedProducts.length === 0) return null
    const set = new Set(selectedVariants)
    for (const pid of selectedProducts) {
      const list = variantCache[pid] || []
      if (list.length > 0 && !list.some(v => selectedVariants.includes(v.maBienThe))) {
        list.forEach(v => set.add(v.maBienThe))
      }
    }
    return set
  }, [preview, selectedProducts, selectedVariants, variantCache])

  const inPreviewScope = (sp, v) => {
    if (!preview) return false
    if (v) {
      if (previewVariantIds === null) return true
      return previewVariantIds.has(v.maBienThe)
    }
    return selectedProducts.length === 0 || selectedProducts.includes(sp.maSanPham)
  }

  const allVariantList = useMemo(() => {
    const list = []
    for (const pid of selectedProducts) {
      const variants = variantCache[pid] || []
      for (const v of variants) {
        list.push({ ...v, sanPham: products.find(p => p.maSanPham === pid) })
      }
    }
    return list
  }, [selectedProducts, variantCache, products])

  const filteredVariants = useMemo(() => {
    const q = varSearch.trim().toLowerCase()
    const colors = [...new Set(allVariantList.map(v => variantColor(v)).filter(Boolean))]
    const sizes = [...new Set(allVariantList.map(v => variantSize(v)).filter(Boolean))]
    return allVariantList.filter(v => {
      if (q) {
        const name = (v.sanPham?.tenSanPham || '').toLowerCase()
        const sku = (v.sku || '').toLowerCase()
        if (!name.includes(q) && !sku.includes(q)) return false
      }
      if (filterColor && variantColor(v) !== filterColor) return false
      if (filterSize && variantSize(v) !== filterSize) return false
      const gia = Number(v.gia || 0)
      if (gia < priceRange[0] || gia > priceRange[1]) return false
      return true
    })
  }, [allVariantList, varSearch, filterColor, filterSize, priceRange])

  const availableColors = useMemo(() => [...new Set(allVariantList.map(v => variantColor(v)).filter(Boolean))], [allVariantList])
  const availableSizes = useMemo(() => [...new Set(allVariantList.map(v => variantSize(v)).filter(Boolean))], [allVariantList])
  const maxPrice = useMemo(() => Math.max(...allVariantList.map(v => Number(v.gia || 0)), 300000), [allVariantList])

  const requestCreate = (e) => {
    e.preventDefault()
    if (!form.tenChuongTrinh.trim()) { alert('Vui lòng nhập tên đợt giảm giá'); return }
    if (!form.giaTriGiam || Number(form.giaTriGiam) <= 0) { alert('Giá trị giảm phải lớn hơn 0!'); return }
    if (form.kieuGiamGia === 1 && Number(form.giaTriGiam) > 100) { alert('Phần trăm giảm không được vượt quá 100%!'); return }
    if (form.ngayBatDau && form.ngayKetThuc && new Date(form.ngayBatDau) >= new Date(form.ngayKetThuc)) {
      alert('Ngày bắt đầu phải nhỏ hơn ngày kết thúc!'); return
    }
    setConfirmSave(true)
  }

  const handleSubmit = async () => {
    setConfirmSave(false)
    setSaving(true)
    try {
      const cache = { ...variantCache }
      const missing = selectedProducts.filter(id => !cache[id])
      if (missing.length > 0) {
        const results = await Promise.all(missing.map(id => getProductVariants(id).catch(() => [])))
        missing.forEach((id, i) => { cache[id] = results[i] || [] })
        setVariantCache(cache)
      }
      let bienTheIds = [...selectedVariants]
      for (const pid of selectedProducts) {
        const list = cache[pid] || []
        if (list.length === 0) continue
        const picked = list.filter(v => selectedVariants.includes(v.maBienThe)).length
        if (picked === 0) bienTheIds.push(...list.map(v => v.maBienThe))
      }
      bienTheIds = [...new Set(bienTheIds)]
      const payload = {
        tenChuongTrinh: form.tenChuongTrinh.trim(),
        loaiTrigger: 2,
        kieuGiamGia: Number(form.kieuGiamGia),
        giaTriGiam: Number(form.giaTriGiam),
        maSanPhamIds: selectedProducts.length > 0 ? selectedProducts : null,
        maBienTheIds: bienTheIds.length > 0 ? bienTheIds : null,
        ngayBatDau: form.ngayBatDau ? form.ngayBatDau + ':00' : null,
        ngayKetThuc: form.ngayKetThuc ? form.ngayKetThuc + ':00' : null,
      }
      if (isEdit) await updateCampaign(id, payload)
      else await createCampaign(payload)
      navigate('/admin/campaigns')
    } catch (err) {
      alert(err.response?.data?.message || (isEdit ? 'Lỗi sửa' : 'Lỗi tạo'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <button
        onClick={() => navigate('/admin/campaigns')}
        className="flex items-center gap-1 text-sm text-stone hover:text-ink-soft mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
      </button>

      <h1 className="text-xl font-bold mb-6">
        {isEdit ? 'Sửa đợt giảm giá' : 'Thêm đợt giảm giá'}
      </h1>

      {loadingDetail && <p className="text-sm text-stone py-8 text-center">Đang tải...</p>}
      {!loadingDetail && (
      <form onSubmit={requestCreate}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* TRÁI: form */}
          <div className="bg-ivory rounded-2xl shadow-sm border p-6 space-y-4 h-fit">
            <div>
              <label className="text-sm font-medium text-ink-soft mb-1 block">Tên đợt giảm giá</label>
              <input
                value={form.tenChuongTrinh}
                onChange={e => setForm({ ...form, tenChuongTrinh: e.target.value })}
                placeholder="Nhập tên đợt giảm giá"
                required
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold bg-white"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-ink-soft mb-1 block">Giá trị giảm (%)</label>
              <div className="relative">
                <input
                  type="number"
                  value={form.giaTriGiam}
                  onChange={e => setForm({ ...form, giaTriGiam: e.target.value, kieuGiamGia: 1 })}
                  placeholder="Nhập phần trăm giảm giá"
                  min="0"
                  max="100"
                  required
                  className="w-full border rounded-lg px-4 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-gold bg-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone text-sm">%</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-ink-soft mb-1 block">Ngày bắt đầu</label>
              <input
                type="datetime-local"
                value={form.ngayBatDau}
                onChange={e => setForm({ ...form, ngayBatDau: e.target.value })}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold bg-white"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-ink-soft mb-1 block">Ngày kết thúc</label>
              <input
                type="datetime-local"
                value={form.ngayKetThuc}
                onChange={e => setForm({ ...form, ngayKetThuc: e.target.value })}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold bg-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <span className="text-sm text-stone">Biến thể đã chọn</span>
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gold text-noir text-xs font-bold">
                {selectedVariants.length}
              </span>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => navigate('/admin/campaigns')}
                className="flex-1 px-4 py-2.5 border border-stone/20 rounded-lg text-sm font-medium hover:bg-ivory-100 transition bg-white">
                Hủy
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 bg-gold text-noir px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gold-hover disabled:opacity-50 transition">
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>

          {/* PHẢI: danh sách sản phẩm */}
          <div className="bg-ivory rounded-2xl shadow-sm border p-6 space-y-3 h-fit">
            <h2 className="font-semibold text-ink-soft flex items-center gap-2">
              <Package className="h-4 w-4 text-gold" /> Danh sách sản phẩm
            </h2>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone" />
              <input
                value={prodSearch}
                onChange={e => setProdSearch(e.target.value)}
                placeholder="Tìm theo mã hoặc tên sản phẩm..."
                className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white"
              />
            </div>
            <div className="max-h-80 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-ivory-100 border-b sticky top-0">
                  <tr>
                    <th className="w-10 px-2 py-2">
                      <button type="button" onClick={(e) => { e.stopPropagation(); toggleAllProducts() }}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition ${filteredProducts.length > 0 && filteredProducts.every(sp => selectedProducts.includes(sp.maSanPham)) ? 'bg-gold text-noir' : 'bg-ivory-100 text-stone hover:bg-gold/30'}`}>
                        {filteredProducts.length > 0 && filteredProducts.every(sp => selectedProducts.includes(sp.maSanPham)) ? '✓' : '+'}
                      </button>
                    </th>
                    <th className="text-center px-2 py-2 font-semibold text-stone w-14">Ảnh</th>
                    <th className="text-left px-2 py-2 font-semibold text-stone">MÃ SẢN PHẨM</th>
                    <th className="text-left px-2 py-2 font-semibold text-stone">TÊN SẢN PHẨM</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredProducts.map(sp => (
                    <tr
                      key={sp.maSanPham}
                      onClick={() => toggleProduct(sp.maSanPham)}
                      className={`cursor-pointer transition ${selectedProducts.includes(sp.maSanPham) ? 'bg-gold/10' : 'hover:bg-ivory-100'}`}
                    >
                      <td className="px-2 py-1.5 text-center">
                        <button type="button" onClick={(e) => { e.stopPropagation(); toggleProduct(sp.maSanPham) }}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold transition ${selectedProducts.includes(sp.maSanPham) ? 'bg-gold text-noir' : 'bg-ivory-100 text-stone hover:bg-gold/30'}`}>
                          {selectedProducts.includes(sp.maSanPham) ? '✓' : '+'}
                        </button>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <div className="relative w-12 h-12 mx-auto">
                          <SafeImg
                            src={sp.urlAnhDaiDien}
                            className="w-12 h-12 rounded-lg object-cover bg-ivory-100"
                            fallback="https://placehold.co/48x48/e2e8f0/475569?text=P"
                          />
                          {inPreviewScope(sp) && previewPctOf(sp) != null && (
                            <span className="absolute -top-1.5 -right-2 bg-bordeaux text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                              -{previewPctOf(sp)}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-1.5 text-xs font-mono text-stone whitespace-nowrap">
                        SP{String(sp.maSanPham).padStart(3, '0')}
                      </td>
                      <td className="px-2 py-1.5">
                        <span className="truncate max-w-[220px] block">{sp.tenSanPham}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProducts.length === 0 && (
                <p className="text-xs text-stone text-center py-4">Không tìm thấy sản phẩm</p>
              )}
            </div>
          </div>
        </div>

        {/* DƯỚI: biến thể */}
        {selectedProducts.length > 0 && (
          <div className="bg-ivory rounded-2xl shadow-sm border p-6 space-y-4 mb-6">
            <h2 className="font-semibold text-ink-soft flex items-center gap-2">
              <Layers className="h-4 w-4 text-gold" /> Danh sách biến thể
            </h2>

            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone" />
                <input
                  value={varSearch}
                  onChange={e => setVarSearch(e.target.value)}
                  placeholder="Tìm mã chi tiết / tên sản phẩm..."
                  className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white"
                />
              </div>
              <select value={filterColor} onChange={e => setFilterColor(e.target.value)}
                className="bg-white border border-stone/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold">
                <option value="">Màu sắc</option>
                {availableColors.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filterSize} onChange={e => setFilterSize(e.target.value)}
                className="bg-white border border-stone/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold">
                <option value="">Size</option>
                {availableSizes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="text-xs text-stone">
              Khoảng giá: {VND(priceRange[0])} - {VND(maxPrice)}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-ivory-100 border-y">
                  <tr>
                    <th className="w-10 px-2 py-2">
                      <button type="button" onClick={(e) => { e.stopPropagation(); toggleAllFilteredVariants() }}
                        className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold transition ${filteredVariants.length > 0 && filteredVariants.every(v => selectedVariants.includes(v.maBienThe)) ? 'bg-gold text-noir' : 'bg-ivory-100 text-stone hover:bg-gold/30'}`}>
                        {filteredVariants.length > 0 && filteredVariants.every(v => selectedVariants.includes(v.maBienThe)) ? '✓' : '+'}
                      </button>
                    </th>
                    <th className="text-center px-2 py-2 font-semibold text-stone w-14">Ảnh</th>
                    <th className="text-left px-2 py-2 font-semibold text-stone">TÊN SẢN PHẨM</th>
                    <th className="text-left px-2 py-2 font-semibold text-stone">MÃ CHI TIẾT</th>
                    <th className="text-center px-2 py-2 font-semibold text-stone">MÀU SẮC</th>
                    <th className="text-center px-2 py-2 font-semibold text-stone">KÍCH CỠ</th>
                    <th className="text-center px-2 py-2 font-semibold text-stone">SỐ LƯỢNG</th>
                    <th className="text-right px-2 py-2 font-semibold text-stone">GIÁ BÁN</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredVariants.map(v => (
                    <tr
                      key={v.maBienThe}
                      onClick={() => toggleVariant(v.maBienThe)}
                      className={`cursor-pointer transition ${selectedVariants.includes(v.maBienThe) ? 'bg-gold/10' : 'hover:bg-ivory-100'}`}
                    >
                      <td className="px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedVariants.includes(v.maBienThe)}
                          onChange={() => toggleVariant(v.maBienThe)}
                          onClick={e => e.stopPropagation()}
                          className="h-4 w-4 accent-gold"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <div className="relative w-10 h-10 mx-auto">
                          <SafeImg
                            src={v.urlAnh || v.sanPham?.urlAnhDaiDien}
                            className="w-10 h-10 rounded-lg object-cover bg-ivory-100"
                            fallback="https://placehold.co/40x40/e2e8f0/475569?text=P"
                          />
                          {inPreviewScope(v.sanPham, v) && preview && (
                            <span className="absolute -top-1 -right-1.5 bg-bordeaux text-white text-[8px] font-bold px-1 py-0.5 rounded-full whitespace-nowrap">
                              -{preview.kieu === 1 ? preview.value : Math.round((preview.value / Number(v.gia || 1)) * 100)}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        <span className="truncate max-w-[180px] block">{v.sanPham?.tenSanPham || '—'}</span>
                      </td>
                      <td className="px-2 py-1.5 text-xs font-mono font-semibold whitespace-nowrap">
                        {v.sku || '—'}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {variantColorHex(v) && (
                            <span className="w-3.5 h-3.5 rounded-full border shrink-0" style={{ backgroundColor: variantColorHex(v) }} />
                          )}
                          <span className="text-xs">{variantColor(v)}</span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 text-center text-xs">{variantSize(v)}</td>
                      <td className="px-2 py-1.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${(v.tonKho ?? 0) > 0 ? 'bg-emerald-deep/20 text-emerald-deep' : 'bg-bordeaux/20 text-bordeaux'}`}>
                          {v.tonKho ?? 0}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-right text-xs whitespace-nowrap">
                        {inPreviewScope(v.sanPham, v) && previewPrice(v.gia) != null && previewPrice(v.gia) !== Number(v.gia) ? (
                          <>
                            <span className="font-bold text-emerald-deep">{VND(previewPrice(v.gia))}</span>
                            <span className="block text-[10px] text-stone line-through">{VND(v.gia)}</span>
                          </>
                        ) : (
                          <span className="font-semibold">{VND(v.gia)}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredVariants.length === 0 && (
                <p className="text-xs text-stone text-center py-4">Không có biến thể phù hợp</p>
              )}
            </div>
          </div>
        )}

        {selectedProducts.length === 0 && (
          <div className="flex gap-3 pb-4">
            <button type="button" onClick={() => navigate('/admin/campaigns')}
              className="flex-1 border px-6 py-2.5 rounded-lg font-semibold hover:bg-ivory-100 bg-ivory transition">
              Hủy
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-gold text-noir px-6 py-2.5 rounded-lg font-semibold hover:bg-gold-hover disabled:opacity-50 transition">
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        )}
      </form>
      )}

      <ConfirmDialog
        open={confirmSave}
        title={isEdit ? 'Lưu thay đổi' : 'Tạo đợt giảm giá'}
        message={isEdit
          ? `Bạn chắc chắn muốn lưu thay đổi cho "${form.tenChuongTrinh}"?`
          : `Bạn chắc chắn muốn tạo đợt giảm giá "${form.tenChuongTrinh}"?`}
        confirmText={isEdit ? 'Lưu' : 'Tạo'}
        variant="gold"
        onConfirm={handleSubmit}
        onCancel={() => setConfirmSave(false)}
      />
    </div>
  )
}
