import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { getCategories } from '../../api/categories'
import { uploadProductImage, uploadVariantImage } from '../../api/products'
import { createCategory, createBrand, createColor, createSize } from '../../api/admin'
import { useToast } from '../../context/ToastContext'
import SafeImg from '../../components/SafeImg'
import { Loader, Plus, Trash2, Upload, Check, FolderPlus, Tag, Palette } from 'lucide-react'
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
  const [savingRow, setSavingRow] = useState(null)
  const [uploadingRowImg, setUploadingRowImg] = useState(null)
  const [rowUploadIdx, setRowUploadIdx] = useState(null)
  const [showCatModal, setShowCatModal] = useState(false)
  const [showBrandModal, setShowBrandModal] = useState(false)
  const [quickAddName, setQuickAddName] = useState('')
  const [showColorModal, setShowColorModal] = useState(false)
  const [showSizeModal, setShowSizeModal] = useState(false)
  const [quickColorName, setQuickColorName] = useState('')
  const [quickColorHex, setQuickColorHex] = useState('rgba(20,105,139,0.42)')
  const [quickSizeName, setQuickSizeName] = useState('')
  const [selectedColorIds, setSelectedColorIds] = useState([])
  const [selectedSizeIds, setSelectedSizeIds] = useState([])

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
        const images = []
        if (detail.product.urlAnhDaiDien) {
          images.push({ url: detail.product.urlAnhDaiDien, maMauSac: '', fileId: 'main' })
        }
        ;(detail.images || []).forEach(img => {
          images.push({ url: img.urlAnh, maMauSac: '', fileId: img.maAnh })
        })
        setUploadedImages(images)
      }
    }).catch(() => toast.error('Không thể tải dữ liệu'))
    .finally(() => setLoading(false))
  }, [id])

  const handleSaveProduct = async (e) => {
    e.preventDefault()
    if (!product.tenSanPham.trim()) { toast.error('Vui lòng nhập tên sản phẩm'); return }
    if (!product.maDanhMuc) { toast.error('Vui lòng chọn danh mục'); return }
    if (!product.maThuongHieu) { toast.error('Vui lòng chọn thương hiệu'); return }
    const zeroPriceVariant = variants.find(v => !v.gia || Number(v.gia) <= 0)
    if (zeroPriceVariant) { toast.error('Giá biến thể phải lớn hơn 0'); return }
    setSaving(true)
    try {
      const slug = product.tenSanPham.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now()
      let productId = isEdit ? id : null
      if (isEdit) {
        await api.put(`/products/${id}`, { ...product, maDanhMuc: Number(product.maDanhMuc), slug })
        const unsavedVariants = variants.filter(v => !v.maBienThe)
        for (const v of unsavedVariants) {
          const res = await api.post(`/products/${id}/variants`, {
            maKichCo: Number(v.maKichCo),
            maMauSac: Number(v.maMauSac),
            maThuongHieu: Number(product.maThuongHieu),
            gia: Number(v.gia),
            tonKho: Number(v.tonKho || 0),
            urlAnh: v.urlAnh || undefined,
            sku: `${product.tenSanPham.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase()}-${v.maMauSac}-${v.maKichCo}-${Date.now()}`,
          })
          v.maBienThe = res.data.maBienThe
        }
      } else {
        const variantReqs = variants.map(v => ({
          maKichCo: Number(v.maKichCo),
          maMauSac: Number(v.maMauSac),
          maThuongHieu: Number(product.maThuongHieu),
          sku: `${product.tenSanPham.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase()}-${v.maMauSac}-${v.maKichCo}-${Date.now()}`,
          gia: Number(v.gia),
          tonKho: Number(v.tonKho || 0),
          urlAnh: v.urlAnh || undefined,
        }))
        const res = await api.post('/products/with-variants', { product: { ...product, maDanhMuc: Number(product.maDanhMuc), slug }, variants: variantReqs })
        productId = res.data.maSanPham
      }
      if (!isEdit) {
        toast.success('Tạo sản phẩm thành công')
        navigate(`/admin/products/${productId}/edit`, { replace: true })
        if (uploadedImages.length > 0) {
          api.put(`/products/${productId}`, { ...product, maDanhMuc: Number(product.maDanhMuc), slug, urlAnhDaiDien: uploadedImages[0].url })
            .catch(e => console.error('Failed to save product image', e))
        }
        return
      }
      if (uploadedImages.length > 0) {
        try {
          await api.put(`/products/${id}`, { ...product, maDanhMuc: Number(product.maDanhMuc), slug, urlAnhDaiDien: uploadedImages[0].url })
        } catch (imgErr) {
          console.error('Failed to save product image', imgErr)
        }
      }
      toast.success('Cập nhật sản phẩm thành công')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi lưu sản phẩm')
    } finally { setSaving(false) }
  }

  const openAddForm = () => {
    setEditIdx(null)
    setVform({ maKichCo: '', maMauSac: '', gia: '', tonKho: '0', urlAnh: '' })
    setShowForm(true)
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditIdx(null)
    setVform({ maKichCo: '', maMauSac: '', gia: '', tonKho: '0', urlAnh: '' })
  }

  const handleSaveVariant = async () => {
    if (!vform.maKichCo || !vform.maMauSac) { toast.error('Vui lòng chọn kích cỡ và màu sắc'); return }
    if (!vform.gia || Number(vform.gia) <= 0) { toast.error('Giá phải lớn hơn 0'); return }

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

  const handleVariantFieldChange = (index, field, value) => {
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v))
  }

  const handleUploadVariantImageRow = async (index, files) => {
    if (!files || files.length === 0) return
    setUploadingRowImg(index)
    try {
      const data = await uploadVariantImage(files[0])
      setVariants(prev => prev.map((v, i) => i === index ? { ...v, urlAnh: data.url } : v))
      toast.success('Upload ảnh biến thể thành công')
    } catch (err) {
      toast.error(err.message || 'Upload ảnh thất bại')
    } finally { setUploadingRowImg(null) }
  }

  const handleSaveVariantRow = async (index) => {
    const v = variants[index]
    if (!v.gia || Number(v.gia) <= 0) { toast.error('Giá biến thể phải lớn hơn 0'); setSavingRow(null); return }
    setSavingRow(index)
    try {
      if (v.maBienThe) {
        await api.put(`/products/variants/${v.maBienThe}`, {
          maKichCo: Number(v.maKichCo),
          maMauSac: Number(v.maMauSac),
          gia: Number(v.gia),
          tonKho: Number(v.tonKho || 0),
          urlAnh: v.urlAnh || undefined,
        })
      } else if (id) {
        const res = await api.post(`/products/${id}/variants`, {
          maKichCo: Number(v.maKichCo),
          maMauSac: Number(v.maMauSac),
          maThuongHieu: Number(product.maThuongHieu),
          gia: Number(v.gia),
          tonKho: Number(v.tonKho || 0),
          urlAnh: v.urlAnh || undefined,
          sku: `${product.tenSanPham.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase()}-${v.maMauSac}-${v.maKichCo}-${Date.now()}`,
        })
        setVariants(prev => prev.map((x, i) => i === index ? { ...x, maBienThe: res.data.maBienThe } : x))
      }
      toast.success('Đã lưu biến thể')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi lưu biến thể')
    } finally { setSavingRow(null) }
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

  const getColorName = (id) => colors.find(c => c.maMauSac === Number(id))?.mauSac || '-'
  const getColorHex = (id) => colors.find(c => c.maMauSac === Number(id))?.maMauHex
  const getSizeName = (id) => sizes.find(s => s.maKichCo === Number(id))?.kichCo || '-'

  const handleQuickAddCategory = async () => {
    if (!quickAddName.trim()) return
    try {
      const slug = quickAddName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now()
      const newCat = await createCategory({ tenDanhMuc: quickAddName.trim(), slug })
      setCategories(prev => [...prev, newCat])
      setProduct(p => ({ ...p, maDanhMuc: newCat.maDanhMuc }))
      setShowCatModal(false)
      setQuickAddName('')
      toast.success('Thêm danh mục thành công')
    } catch { toast.error('Lỗi thêm danh mục') }
  }

  const handleQuickAddBrand = async () => {
    if (!quickAddName.trim()) return
    try {
      const newBrand = await createBrand({ tenThuongHieu: quickAddName.trim() })
      setBrands(prev => [...prev, newBrand])
      setProduct(p => ({ ...p, maThuongHieu: newBrand.maThuongHieu }))
      setShowBrandModal(false)
      setQuickAddName('')
      toast.success('Thêm thương hiệu thành công')
    } catch { toast.error('Lỗi thêm thương hiệu') }
  }

  const handleQuickAddColor = async () => {
    if (!quickColorName.trim()) return
    try {
      const newColor = await createColor({ tenMauSac: quickColorName.trim(), maMauHex: quickColorHex })
      setColors(prev => [...prev, newColor])
      setShowColorModal(false)
      setQuickColorName('')
      setQuickColorHex('#000000')
      toast.success('Thêm màu sắc thành công')
    } catch { toast.error('Lỗi thêm màu sắc') }
  }

  const handleQuickAddSize = async () => {
    if (!quickSizeName.trim()) return
    try {
      const newSize = await createSize({ tenKichCo: quickSizeName.trim() })
      setSizes(prev => [...prev, newSize])
      setShowSizeModal(false)
      setQuickSizeName('')
      toast.success('Thêm kích cỡ thành công')
    } catch { toast.error('Lỗi thêm kích cỡ') }
  }

  const toggleColorId = (id) => {
    setSelectedColorIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleSizeId = (id) => {
    setSelectedSizeIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleGenerateVariants = () => {
    if (selectedColorIds.length === 0) { toast.error('Chọn ít nhất một màu'); return }
    if (selectedSizeIds.length === 0) { toast.error('Chọn ít nhất một kích cỡ'); return }
    const newVariants = []
    selectedColorIds.forEach(cId => {
      selectedSizeIds.forEach(sId => {
        const exists = variants.some(v =>
          Number(v.maKichCo) === Number(sId) && Number(v.maMauSac) === Number(cId)
        )
        if (!exists) {
          const sizeName = sizes.find(s => s.maKichCo === Number(sId))?.kichCo || ''
          const colorName = colors.find(c => c.maMauSac === Number(cId))?.mauSac || ''
          const colorHex = colors.find(c => c.maMauSac === Number(cId))?.maMauHex
          newVariants.push({
            maKichCo: Number(sId),
            maMauSac: Number(cId),
            kichCo: { kichCo: sizeName },
            mauSac: { mauSac: colorName, maMauHex: colorHex },
            gia: 0,
            tonKho: 0,
            urlAnh: '',
            _tempId: Date.now() + newVariants.length,
          })
        }
      })
    })
    if (newVariants.length === 0) { toast.error('Các biến thể đã tồn tại'); return }
    setVariants(prev => [...prev, ...newVariants])
    toast.success(`Đã tạo ${newVariants.length} biến thể`)
  }

  if (loading) {
    return <div className="animate-pulse space-y-6"><div className="h-8 w-48 bg-gray-200 rounded-lg" /><div className="h-96 bg-gray-100 rounded-2xl" /></div>
  }

  return (
    <div>
      

      <form onSubmit={handleSaveProduct} className="bg-white rounded-2xl border p-6 space-y-6">
        <div className="grid grid-cols-[1fr_400px] gap-6">
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
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-500 font-medium">Danh mục *</label>
                  <button type="button" onClick={() => { setQuickAddName(''); setShowCatModal(true) }}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Thêm danh mục mới">
                    <FolderPlus className="h-4 w-4" />
                  </button>
                </div>
                <select value={product.maDanhMuc} onChange={(e) => setProduct(p => ({ ...p, maDanhMuc: e.target.value }))}
                  required className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map(c => <option key={c.maDanhMuc} value={c.maDanhMuc}>{c.tenDanhMuc}</option>)}
                </select>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-500 font-medium">Thương hiệu *</label>
                  <button type="button" onClick={() => { setQuickAddName(''); setShowBrandModal(true) }}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Thêm thương hiệu mới">
                    <Tag className="h-4 w-4" />
                  </button>
                </div>
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

          <div>
            <h2 className="font-semibold text-lg mb-4">Ảnh mô tả</h2>
            {uploadedImages.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {uploadedImages.map((img) => (
                  <div key={img.fileId} className="relative group aspect-square bg-gray-100 rounded-xl overflow-hidden border">
                    <SafeImg src={img.url} className="w-full h-full object-cover" fallback="https://placehold.co/400x400/e2e8f0/475569?text=?" />
                    {img.maMauSac ? (
                      <span className="absolute bottom-2 left-2 text-[10px] font-medium bg-black/60 text-white px-1.5 py-0.5 rounded">{getColorName(img.maMauSac) || 'Ảnh biến thể'}</span>
                    ) : null}
                    <button type="button" onClick={() => handleRemoveImage(img.fileId)}
                      className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full hover:bg-white transition opacity-0 group-hover:opacity-100">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div onClick={() => document.getElementById('imgUpload').click()}
                className="border-2 border-dashed border-gray-300 rounded-xl aspect-square flex items-center justify-center hover:border-blue-400 transition cursor-pointer max-w-[160px]">
                {uploadingImg ? <Loader className="h-5 w-5 animate-spin text-blue-600" /> : <Plus className="h-6 w-6 text-gray-300" />}
              </div>
            )}
            <input id="imgUpload" type="file" accept="image/*" hidden onChange={(e) => { handleUploadProductImage(e.target.files); e.target.value = '' }} />
          </div>
        </div>

        <hr className="border-t" />

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Biến thể</h2>
          </div>

          <div className="bg-gray-50 rounded-xl border p-4 mb-6">
            
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="text-xs text-gray-500 font-medium">Màu sắc</label>
                  <button type="button" onClick={() => { setQuickColorName(''); setQuickColorHex('#000000'); setShowColorModal(true) }}
                    className="p-0.5 text-blue-600 hover:bg-blue-50 rounded" title="Thêm màu mới">
                    <Palette className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {colors.map(c => {
                    const selected = selectedColorIds.includes(c.maMauSac)
                    return (
                      <button key={c.maMauSac} type="button" onClick={() => toggleColorId(c.maMauSac)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition ${selected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                        {c.maMauHex && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.maMauHex }} />}
                        {c.mauSac}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="text-xs text-gray-500 font-medium">Kích cỡ</label>
                  <button type="button" onClick={() => { setQuickSizeName(''); setShowSizeModal(true) }}
                    className="p-0.5 text-blue-600 hover:bg-blue-50 rounded" title="Thêm kích cỡ mới">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map(s => {
                    const selected = selectedSizeIds.includes(s.maKichCo)
                    return (
                      <button key={s.maKichCo} type="button" onClick={() => toggleSizeId(s.maKichCo)}
                        className={`px-3 py-1.5 rounded-lg text-xs border font-medium transition ${selected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                        {s.kichCo}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            <button type="button" onClick={handleGenerateVariants}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" /> Tạo biến thể
            </button>
          </div>

          {variants.length === 0 && !showForm ? (
            <div className="mb-4">
              <EmptyState icon="PackageOpen" title="Chưa có biến thể" description="Chọn màu & size ở trên và nhấn 'Tạo biến thể'" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-gray-50">
                  <th className="text-center px-3 py-2 font-semibold text-gray-600">Màu</th>
                  <th className="text-center px-3 py-2 font-semibold text-gray-600">Size</th>
                  <th className="text-center px-3 py-2 font-semibold text-gray-600">Giá</th>
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
                          <button type="button" onClick={handleSaveVariant} disabled={savingVar}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><Check className="h-4 w-4" /></button>
                          <button type="button" onClick={() => setConfirmDelete(editIdx)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {variants.map((v, i) => (
                    <tr key={v.maBienThe || v._tempId || i} className="hover:bg-gray-50 transition">
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {getColorHex(v.maMauSac) && <span className="w-4 h-4 rounded-full border shrink-0" style={{ backgroundColor: getColorHex(v.maMauSac) }} />}
                          <span>{v.mauSac?.mauSac || getColorName(v.maMauSac)}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center font-medium">{v.kichCo?.kichCo || getSizeName(v.maKichCo)}</td>
                      <td className="px-3 py-2">
                        <input type="number" min="0" step="1000" value={v.gia}
                          onChange={e => handleVariantFieldChange(i, 'gia', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="0" value={v.tonKho}
                          onChange={e => handleVariantFieldChange(i, 'tonKho', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button type="button" onClick={() => { setRowUploadIdx(i); document.getElementById('vimgRowInput').click() }}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="Upload ảnh biến thể">
                            {uploadingRowImg === i ? <Loader className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          </button>
                          {v.urlAnh ? (
                            <SafeImg src={v.urlAnh} className="w-8 h-8 rounded object-cover bg-gray-100 border shrink-0"
                              fallback="https://placehold.co/32x32/e2e8f0/475569?text=?" />
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button type="button" onClick={() => setConfirmDelete(i)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Xóa biến thể"><Trash2 className="h-3.5 w-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                  <input id="vimgRowInput" type="file" accept="image/*" hidden
                    onChange={(e) => { if (rowUploadIdx !== null) { handleUploadVariantImageRow(rowUploadIdx, e.target.files); setRowUploadIdx(null); e.target.value = '' } }} />
                </tbody>
              </table>
            </div>
          )}


        </div>

        <button type="submit" disabled={saving}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <Loader className="h-4 w-4 animate-spin" /> : null}
          {isEdit ? 'Cập nhật sản phẩm' : 'Tạo sản phẩm'}
        </button>
      </form>

      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCatModal(false)}>
          <div className="bg-white rounded-2xl max-w-sm w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2">Thêm danh mục mới</h3>
            <input value={quickAddName} onChange={e => setQuickAddName(e.target.value)}
              placeholder="Nhập tên danh mục" autoFocus
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={e => e.key === 'Enter' && handleQuickAddCategory()} />
            <div className="flex gap-3">
              <button onClick={() => setShowCatModal(false)} className="flex-1 py-2.5 border rounded-xl text-sm font-medium hover:bg-gray-50">Hủy</button>
              <button onClick={handleQuickAddCategory} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">Thêm</button>
            </div>
          </div>
        </div>
      )}

      {showBrandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowBrandModal(false)}>
          <div className="bg-white rounded-2xl max-w-sm w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2">Thêm thương hiệu mới</h3>
            <input value={quickAddName} onChange={e => setQuickAddName(e.target.value)}
              placeholder="Nhập tên thương hiệu" autoFocus
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={e => e.key === 'Enter' && handleQuickAddBrand()} />
            <div className="flex gap-3">
              <button onClick={() => setShowBrandModal(false)} className="flex-1 py-2.5 border rounded-xl text-sm font-medium hover:bg-gray-50">Hủy</button>
              <button onClick={handleQuickAddBrand} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">Thêm</button>
            </div>
          </div>
        </div>
      )}

      {showColorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowColorModal(false)}>
          <div className="bg-white rounded-2xl max-w-xl w-full mx-4 p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-base mb-4">Thêm màu sắc mới</h3>
            <div className="flex gap-6">
              <div className="overflow-x-auto flex-1 min-w-0 -mx-1 px-1">
                {(() => {
                  const levels = [100, 200, 300, 400, 500, 600, 700]
                  const lightHexes = new Set(['#FFF9C4','#FFF59D','#FFF176','#FFE0B2','#FFCDD2','#F8BBD0','#F5F5F5','#D7CCC8','#D1C4E9','#BBDEFB','#C8E6C9','#FFEBEE','#E3F2FD','#E8F5E9','#FFF3E0','#FCE4EC','#EDE7F6','#E0F2F1'])
                  const families = [
                    { name: 'Đỏ', shades: ['#FFCDD2','#EF9A9A','#E57373','#EF5350','#F44336','#E53935','#D32F2F'] },
                    { name: 'Hồng', shades: ['#F8BBD0','#F48FB1','#F06292','#EC407A','#E91E63','#D81B60','#C2185B'] },
                    { name: 'Tím', shades: ['#D1C4E9','#B39DDB','#9575CD','#7E57C2','#673AB7','#5E35B1','#512DA8'] },
                    { name: 'X.dương', shades: ['#BBDEFB','#90CAF9','#64B5F6','#42A5F5','#2196F3','#1E88E5','#1976D2'] },
                    { name: 'X.lá', shades: ['#C8E6C9','#A5D6A7','#81C784','#66BB6A','#4CAF50','#43A047','#388E3C'] },
                    { name: 'Vàng', shades: ['#FFF9C4','#FFF59D','#FFF176','#FFEE58','#FFEB3B','#FDD835','#FBC02D'] },
                    { name: 'Cam', shades: ['#FFE0B2','#FFCC80','#FFB74D','#FFA726','#FF9800','#FB8C00','#F57C00'] },
                    { name: 'Nâu', shades: ['#D7CCC8','#BCAAA4','#A1887F','#8D6E63','#795548','#6D4C41','#5D4037'] },
                    { name: 'Xám', shades: ['#F5F5F5','#E0E0E0','#BDBDBD','#9E9E9E','#757575','#616161','#424242'] },
                  ]
                  return (<>
                    <div className="flex gap-1 mb-1.5 ml-14">
                      {levels.map(lvl => (
                        <div key={lvl} className="w-7 shrink-0 text-center text-[10px] font-semibold text-gray-400 tracking-wide">{lvl}</div>
                      ))}
                    </div>
                    {families.map((f, fi) => (
                      <div key={fi} className="flex gap-1 mb-1 items-center">
                        <div className="w-12 shrink-0 text-[11px] font-medium text-gray-500 text-right pr-1 truncate">{f.name}</div>
                        {f.shades.map((hex, si) => (
                          <button key={hex} type="button"
                            onClick={() => { setQuickColorHex(hex); setQuickColorName(f.name) }}
                            className={`w-7 h-7 rounded-full border transition-all duration-150 ${quickColorHex === hex ? 'border-blue-600 ring-2 ring-blue-300 ring-offset-1 scale-110 z-10 shadow-sm' : (lightHexes.has(hex) ? 'border-gray-300 hover:border-gray-500' : 'border-gray-200 hover:border-gray-400')}`}
                            style={{ backgroundColor: hex }}
                            title={`${f.name} ${levels[si]} (${hex})`} />
                        ))}
                      </div>
                    ))}
                  </>)
                })()}
                <div className="flex gap-1 mt-3 pt-2.5 border-t border-gray-200">
                  {[
                    { hex: '#FFFFFF', name: 'Trắng' },
                    { hex: '#000000', name: 'Đen' },
                    { hex: '#2F3640', name: 'Than' },
                    { hex: '#607D8B', name: 'Rêu' },
                    { hex: '#9E9E9E', name: 'Ghi' },
                    { hex: '#D4A574', name: 'Be' },
                    { hex: '#795548', name: 'Nâu' },
                    { hex: '#FF5722', name: 'Cam đỏ' },
                    { hex: '#00BCD4', name: 'Ngọc' },
                    { hex: '#CDDC39', name: 'Chanh' },
                  ].map(c => (
                    <button key={c.hex} type="button"
                      onClick={() => { setQuickColorHex(c.hex); setQuickColorName(c.name) }}
                      className={`w-7 h-7 rounded-full border transition-all duration-150 ${quickColorHex === c.hex ? 'border-blue-600 ring-2 ring-blue-300 ring-offset-1 scale-110 z-10 shadow-sm' : (c.hex === '#FFFFFF' ? 'border-gray-300 hover:border-gray-500' : 'border-gray-200 hover:border-gray-400')}`}
                      style={{ backgroundColor: c.hex }}
                      title={`${c.name} (${c.hex})`} />
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-center gap-3 shrink-0 w-32 pt-2">
                <div className="w-14 h-14 rounded-full border-2 border-gray-200 shadow-md" style={{ backgroundColor: quickColorHex }} />
                <span className="text-[11px] font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">{quickColorHex}</span>
                <input value={quickColorName} onChange={e => setQuickColorName(e.target.value)}
                  placeholder="Nhập tên màu" autoFocus
                  className="w-full border rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow" />
                <div className="flex gap-2 w-full mt-1">
                  <button onClick={() => setShowColorModal(false)} className="flex-1 py-2 border rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors">Hủy</button>
                  <button onClick={handleQuickAddColor} className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors">Thêm</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowSizeModal(false)}>
          <div className="bg-white rounded-2xl max-w-sm w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2">Thêm kích cỡ mới</h3>
            <input value={quickSizeName} onChange={e => setQuickSizeName(e.target.value)}
              placeholder="Nhập tên kích cỡ (VD: M, L, XL)" autoFocus
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={e => e.key === 'Enter' && handleQuickAddSize()} />
            <div className="flex gap-3">
              <button onClick={() => setShowSizeModal(false)} className="flex-1 py-2.5 border rounded-xl text-sm font-medium hover:bg-gray-50">Hủy</button>
              <button onClick={handleQuickAddSize} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">Thêm</button>
            </div>
          </div>
        </div>
      )}

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
