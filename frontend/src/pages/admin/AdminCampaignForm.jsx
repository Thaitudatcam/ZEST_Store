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

  useEffect(() => {
    getProducts({ page: 0, size: 200 })
      .then(r => setProducts(r.content || r || []))
      .catch(() => {})
  }, [])

  // Chế độ sửa: nạp chi tiết + preselect SP/biến thể
  useEffect(() => {
    if (!isEdit) return
    getCampaign(id)
      .then(async (c) => {
        setForm({
          tenChuongTrinh: c.tenChuongTrinh || '',
          kieuGiamGia: c.kieuGiamGia ?? 1,
          giaTriGiam: c.giaTriGiam ?? '',
          ngayBatDau: c.ngayBatDau ? String(c.ngayBatDau).slice(0, 10) : '',
          ngayKetThuc: c.ngayKetThuc ? String(c.ngayKetThuc).slice(0, 10) : '',
        })
        setSelectedProducts(c.maSanPhamIds || [])
        setSelectedVariants(c.maBienTheIds || [])
        // Nạp sẵn biến thể của các SP đã chọn để hiện bảng dưới
        const cache = {}
        await Promise.all((c.maSanPhamIds || []).map(async (pid) => {
          try { cache[pid] = await getProductVariants(pid) || [] }
          catch { cache[pid] = [] }
        }))
        setVariantCache(cache)
      })
      .catch(() => {
        alert('Không tải được chương trình (backend có thể chưa restart để có API chi tiết)')
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

  const toggleProduct = (id) => {
    setSelectedProducts(prev => {
      if (prev.includes(id)) {
        // Bỏ chọn SP -> bỏ luôn biến thể của nó
        const ids = new Set((variantCache[id] || []).map(v => v.maBienThe))
        setSelectedVariants(sv => sv.filter(x => !ids.has(x)))
        return prev.filter(x => x !== id)
      }
      loadVariants(id)
      return [...prev, id]
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

  // Preview giảm giá live theo ô giá trị giảm đang nhập
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

  // Badge % preview cho từng SP (tiền mặt -> quy ra % theo giá thấp nhất)
  const previewPctOf = (sp) => {
    if (!preview) return null
    if (preview.kieu === 1) return preview.value
    const min = Number(sp.giaThapNhat ?? sp.giaTrungBinh ?? 0)
    if (!min || min <= 0) return null
    return Math.min(100, Math.round((preview.value * 100) / min * 10) / 10)
  }

  // Tập biến thể thuộc phạm vi giảm theo quy tắc:
  // SP không tích biến thể nào -> tất cả biến thể của nó; có tích -> chỉ những đã tích.
  // null = chưa chọn SP nào -> phạm vi toàn shop.
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

  const requestCreate = (e) => {
    e.preventDefault()
    if (!form.tenChuongTrinh.trim()) { alert('Vui lòng nhập tên chương trình'); return }
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
      // Quy tắc phạm vi theo từng SP:
      // - SP được tích mà KHÔNG tích biến thể nào -> giảm TẤT CẢ biến thể của SP đó
      //   (mở rộng tường minh để backend chỉ giảm đúng tập đã chốt)
      // - SP có tích biến thể -> chỉ giảm những biến thể đã tích
      // - Không tích gì cả -> áp dụng toàn bộ shop
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
        ngayBatDau: form.ngayBatDau ? form.ngayBatDau + 'T00:00:00' : null,
        ngayKetThuc: form.ngayKetThuc ? form.ngayKetThuc + 'T23:59:59' : null,
      }
      if (isEdit) await updateCampaign(id, payload)
      else await createCampaign(payload)
      navigate('/admin/campaigns')
    } catch (err) {
      alert(err.response?.data?.message || (isEdit ? 'Lỗi sửa chương trình' : 'Lỗi tạo chương trình'))
    } finally {
      setSaving(false)
    }
  }

  const selectedProductObjs = useMemo(
    () => selectedProducts
      .map(id => products.find(p => p.maSanPham === id))
      .filter(Boolean),
    [selectedProducts, products],
  )

  return (
    <div className="max-w-6xl mx-auto">
      <button
        onClick={() => navigate('/admin/campaigns')}
        className="flex items-center gap-1 text-sm text-stone hover:text-ink-soft mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
      </button>

      <h1 className="text-2xl font-bold mb-6">
        {isEdit ? 'Sửa chương trình quà tặng' : 'Thêm chương trình quà tặng'}
      </h1>

      {loadingDetail && <p className="text-sm text-stone py-8 text-center">Đang tải chương trình...</p>}
      {!loadingDetail && (
      <form onSubmit={requestCreate}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* TRÁI: thông tin chương trình */}
          <div className="bg-ivory rounded-2xl shadow-sm border p-6 space-y-4 h-fit">
            <h2 className="font-semibold text-ink-soft">Thông tin chương trình</h2>
            <div>
              <label className="text-sm font-medium text-ink-soft mb-1 block">Tên chương trình *</label>
              <input
                value={form.tenChuongTrinh}
                onChange={e => setForm({ ...form, tenChuongTrinh: e.target.value })}
                placeholder="VD: Sale 20/10"
                required
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-ink-soft mb-1 block">Giá trị giảm *</label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, kieuGiamGia: 1, giaTriGiam: '' })}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition ${form.kieuGiamGia === 1 ? 'border-gold bg-gold/10 text-gold' : 'border-stone/20 text-stone hover:border-stone/30'}`}
                >
                  % Theo phần trăm
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, kieuGiamGia: 2, giaTriGiam: '' })}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition ${form.kieuGiamGia === 2 ? 'border-gold bg-gold/10 text-gold' : 'border-stone/20 text-stone hover:border-stone/30'}`}
                >
                  ₫ Giảm tiền mặt
                </button>
              </div>
              <input
                type="number"
                value={form.giaTriGiam}
                onChange={e => setForm({ ...form, giaTriGiam: e.target.value })}
                placeholder={form.kieuGiamGia === 1 ? 'Phần trăm giảm (vd: 10)' : 'Số tiền giảm (vd: 50000)'}
                min="0"
                required
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-ink-soft mb-1 block">Ngày bắt đầu</label>
                <input
                  type="date"
                  value={form.ngayBatDau}
                  onChange={e => setForm({ ...form, ngayBatDau: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-soft mb-1 block">Ngày kết thúc</label>
                <input
                  type="date"
                  value={form.ngayKetThuc}
                  onChange={e => setForm({ ...form, ngayKetThuc: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
            </div>
          </div>

          {/* PHẢI: danh sách sản phẩm */}
          <div className="bg-ivory rounded-2xl shadow-sm border p-6 space-y-3 h-fit">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-ink-soft flex items-center gap-2">
                <Package className="h-4 w-4 text-gold" /> Sản phẩm áp dụng
              </h2>
              <span className="text-xs text-stone">Đã chọn {selectedProducts.length}</span>
            </div>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone" />
              <input
                value={prodSearch}
                onChange={e => setProdSearch(e.target.value)}
                placeholder="Tìm sản phẩm theo tên hoặc mã..."
                className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div className="max-h-80 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-ivory-100 border-b sticky top-0">
                  <tr>
                    <th className="w-10 px-2 py-2"></th>
                    <th className="text-center px-2 py-2 font-semibold text-stone w-14">Ảnh</th>
                    <th className="text-left px-2 py-2 font-semibold text-stone">Mã SP</th>
                    <th className="text-left px-2 py-2 font-semibold text-stone">Tên sản phẩm</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredProducts.map(sp => (
                    <tr
                      key={sp.maSanPham}
                      onClick={() => toggleProduct(sp.maSanPham)}
                      className="cursor-pointer hover:bg-ivory-100"
                    >
                      <td className="px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(sp.maSanPham)}
                          onChange={() => toggleProduct(sp.maSanPham)}
                          onClick={e => e.stopPropagation()}
                          className="h-4 w-4"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <div className="relative w-10 h-10 mx-auto">
                          <SafeImg
                            src={sp.urlAnhDaiDien}
                            className="w-10 h-10 rounded-lg object-cover bg-ivory-100"
                            fallback="https://placehold.co/40x40/e2e8f0/475569?text=P"
                          />
                          {inPreviewScope(sp) && previewPctOf(sp) != null && (
                            <span className="absolute -top-1.5 -right-2 bg-bordeaux text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
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
            <p className="text-[11px] text-stone">Không chọn sản phẩm = áp dụng cho tất cả.</p>
          </div>
        </div>

        {/* DƯỚI: biến thể theo sản phẩm */}
        <div className="bg-ivory rounded-2xl shadow-sm border p-6 space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink-soft flex items-center gap-2">
              <Layers className="h-4 w-4 text-gold" /> Biến thể áp dụng
            </h2>
            <span className="text-xs text-stone">Đã chọn {selectedVariants.length} biến thể</span>
          </div>
          {selectedProductObjs.length === 0 && (
            <p className="text-sm text-stone text-center py-4">Tích chọn sản phẩm ở trên để chọn riêng từng biến thể.</p>
          )}
          {selectedProductObjs.map(sp => {
            const list = variantCache[sp.maSanPham] || []
            const ids = list.map(v => v.maBienThe)
            const picked = ids.filter(x => selectedVariants.includes(x)).length
            const all = ids.length > 0 && picked === ids.length
            // SP không tích biến thể nào -> lúc tạo sẽ giảm TẤT CẢ biến thể của nó
            const scopeText = list.length === 0
              ? ''
              : picked === 0
                ? `Áp dụng: tất cả ${list.length} biến thể`
                : `Áp dụng: ${picked}/${list.length} biến thể`
            return (
              <div key={sp.maSanPham} className="border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-ivory-100/60">
                  <p className="text-sm font-medium truncate flex-1">{sp.tenSanPham}</p>
                  {scopeText && (
                    <span className="text-[11px] text-emerald-deep font-medium shrink-0 ml-2">{scopeText}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleAllVariants(sp.maSanPham)}
                    className="text-xs font-semibold text-gold hover:underline shrink-0 ml-2"
                  >
                    {all ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                  </button>
                </div>
                {loadingVariants[sp.maSanPham] && (
                  <p className="text-xs text-stone px-3 py-2">Đang tải biến thể...</p>
                )}
                {!loadingVariants[sp.maSanPham] && list.length === 0 && (
                  <p className="text-xs text-stone px-3 py-2">Sản phẩm chưa có biến thể.</p>
                )}
                {list.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-ivory-100 border-y">
                        <tr>
                          <th className="w-10 px-2 py-2"></th>
                          <th className="text-center px-2 py-2 font-semibold text-stone w-14">Ảnh</th>
                          <th className="text-left px-2 py-2 font-semibold text-stone">Tên sản phẩm</th>
                          <th className="text-left px-2 py-2 font-semibold text-stone">Mã CTSP</th>
                          <th className="text-center px-2 py-2 font-semibold text-stone">Màu sắc</th>
                          <th className="text-center px-2 py-2 font-semibold text-stone">Kích cỡ</th>
                          <th className="text-center px-2 py-2 font-semibold text-stone">Số lượng</th>
                          <th className="text-right px-2 py-2 font-semibold text-stone">Giá bán</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {list.map(v => (
                          <tr
                            key={v.maBienThe}
                            onClick={() => toggleVariant(v.maBienThe)}
                            className="cursor-pointer hover:bg-ivory-100"
                          >
                            <td className="px-2 py-1.5 text-center">
                              <input
                                type="checkbox"
                                checked={selectedVariants.includes(v.maBienThe)}
                                onChange={() => toggleVariant(v.maBienThe)}
                                onClick={e => e.stopPropagation()}
                                className="h-4 w-4"
                              />
                            </td>
                            <td className="px-2 py-1.5 text-center">
                              <SafeImg
                                src={v.urlAnh || sp.urlAnhDaiDien}
                                className="w-10 h-10 rounded-lg object-cover bg-ivory-100 mx-auto"
                                fallback="https://placehold.co/40x40/e2e8f0/475569?text=P"
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <span className="truncate max-w-[200px] block">{sp.tenSanPham}</span>
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
                              {inPreviewScope(sp, v) && previewPrice(v.gia) != null && previewPrice(v.gia) !== Number(v.gia) ? (
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
                  </div>
                )}
              </div>
            )
          })}
          <p className="text-[11px] text-stone">SP nào không tích biến thể sẽ giảm tất cả biến thể của SP đó; SP nào có tích thì chỉ giảm những biến thể đã tích.</p>
        </div>

        <div className="flex gap-3 pb-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-gold text-noir px-6 py-2.5 rounded-lg font-semibold hover:bg-gold-hover disabled:opacity-50"
          >
            {saving ? (isEdit ? 'Đang lưu...' : 'Đang tạo...') : (isEdit ? 'Lưu thay đổi' : 'Tạo chương trình')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/campaigns')}
            className="border px-6 py-2.5 rounded-lg font-semibold hover:bg-ivory-100 bg-ivory"
          >
            Hủy
          </button>
        </div>
      </form>
      )}

      <ConfirmDialog
        open={confirmSave}
        title={isEdit ? 'Lưu chương trình' : 'Tạo chương trình quà tặng'}
        message={isEdit
          ? `Bạn chắc chắn muốn lưu thay đổi cho chương trình "${form.tenChuongTrinh}"?`
          : `Bạn chắc chắn muốn tạo chương trình "${form.tenChuongTrinh}"?`}
        confirmText={isEdit ? 'Lưu' : 'Tạo'}
        variant="gold"
        onConfirm={handleSubmit}
        onCancel={() => setConfirmSave(false)}
      />
    </div>
  )
}
