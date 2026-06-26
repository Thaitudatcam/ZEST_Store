import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Upload, Trash2, Plus, Pencil, AlertTriangle } from 'lucide-react'
import api from '../../api/axios'
import { VND } from '../../components/ProductCard'
import SafeImg from '../../components/SafeImg'
import LoadingSpinner from '../../components/LoadingSpinner'
import Toast from '../../components/Toast'

export default function AdminProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [form, setForm] = useState({ tenSanPham: '', slug: '', moTa: '', urlAnhDaiDien: '', maDanhMuc: '' })
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [sizes, setSizes] = useState([])
  const [colors, setColors] = useState([])
  const [sub, setSub] = useState(false)
  const [loading, setLoading] = useState(true)
  const [variants, setVariants] = useState([])
  const [showVariantForm, setShowVariantForm] = useState(false)
  const [vform, setVform] = useState({ sku: '', maThuongHieu: '', maKichCo: '', maMauSac: '', gia: '', tonKho: '' })
  const [editVariantId, setEditVariantId] = useState(null)
  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [baseSku, setBaseSku] = useState('')
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const pendingNavigation = useRef(null)

  useEffect(() => {
    if (!dirty || sub) return
    const handler = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty, sub])

  const handleNavigate = (path) => {
    if (dirty && !sub) setShowLeaveConfirm(true)
    else navigate(path)
    pendingNavigation.current = path
  }

  useEffect(() => {
    Promise.all([
      api.get('/categories/flat').then((r) => setCategories(r.data)).catch(() => {}),
      api.get('/brands').then((r) => setBrands(r.data)).catch(() => {}),
      api.get('/sizes').then((r) => setSizes(r.data)).catch(() => {}),
      api.get('/colors').then((r) => setColors(r.data)).catch(() => {}),
    ]).finally(() => {
      if (isEdit) {
        api.get(`/products/detail/${id}`).then((r) => {
          const p = r.data.product || r.data
          setForm({ tenSanPham: p.tenSanPham || '', slug: p.slug || '', moTa: p.moTa || '', urlAnhDaiDien: p.urlAnhDaiDien || '', maDanhMuc: p.danhMuc?.maDanhMuc || '' })
          setVariants(r.data.variants || [])
        }).catch(() => { setToast({ type: 'error', message: 'Không thể tải thông tin sản phẩm' }); setTimeout(() => navigate('/admin/products'), 1500) })
          .finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })
  }, [id])

  const validateForm = useCallback(() => {
    const e = {}
    if (!form.tenSanPham.trim()) e.tenSanPham = 'Tên sản phẩm không được để trống'
    else if (/[^a-zA-Z0-9À-ỹ\s\-_đ]/.test(form.tenSanPham)) e.tenSanPham = 'Tên sản phẩm không được chứa ký tự đặc biệt'
    if (!form.maDanhMuc) e.maDanhMuc = 'Vui lòng chọn danh mục'
    if (variants.length === 0) e.variants = 'Phải có ít nhất 1 biến thể'
    setErrors(e)
    return Object.keys(e).length === 0
  }, [form, variants])

  const slugify = (s) => s.toLowerCase()
    .replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a')
    .replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e')
    .replace(/ì|í|ị|ỉ|ĩ/g, 'i')
    .replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o')
    .replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u')
    .replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  const handleChange = (e) => {
    const { name, value } = e.target
    setDirty(true)
    setErrors((prev) => ({ ...prev, [name]: '' }))
    if (name === 'tenSanPham') setBaseSku(slugify(value))
    setForm((f) => ({
      ...f,
      [name]: value,
      slug: name === 'tenSanPham' && !f.slug ? slugify(value) : name === 'slug' ? value : f.slug,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSub(true); setErrors({})
    if (!validateForm()) { setSub(false); return }
    try {
      const slug = form.slug || slugify(form.tenSanPham)
      const body = { tenSanPham: form.tenSanPham, slug, moTa: form.moTa, urlAnhDaiDien: form.urlAnhDaiDien, maDanhMuc: form.maDanhMuc ? Number(form.maDanhMuc) : null }
      if (isEdit) {
        await api.put(`/products/${id}`, body)
        setToast({ type: 'success', message: 'Cập nhật sản phẩm thành công' })
        setTimeout(() => navigate('/admin/products'), 1000)
      } else {
        const res = await api.post('/products', body)
        const newId = res.data.maSanPham
        if (variants.length > 0) {
          await Promise.all(variants.map((v) =>
            api.post(`/products/${newId}/variants`, {
              sku: v.sku, maThuongHieu: v.maThuongHieu, maKichCo: v.maKichCo,
              maMauSac: v.maMauSac, gia: v.gia, tonKho: v.tonKho || 0
            })
          ))
        }
        setToast({ type: 'success', message: 'Thêm sản phẩm thành công' })
        setTimeout(() => navigate('/admin/products'), 1000)
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.defaultMessage || 'Lỗi lưu sản phẩm'
      setToast({ type: 'error', message: msg })
    } finally { setSub(false) }
  }

  const addVariant = async () => {
    if (!vform.sku || !vform.gia || !vform.maThuongHieu || !vform.maKichCo || !vform.maMauSac) {
      return setToast({ type: 'error', message: 'Vui lòng điền đầy đủ: SKU, giá, thương hiệu, kích cỡ, màu sắc' })
    }
    const skuExists = variants.some((v) => v.sku === vform.sku && v.maBienThe !== editVariantId)
    if (skuExists) {
      return setToast({ type: 'error', message: 'SKU đã tồn tại trong danh sách' })
    }
    const variantData = {
      sku: vform.sku,
      maThuongHieu: Number(vform.maThuongHieu),
      maKichCo: Number(vform.maKichCo),
      maMauSac: Number(vform.maMauSac),
      gia: Number(vform.gia),
      tonKho: Number(vform.tonKho) || 0
    }
    try {
      if (editVariantId) {
        if (isEdit) {
          await api.put(`/products/variants/${editVariantId}`, variantData)
        }
        setVariants((prev) => prev.map((v) =>
          v.maBienThe === editVariantId ? { ...v, ...variantData, thuongHieu: brands.find((b) => b.maThuongHieu === variantData.maThuongHieu) || v.thuongHieu, kichCo: sizes.find((s) => s.maKichCo === variantData.maKichCo) || v.kichCo, mauSac: colors.find((c) => c.maMauSac === variantData.maMauSac) || v.mauSac } : v
        ))
      } else if (isEdit) {
        const res = await api.post(`/products/${id}/variants`, variantData)
        setVariants((prev) => [...prev, res.data])
      } else {
        const temp = { ...variantData, maBienThe: Date.now() + Math.random() }
        const brand = brands.find((b) => b.maThuongHieu === variantData.maThuongHieu)
        const size = sizes.find((s) => s.maKichCo === variantData.maKichCo)
        const color = colors.find((c) => c.maMauSac === variantData.maMauSac)
        temp.thuongHieu = brand || { tenThuongHieu: '' }
        temp.kichCo = size || { kichCo: '' }
        temp.mauSac = color || { mauSac: '' }
        setVariants((prev) => [...prev, temp])
      }
      setDirty(true)
      setErrors((prev) => ({ ...prev, variants: '' }))
      setVform({ sku: '', maThuongHieu: '', maKichCo: '', maMauSac: '', gia: '', tonKho: '' })
      setEditVariantId(null)
      setShowVariantForm(false)
    } catch (err) { setToast({ type: 'error', message: err.response?.data?.message || 'Lỗi thêm biến thể' }) }
  }

  const editVariant = (v) => {
    setVform({ sku: v.sku, maThuongHieu: v.maThuongHieu, maKichCo: v.maKichCo, maMauSac: v.maMauSac, gia: v.gia, tonKho: v.tonKho })
    setEditVariantId(v.maBienThe)
    setShowVariantForm(true)
  }

  const deleteVariant = async (vid) => {
    try {
      if (isEdit) await api.delete(`/products/variants/${vid}`)
      setVariants((prev) => prev.filter((v) => v.maBienThe !== vid))
      setDirty(true)
      setErrors((prev) => ({ ...prev, variants: '' }))
    } catch { setToast({ type: 'error', message: 'Lỗi xóa biến thể' }) }
  }

  const handleUpload = async () => {
    if (!variants.length) return setToast({ type: 'error', message: 'Vui lòng thêm biến thể trước khi upload ảnh' })
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      const fd = new FormData()
      fd.append('file', file)
      try {
        const res = await api.post(`/upload/variant/${variants[0].maBienThe}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        setForm((f) => ({ ...f, urlAnhDaiDien: res.data.urlAnh || `/api/files/${res.data.maAnh}` }))
        setToast({ type: 'success', message: 'Upload ảnh thành công' })
      } catch { setToast({ type: 'error', message: 'Lỗi upload ảnh' }) }
    }
    input.click()
  }

  if (loading) return <LoadingSpinner className="py-20" size="lg" />

  return (
    <div className="max-w-3xl">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h1>

      {errors.variants && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {errors.variants}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-700">Tên sản phẩm</label>
            <input name="tenSanPham" value={form.tenSanPham} onChange={handleChange} maxLength={200}
              className={`w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.tenSanPham ? 'border-red-400 bg-red-50' : ''}`} />
            {errors.tenSanPham && <p className="text-red-500 text-xs mt-1">{errors.tenSanPham}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Slug</label>
            <input name="slug" value={form.slug} onChange={handleChange}
              className={`w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.slug ? 'border-red-400 bg-red-50' : ''}`} />
            {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Danh mục</label>
            <select name="maDanhMuc" value={form.maDanhMuc} onChange={handleChange}
              className={`w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.maDanhMuc ? 'border-red-400 bg-red-50' : ''}`}>
              <option value="">-- Chọn --</option>
              {categories.map((c) => <option key={c.maDanhMuc} value={c.maDanhMuc}>{c.tenDanhMuc}</option>)}
            </select>
            {errors.maDanhMuc && <p className="text-red-500 text-xs mt-1">{errors.maDanhMuc}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Ảnh đại diện (URL)</label>
            <input name="urlAnhDaiDien" value={form.urlAnhDaiDien} onChange={handleChange} placeholder="URL hoặc upload bên dưới"
              className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Mô tả</label>
          <textarea name="moTa" value={form.moTa} onChange={handleChange} rows={4} maxLength={5000}
            className="w-full border rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {errors.variants && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {errors.variants}
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={sub} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">{sub ? 'Đang lưu...' : 'Lưu'}</button>
          <button type="button" onClick={() => handleNavigate('/admin/products')} className="border px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-50">Hủy</button>
        </div>
      </form>

      <div className="bg-white rounded-2xl shadow-sm border p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Biến thể</h2>
          <button type="button" onClick={() => { setShowVariantForm(true); setEditVariantId(null); setVform({ sku: baseSku, maThuongHieu: '', maKichCo: '', maMauSac: '', gia: '', tonKho: '' }) }} title="Thêm biến thể mới cho sản phẩm" className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Thêm biến thể
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
          <p className="font-medium mb-1">Biến thể là gì?</p>
          <p>Biến thể là các phiên bản khác nhau của sản phẩm. Ví dụ: cùng một áo Polo nhưng có nhiều <strong>kích cỡ</strong> (M, L, XL) và <strong>màu sắc</strong> (Trắng, Đen, Xanh) khác nhau — mỗi tổ hợp là một biến thể với SKU, giá và tồn kho riêng.</p>
          <p className="mt-1">Thêm ít nhất <strong>1 biến thể</strong> trước khi lưu sản phẩm.</p>
        </div>

        {variants.length > 0 ? (
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600">SKU</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Thương hiệu</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Kích cỡ</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Màu sắc</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-600">Giá</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-600">Tồn kho</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-gray-600 w-20">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {variants.map((v) => (
                  <tr key={v.maBienThe} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-mono text-blue-700">{v.sku}</td>
                    <td className="px-4 py-2.5">{v.thuongHieu?.tenThuongHieu || '-'}</td>
                    <td className="px-4 py-2.5">{v.kichCo?.kichCo || '-'}</td>
                    <td className="px-4 py-2.5">{v.mauSac?.mauSac || '-'}</td>
                    <td className="px-4 py-2.5 text-right font-medium">{VND(v.gia)}</td>
                    <td className="px-4 py-2.5 text-right">{v.tonKho}</td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => editVariant(v)} className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50" title="Sửa biến thể">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => deleteVariant(v.maBienThe)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50" title="Xóa biến thể">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 py-4 text-center">Chưa có biến thể. Nhấn "Thêm biến thể" để tạo.</p>
        )}

        {showVariantForm && (
          <div className="mt-4 p-4 border rounded-lg bg-gray-50 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input value={vform.sku} onChange={(e) => setVform({ ...vform, sku: e.target.value })} placeholder="SKU" className="border rounded-lg px-3 py-2 text-sm" />
              <input type="number" value={vform.gia} onChange={(e) => setVform({ ...vform, gia: e.target.value })} placeholder="Giá" className="border rounded-lg px-3 py-2 text-sm" />
              <select value={vform.maThuongHieu} onChange={(e) => setVform({ ...vform, maThuongHieu: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
                <option value="">-- Thương hiệu --</option>
                {brands.map((b) => <option key={b.maThuongHieu} value={b.maThuongHieu}>{b.tenThuongHieu}</option>)}
              </select>
              <select value={vform.maKichCo} onChange={(e) => setVform({ ...vform, maKichCo: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
                <option value="">-- Kích cỡ --</option>
                {sizes.map((s) => <option key={s.maKichCo} value={s.maKichCo}>{s.kichCo}</option>)}
              </select>
              <select value={vform.maMauSac} onChange={(e) => setVform({ ...vform, maMauSac: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
                <option value="">-- Màu sắc --</option>
                {colors.map((c) => <option key={c.maMauSac} value={c.maMauSac}>{c.mauSac}</option>)}
              </select>
              <input type="number" value={vform.tonKho} onChange={(e) => setVform({ ...vform, tonKho: e.target.value })} placeholder="Tồn kho" className="border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={addVariant} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">{editVariantId ? 'Cập nhật' : 'Thêm'}</button>
              <button type="button" onClick={() => { setShowVariantForm(false); setEditVariantId(null); setVform({ sku: '', maThuongHieu: '', maKichCo: '', maMauSac: '', gia: '', tonKho: '' }) }} className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-100">Hủy</button>
            </div>
          </div>
        )}
      </div>

      {isEdit && (
        <div className="bg-white rounded-2xl shadow-sm border p-6 mt-6">
          <h2 className="font-semibold text-lg mb-4">Ảnh đại diện</h2>
          {form.urlAnhDaiDien && (
            <div className="mb-3 w-32 h-32 rounded-lg overflow-hidden border bg-gray-100">
              <SafeImg src={form.urlAnhDaiDien} alt="" className="w-full h-full object-cover object-center" />
            </div>
          )}
          <button type="button" onClick={handleUpload} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-1">
            <Upload className="h-4 w-4" /> Upload ảnh
          </button>
        </div>
      )}

      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl max-w-sm w-full mx-4 p-6">
            <h3 className="font-bold text-lg mb-2">Thay đổi chưa lưu</h3>
            <p className="text-sm text-gray-600 mb-4">Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời đi?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLeaveConfirm(false)} className="flex-1 py-2.5 border rounded-xl text-sm font-medium hover:bg-gray-50">Ở lại</button>
              <button onClick={() => { setShowLeaveConfirm(false); navigate(pendingNavigation.current) }} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700">Rời đi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}