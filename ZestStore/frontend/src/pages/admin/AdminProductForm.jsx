import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { getCategories } from '../../api/categories'
import { uploadProductImage, uploadVariantImage } from '../../api/products'
import { useToast } from '../../context/ToastContext'
import SafeImg from '../../components/SafeImg'
import { Loader, Plus, Trash2, Pencil, Star, Upload, Check, X } from 'lucide-react'
import EmptyState from '../../components/EmptyState'

const VND = (n) => { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }

export default function AdminProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const isEdit = Boolean(id)

  const [product, setProduct] = useState({ tenSanPham: '', maDanhMuc: '', maThuongHieu: '', moTa: '', trangThai: 1 })
  const [categories, setCategories] = useState([])
  const [sizes, setSizes] = useState([])
  const [colors, setColors] = useState([])
  const [brands, setBrands] = useState([])
  const [variants, setVariants] = useState([])
  const [uploadedImages, setUploadedImages] = useState([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editIdx, setEditIdx] = useState(null)
  const [vform, setVform] = useState({ maKichCo: '', maMauSac: '', gia: '', tonKho: '0', urlAnh: '' })
  const [uploadingVimg, setUploadingVimg] = useState(false)
  const [savingVar, setSavingVar] = useState(false)

  useEffect(() => {
    Promise.all([
      getCategories(),
      api.get('/sizes').then(r => r.data),
      api.get('/colors').then(r => r.data),
      api.get('/brands').then(r => r.data),
      isEdit ? api.get(`/products/detail/${id}`).then(r => r.data) : Promise.resolve(null),
    ]).then(([cats, sz, cl, br, detail]) => {
      setCategories(Array.isArray(cats) ? cats : [])
      setSizes(Array.isArray(sz) ? sz : [])
      setColors(Array.isArray(cl) ? cl : [])
      setBrands(Array.isArray(br) ? br : [])
      if (detail) {
        const firstBrand = detail.variants?.find(v => v.thuongHieu)?.thuongHieu
        setProduct({
          tenSanPham: detail.product.tenSanPham,
          maDanhMuc: detail.product.danhMuc?.maDanhMuc || '',
          maThuongHieu: firstBrand?.maThuongHieu || '',
          moTa: detail.product.moTa || '',
          trangThai: detail.product.trangThai ?? 1,
        })
        setVariants((detail.variants || []).map(v => ({
          ...v,
          maKichCo: v.maKichCo || v.kichCo?.maKichCo || '',
          maMauSac: v.maMauSac || v.mauSac?.maMauSac || '',
        })))
      }
    }).catch(() => toast.error('Không thể tải dữ liệu'))
    .finally(() => setLoading(false))
  }, [id])

  const handleSaveProduct = async (e) => {
    e.preventDefault()
    if (!product.tenSanPham.trim()) { toast.error('Vui lòng nhập tên sản phẩm'); return }
    if (!product.maDanhMuc) { toast.error('Vui lòng chọn danh mục'); return }
    if (!product.maThuongHieu) { toast.error('Vui lòng chọn thương hiệu'); return }
    setSaving(true)
    try {
      const slug = product.tenSanPham.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now()
      if (isEdit) {
        await api.put(`/products/${id}`, { ...product, maDanhMuc: Number(product.maDanhMuc), slug })
        toast.success('Cập nhật sản phẩm thành công')
      } else {
        const variantReqs = variants.map(v => ({
          maKichCo: Number(v.maKichCo),
          maMauSac: Number(v.maMauSac),
          maThuongHieu: Number(product.maThuongHieu),
          sku: `${product.tenSanPham.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase()}-${v.maMauSac}-${v.maKichCo}`,
          gia: Number(v.gia),
          tonKho: Number(v.tonKho || 0),
          urlAnh: v.urlAnh || undefined,
        }))
        const res = await api.post('/products/with-variants', { product: { ...product, maDanhMuc: Number(product.maDanhMuc), slug }, variants: variantReqs })
        navigate(`/admin/products/${res.data.maSanPham}/edit`, { replace: true })
        toast.success('Tạo sản phẩm thành công')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi lưu sản phẩm')
    } finally { setSaving(false) }
  }

  const openAddForm = () => {
    setEditIdx(null)
    setVform({ maKichCo: '', maMauSac: '', gia: '', tonKho: '0', urlAnh: '' })
    setShowForm(true)
  }

  const openEditForm = (index) => {
    const v = variants[index]
    setEditIdx(index)
    setVform({
      maKichCo: v.maKichCo || '',
      maMauSac: v.maMauSac || '',
      gia: v.gia || '',
      tonKho: v.tonKho ?? '0',
      urlAnh: v.urlAnh || '',
    })
    setShowForm(true)
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditIdx(null)
    setVform({ maKichCo: '', maMauSac: '', gia: '', tonKho: '0', urlAnh: '' })
  }

  const handleSaveVariant = async () => {
    if (!vform.maKichCo || !vform.maMauSac) { toast.error('Vui lòng chọn kích cỡ và màu sắc'); return }
    if (!vform.gia || Number(vform.gia) < 0) { toast.error('Giá không hợp lệ'); return }

    const sizeName = sizes.find(s => s.maKichCo === Number(vform.maKichCo))?.kichCo || ''
    const colorName = colors.find(c => c.maMauSac === Number(vform.maMauSac))?.mauSac || ''
    const colorHex = colors.find(c => c.maMauSac === Number(vform.maMauSac))?.maMauHex

    const duplicate = variants.some((v, i) =>
      i !== editIdx &&
      Number(v.maKichCo) === Number(vform.maKichCo) &&
      Number(v.maMauSac) === Number(vform.maMauSac)
    )
    if (duplicate) {
      toast.error(`Biến thể ${sizeName} - ${colorName} đã tồn tại`)
      return
    }

    setSavingVar(true)

    if (editIdx !== null) {
      const v = variants[editIdx]
      const updated = {
        ...v,
        maKichCo: Number(vform.maKichCo),
        maMauSac: Number(vform.maMauSac),
        kichCo: { kichCo: sizeName },
        mauSac: { mauSac: colorName, maMauHex: colorHex },
        gia: Number(vform.gia),
        tonKho: Number(vform.tonKho || 0),
        urlAnh: vform.urlAnh,
      }
      if (v.maBienThe) {
        try {
          await api.put(`/products/variants/${v.maBienThe}`, {
            maKichCo: Number(vform.maKichCo),
            maMauSac: Number(vform.maMauSac),
            gia: Number(vform.gia),
            tonKho: Number(vform.tonKho || 0),
            urlAnh: vform.urlAnh || undefined,
          })
        } catch (err) {
          toast.error(err.response?.data?.message || 'Lỗi cập nhật biến thể')
          setSavingVar(false)
          return
        }
      }
      setVariants(prev => prev.map((x, i) => i === editIdx ? updated : x))
      toast.success('Cập nhật biến thể thành công')
    } else {
      setVariants(prev => [...prev, {
        maKichCo: Number(vform.maKichCo),
        maMauSac: Number(vform.maMauSac),
        kichCo: { kichCo: sizeName },
        mauSac: { mauSac: colorName, maMauHex: colorHex },
        gia: Number(vform.gia),
        tonKho: Number(vform.tonKho || 0),
        urlAnh: vform.urlAnh,
        _tempId: Date.now(),
      }])
      toast.success('Thêm biến thể thành công')
    }

    setSavingVar(false)
    cancelForm()
  }

  const handleDeleteVariant = (index) => {
    if (!isEdit) {
      setVariants(prev => prev.filter((_, i) => i !== index))
      setConfirmDelete(null)
      toast.success('Đã xóa biến thể')
      return
    }
    const v = variants[index]
    if (!v.maBienThe) {
      setVariants(prev => prev.filter((_, i) => i !== index))
      setConfirmDelete(null)
      return
    }
    api.delete(`/products/variants/${v.maBienThe}`).then(() => {
      toast.success('Đã xóa biến thể')
      setConfirmDelete(null)
      return api.get(`/products/detail/${id}`).then(r => r.data)
    }).then(detail => setVariants((detail.variants || []).map(v => ({
      ...v,
      maKichCo: v.maKichCo || v.kichCo?.maKichCo || '',
      maMauSac: v.maMauSac || v.mauSac?.maMauSac || '',
    }))))
    .catch(() => toast.error('Xóa thất bại'))
  }

  const handleUploadVariantImage = async (files) => {
    if (!files || files.length === 0) return
    setUploadingVimg(true)
    try {
      const data = await uploadVariantImage(files[0])
      setVform(prev => ({ ...prev, urlAnh: data.url }))
      toast.success('Upload ảnh biến thể thành công')
    } catch (err) {
      toast.error(err.message || 'Upload ảnh thất bại')
    } finally { setUploadingVimg(false) }
  }

  const handleUploadProductImage = async (files) => {
    if (!files || files.length === 0) return
    setUploadingImg(true)
    const file = files[0]
    try {
      const data = await uploadProductImage(file)
      setUploadedImages(prev => [...prev, { url: data.url, maMauSac: '', fileId: Date.now() }])
      toast.success('Upload ảnh thành công')
    } catch (err) {
      console.error('Upload failed:', err)
      toast.error(err.message || 'Upload ảnh thất bại')
    } finally { setUploadingImg(false) }
  }

  const handleRemoveImage = (fileId) => {
    setUploadedImages(prev => prev.filter(img => img.fileId !== fileId))
  }

  const handleSetMainImage = async (url) => {
    if (!id) return
    try {
      await api.put(`/products/${id}`, { urlAnhDaiDien: url })
      toast.success('Đã đặt ảnh đại diện')
    } catch { toast.error('Lỗi cập nhật ảnh đại diện') }
  }

  const handleSetImageColor = (fileId, maMauSac) => {
    setUploadedImages(prev => prev.map(img => img.fileId === fileId ? { ...img, maMauSac } : img))
  }

  const getColorName = (id) => colors.find(c => c.maMauSac === Number(id))?.mauSac || '-'
  const getColorHex = (id) => colors.find(c => c.maMauSac === Number(id))?.maMauHex
  const getSizeName = (id) => sizes.find(s => s.maKichCo === Number(id))?.kichCo || '-'

  if (loading) {
    return <div className="animate-pulse space-y-6"><div className="h-8 w-48 bg-gray-200 rounded-lg" /><div className="h-96 bg-gray-100 rounded-2xl" /></div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h1>
      </div>

      <form onSubmit={handleSaveProduct} className="bg-white rounded-2xl border p-6 space-y-6">
        <div>
          <h2 className="font-semibold text-lg">Thông tin sản phẩm</h2>
          <div>
            <label className="text-sm text-gray-500 font-medium">Tên sản phẩm *</label>
            <input value={product.tenSanPham} onChange={(e) => setProduct(p => ({ ...p, tenSanPham: e.target.value }))}
              placeholder="Nhập tên sản phẩm" required
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500 font-medium">Danh mục *</label>
              <select value={product.maDanhMuc} onChange={(e) => setProduct(p => ({ ...p, maDanhMuc: e.target.value }))}
                required className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">-- Chọn danh mục --</option>
                {categories.map(c => <option key={c.maDanhMuc} value={c.maDanhMuc}>{c.tenDanhMuc}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-500 font-medium">Thương hiệu *</label>
              <select value={product.maThuongHieu} onChange={(e) => setProduct(p => ({ ...p, maThuongHieu: e.target.value }))}
                required className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">-- Chọn thương hiệu --</option>
                {brands.map(b => <option key={b.maThuongHieu} value={b.maThuongHieu}>{b.tenThuongHieu}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-500 font-medium">Mô tả</label>
            <textarea value={product.moTa} onChange={(e) => setProduct(p => ({ ...p, moTa: e.target.value }))}
              placeholder="Mô tả sản phẩm" rows={4}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-500 font-medium">Trạng thái</label>
            <button type="button" onClick={() => setProduct(p => ({ ...p, trangThai: p.trangThai === 1 ? 0 : 1 }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${product.trangThai === 1 ? 'bg-blue-600' : 'bg-gray-300'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${product.trangThai === 1 ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-sm text-gray-600">{product.trangThai === 1 ? 'Hoạt động' : 'Ẩn'}</span>
          </div>
        </div>

        <hr className="border-t" />

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Biến thể</h2>
          </div>

          {variants.length === 0 && !showForm ? (
            <div className="mb-4">
              <EmptyState icon="PackageOpen" title="Chưa có biến thể" description="Nhấn 'Thêm biến thể' để thêm" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-gray-50">
                  <th className="text-left px-3 py-2 font-semibold text-gray-600">Màu</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-600">Size</th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-600">Giá</th>
                  <th className="text-center px-3 py-2 font-semibold text-gray-600">Tồn</th>
                  <th className="text-center px-3 py-2 font-semibold text-gray-600">Ảnh</th>
                  <th className="text-center px-3 py-2 font-semibold text-gray-600">Hành động</th>
                </tr></thead>
                <tbody className="divide-y">
                  {showForm && (
                    <tr className="bg-blue-50/50">
                      <td className="px-3 py-2">
                        <select value={vform.maMauSac} onChange={(e) => setVform(p => ({ ...p, maMauSac: e.target.value }))}
                          className="w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="">-- Màu --</option>
                          {colors.map(c => (
                            <option key={c.maMauSac} value={c.maMauSac}>
                              {c.mauSac} {c.maMauHex ? `(${c.maMauHex})` : ''}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select value={vform.maKichCo} onChange={(e) => setVform(p => ({ ...p, maKichCo: e.target.value }))}
                          className="w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="">-- Size --</option>
                          {sizes.map(s => <option key={s.maKichCo} value={s.maKichCo}>{s.kichCo}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="0" step="1000" value={vform.gia} onChange={(e) => setVform(p => ({ ...p, gia: e.target.value }))}
                          placeholder="Giá" className="w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="0" value={vform.tonKho} onChange={(e) => setVform(p => ({ ...p, tonKho: e.target.value }))}
                          className="w-full border rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button type="button" onClick={() => document.getElementById('vimgInput').click()}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="Upload ảnh biến thể">
                            {uploadingVimg ? <Loader className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          </button>
                          <input id="vimgInput" type="file" accept="image/*" hidden
                            onChange={(e) => { handleUploadVariantImage(e.target.files); e.target.value = '' }} />
                          {vform.urlAnh && (
                            <SafeImg src={vform.urlAnh} className="w-8 h-8 rounded object-cover bg-gray-100 border shrink-0"
                              fallback="https://placehold.co/32x32/e2e8f0/475569?text=?" />
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-center gap-1">
                          <button onClick={handleSaveVariant} disabled={savingVar}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><Check className="h-4 w-4" /></button>
                          <button onClick={cancelForm}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><X className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {variants.map((v, i) => (
                    <tr key={v.maBienThe || v._tempId || i} className="hover:bg-gray-50 transition">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {getColorHex(v.maMauSac) && <span className="w-4 h-4 rounded-full border shrink-0" style={{ backgroundColor: getColorHex(v.maMauSac) }} />}
                          <span>{v.mauSac?.mauSac || getColorName(v.maMauSac)}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">{v.kichCo?.kichCo || getSizeName(v.maKichCo)}</td>
                      <td className="px-3 py-2 text-right font-semibold">{VND(v.gia || 0)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${(v.tonKho || 0) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {v.tonKho || 0}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {v.urlAnh ? (
                          <SafeImg src={v.urlAnh} className="w-10 h-10 rounded-lg object-cover bg-gray-100 border mx-auto"
                            fallback="https://placehold.co/40x40/e2e8f0/475569?text=?" />
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => openEditForm(i)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => setConfirmDelete(i)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!showForm && (
            <button onClick={openAddForm}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-1">
              <Plus className="h-4 w-4" /> Thêm biến thể
            </button>
          )}
          {!isEdit && variants.length === 0 && !showForm && (
            <p className="text-xs text-gray-400 mt-2">Thêm biến thể trước khi lưu sản phẩm mới</p>
          )}
        </div>

        <hr className="border-t" />

        <div>
          <h2 className="font-semibold text-lg mb-4">Ảnh sản phẩm</h2>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleUploadProductImage(e.dataTransfer.files) }}
            className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition cursor-pointer"
            onClick={() => document.getElementById('imgUpload').click()}
          >
            <Upload className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Kéo thả ảnh vào đây hoặc click để chọn</p>
            <input id="imgUpload" type="file" accept="image/*" hidden onChange={(e) => { handleUploadProductImage(e.target.files); e.target.value = '' }} />
          </div>
          {uploadingImg && <div className="flex items-center justify-center py-3"><Loader className="h-5 w-5 animate-spin text-blue-600" /></div>}
          {uploadedImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              {uploadedImages.map((img) => (
                <div key={img.fileId} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                  <SafeImg src={img.url} className="w-full h-full object-cover" fallback="https://placehold.co/100x100/e2e8f0/475569?text=?" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                    <button onClick={() => handleSetMainImage(img.url)} className="p-1 bg-white rounded-full" title="Đặt làm ảnh chính"><Star className="h-3.5 w-3.5 text-yellow-500" /></button>
                    <button onClick={() => handleRemoveImage(img.fileId)} className="p-1 bg-white rounded-full" title="Xóa"><Trash2 className="h-3.5 w-3.5 text-red-500" /></button>
                  </div>
                  <select value={img.maMauSac} onChange={(e) => handleSetImageColor(img.fileId, e.target.value)}
                    className="absolute bottom-0 left-0 right-0 text-[10px] border-t bg-white/90 px-1 py-0.5 focus:outline-none" onClick={(e) => e.stopPropagation()}>
                    <option value="">-- Màu --</option>
                    {colors.map(c => <option key={c.maMauSac} value={c.maMauSac}>{c.mauSac}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
          {uploadedImages.length === 0 && <p className="text-xs text-gray-400 text-center mt-3">Chưa có ảnh nào</p>}
        </div>

        <button type="submit" disabled={saving}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <Loader className="h-4 w-4 animate-spin" /> : null}
          {isEdit ? 'Cập nhật sản phẩm' : 'Tạo sản phẩm'}
        </button>
      </form>

      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2">Xác nhận xóa</h3>
            <p className="text-sm text-gray-600 mb-4">Bạn chắc chắn muốn xóa biến thể này?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 border rounded-xl text-sm font-medium hover:bg-gray-50">Hủy</button>
              <button onClick={() => handleDeleteVariant(confirmDelete)} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
