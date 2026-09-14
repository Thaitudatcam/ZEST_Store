import { useState, useEffect, Fragment } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { getActiveCategories } from '../../api/categories'
import { uploadProductImage, uploadVariantImage, generateDescription } from '../../api/products'
import { createCategory, createBrand, createColor, createSize, getThuocTinh, createThuocTinh } from '../../api/admin'
import { useToast } from '../../context/ToastContext'
import SafeImg from '../../components/SafeImg'
import { Loader, Plus, Upload, Check, FolderPlus, Tag, Palette, Sparkles, X, EyeOff, Zap } from 'lucide-react'
import EmptyState from '../../components/EmptyState'
import ConfirmDialog from '../../components/ConfirmDialog'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

const VND = (n) => { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }

const LOAI_THUOC_TINH = [
  { key: 'LOAI_AO', label: 'Loại áo' },
  { key: 'KIEU_DANG', label: 'Kiểu dáng' },
  { key: 'CHAT_LIEU', label: 'Chất liệu' },
  { key: 'CO_AO', label: 'Cổ áo' },
]

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
    ['link', 'image'],
    ['clean'],
  ],
}

export default function AdminProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const isEdit = Boolean(id)

  const [product, setProduct] = useState({
    tenSanPham: '', slug: '', maDanhMuc: '', maThuongHieu: '', moTa: '', trangThai: 1,
    xuatXu: '',
    maLoaiAo: '', maKieuDang: '', maChatLieu: '', maCoAo: '',
  })
  const [categories, setCategories] = useState([])
  const [sizes, setSizes] = useState([])
  const [colors, setColors] = useState([])
  const [brands, setBrands] = useState([])
  const [variants, setVariants] = useState([])
  const [uploadedImages, setUploadedImages] = useState([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [generatingDesc, setGeneratingDesc] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmDeleteColor, setConfirmDeleteColor] = useState(null)
  const [confirmSaveProduct, setConfirmSaveProduct] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editIdx, setEditIdx] = useState(null)
  const [vform, setVform] = useState({ maKichCo: '', maMauSac: '', gia: '', giaNhap: '', tonKho: '0', urlAnh: '' })
  const [uploadingVimg, setUploadingVimg] = useState(false)
  const [savingVar, setSavingVar] = useState(false)
  const [savingRow, setSavingRow] = useState(null)
  const [uploadingColorId, setUploadingColorId] = useState(null)
  const [quickAddName, setQuickAddName] = useState('')
  const [quickColorName, setQuickColorName] = useState('')
  const [quickColorHex, setQuickColorHex] = useState('#000000')
  const [quickSizeName, setQuickSizeName] = useState('')
  const [selectedColorIds, setSelectedColorIds] = useState([])
  const [selectedSizeIds, setSelectedSizeIds] = useState([])
  const [deletedColorIds, setDeletedColorIds] = useState([])
  const [sessionCreatedColorIds, setSessionCreatedColorIds] = useState([])

  const [showCatModal, setShowCatModal] = useState(false)
  const [showBrandModal, setShowBrandModal] = useState(false)
  const [showColorModal, setShowColorModal] = useState(false)
  const [showSizeModal, setShowSizeModal] = useState(false)
  const [showThuocTinhModal, setShowThuocTinhModal] = useState(false)
  const [thuocTinhType, setThuocTinhType] = useState('')
  const [quickThuocTinhName, setQuickThuocTinhName] = useState('')

  const [showBulkApply, setShowBulkApply] = useState(false)
  const [bulkForm, setBulkForm] = useState({ giaBan: '', giaNhap: '', tonKho: '', onlyEmpty: true })

  const [thuocTinhData, setThuocTinhData] = useState({})
  const [origins, setOrigins] = useState([])

  // Chỉ đếm những tổ hợp chưa có trong bảng. Nhờ đó người dùng biết chính xác
  // thao tác "tạo tổ hợp" sẽ thêm bao nhiêu biến thể mới.
  const selectedCombinationCount = selectedColorIds.length * selectedSizeIds.length
  const existingSelectedCombinationCount = selectedColorIds.reduce((total, colorId) => (
    total + selectedSizeIds.filter(sizeId => variants.some(v =>
      Number(v.maMauSac) === Number(colorId) && Number(v.maKichCo) === Number(sizeId)
    )).length
  ), 0)
  const newCombinationCount = Math.max(0, selectedCombinationCount - existingSelectedCombinationCount)
  const invalidPriceCount = variants.filter(v => !v.gia || Number(v.gia) <= 0).length
  const canSubmitProduct = Boolean(
    product.tenSanPham.trim() && product.maDanhMuc && product.maThuongHieu &&
    variants.length > 0 && invalidPriceCount === 0
  )
  const publishChecklist = [
    { label: 'Tên sản phẩm', done: Boolean(product.tenSanPham.trim()) },
    { label: 'Danh mục', done: Boolean(product.maDanhMuc) },
    { label: 'Thương hiệu', done: Boolean(product.maThuongHieu) },
    { label: 'Ảnh đại diện', done: uploadedImages.length > 0 },
    { label: 'Biến thể sản phẩm', done: variants.length > 0 },
    { label: 'Giá bán hợp lệ', done: variants.length > 0 && invalidPriceCount === 0 },
  ]

  useEffect(() => {
    Promise.all([
      getActiveCategories(),
      api.get('/sizes').then(r => r.data),
      api.get('/colors').then(r => r.data),
      api.get('/brands').then(r => r.data),
      ...LOAI_THUOC_TINH.map(l => getThuocTinh(l.key).then(d => [l.key, d]).catch(() => [l.key, []])),
      getThuocTinh('XUAT_XU').catch(() => []),
      isEdit ? api.get(`/products/detail/${id}`).then(r => r.data) : Promise.resolve(null),
    ]).then((results) => {
      const [cats, sz, cl, br, ...remainingResults] = results
      // The final Promise.all result is the product detail in edit mode;
      // exclude it before iterating the six attribute lookup results.
      const detail = remainingResults.pop()
      const originData = remainingResults.pop()
      const thuocTinhResults = remainingResults

      setCategories(Array.isArray(cats) ? cats : [])
      setSizes(Array.isArray(sz) ? sz : [])
      setColors(Array.isArray(cl) ? cl : [])
      setBrands(Array.isArray(br) ? br : [])
      setOrigins(Array.isArray(originData) ? originData : [])

      const ttMap = {}
      thuocTinhResults.forEach(([key, data]) => { ttMap[key] = Array.isArray(data) ? data : [] })
      setThuocTinhData(ttMap)

      const stored = localStorage.getItem(`productDeletedColors_${id || 'new'}`)
      if (stored) setDeletedColorIds(JSON.parse(stored))

      if (detail) {
        const firstBrand = detail.variants?.find(v => v.thuongHieu)?.thuongHieu
        setProduct({
          tenSanPham: detail.product.tenSanPham,
          slug: detail.product.slug || '',
          maDanhMuc: detail.product.danhMuc?.maDanhMuc || '',
          maThuongHieu: firstBrand?.maThuongHieu || '',
          moTa: detail.product.moTa || '',
          trangThai: detail.product.trangThai ?? 1,
          xuatXu: detail.product.xuatXu || '',
          maLoaiAo: detail.product.loaiAo?.maThuocTinh || '',
          maKieuDang: detail.product.kieuDang?.maThuocTinh || '',
          maChatLieu: detail.product.chatLieu?.maThuocTinh || '',
          maCoAo: detail.product.coAo?.maThuocTinh || '',
        })
        setVariants((detail.variants || []).map(v => ({
          ...v,
          maKichCo: v.maKichCo || v.kichCo?.maKichCo || '',
          maMauSac: v.maMauSac || v.mauSac?.maMauSac || '',
        })))
        // Ảnh sản phẩm chỉ có một vai trò: ảnh đại diện ở trang danh sách.
        // Ảnh theo màu được quản lý độc lập bên dưới phần biến thể.
        setUploadedImages(detail.product.urlAnhDaiDien
          ? [{ url: detail.product.urlAnhDaiDien, fileId: 'main' }]
          : [])
      }
    }).catch(() => toast.error('Không thể tải dữ liệu'))
    .finally(() => setLoading(false))
  }, [id])

  const updateProductField = (field, value) => setProduct(p => ({ ...p, [field]: value }))

  const slugify = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const buildProductPayload = (trangThai = product.trangThai) => ({
    ...product,
    maDanhMuc: Number(product.maDanhMuc),
    // Slug là URL công khai: chỉ tạo khi sản phẩm mới, không đổi khi chỉnh sửa.
    slug: product.slug || `${slugify(product.tenSanPham)}-${Date.now()}`,
    trangThai,
    xuatXu: product.xuatXu || null,
    maLoaiAo: product.maLoaiAo ? Number(product.maLoaiAo) : null,
    maKieuDang: product.maKieuDang ? Number(product.maKieuDang) : null,
    maChatLieu: product.maChatLieu ? Number(product.maChatLieu) : null,
    maCoAo: product.maCoAo ? Number(product.maCoAo) : null,
  })

  const requestSaveProduct = (e) => {
    e.preventDefault()
    if (!product.tenSanPham.trim()) { toast.error('Vui lòng nhập tên sản phẩm'); return }
    if (!product.maDanhMuc) { toast.error('Vui lòng chọn danh mục'); return }
    if (!product.maThuongHieu) { toast.error('Vui lòng chọn thương hiệu'); return }
    if (variants.length === 0) { toast.error('Vui lòng tạo ít nhất một biến thể'); return }
    const zeroPriceVariant = variants.find(v => !v.gia || Number(v.gia) <= 0)
    if (zeroPriceVariant) { toast.error('Giá biến thể phải lớn hơn 0'); return }
    setConfirmSaveProduct(true)
  }

  const handleSaveDraft = async () => {
    if (!product.tenSanPham.trim() || !product.maDanhMuc) {
      toast.error('Nháp cần có ít nhất tên sản phẩm và danh mục'); return
    }
    setSaving(true)
    try {
      const payload = buildProductPayload(2)
      let productId = id
      if (isEdit) await api.put(`/products/${id}`, payload)
      else {
        const result = await api.post('/products', payload)
        productId = result.data.maSanPham
      }
      if (uploadedImages[0]?.url) {
        await api.put(`/products/${productId}`, { ...payload, urlAnhDaiDien: uploadedImages[0].url })
      }
      setProduct(current => ({ ...current, trangThai: 2 }))
      toast.success('Đã lưu nháp. Sản phẩm không hiển thị với khách hàng.')
      if (!isEdit) navigate(`/admin/products/${productId}/edit`, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể lưu nháp')
    } finally { setSaving(false) }
  }

  const handleSaveProduct = async () => {
    setConfirmSaveProduct(false)
    setSaving(true)
    try {
      const payload = buildProductPayload(1)

      let productId = isEdit ? id : null
      if (isEdit) {
        await api.put(`/products/${id}`, payload)
        for (const v of variants) {
          if (v.maBienThe) {
            const savedVariant = await api.put(`/products/variants/${v.maBienThe}`, {
              sku: v.sku,
              maThuongHieu: Number(product.maThuongHieu),
              maKichCo: Number(v.maKichCo),
              maMauSac: Number(v.maMauSac),
              gia: Number(v.gia),
              giaNhap: Number(v.giaNhap || 0),
              tonKho: Number(v.tonKho || 0),
              version: v.version,
              urlAnh: v.urlAnh || undefined,
            })
            v.version = savedVariant.data.version
          } else {
            const res = await api.post(`/products/${id}/variants`, {
              maKichCo: Number(v.maKichCo),
              maMauSac: Number(v.maMauSac),
              maThuongHieu: Number(product.maThuongHieu),
              gia: Number(v.gia),
              giaNhap: Number(v.giaNhap || 0),
              tonKho: Number(v.tonKho || 0),
              version: v.version,
              urlAnh: v.urlAnh || undefined,
              sku: v.sku,
            })
            v.maBienThe = res.data.maBienThe
            v.sku = res.data.sku
            v.version = res.data.version
          }
        }
      } else {
        const variantReqs = variants.map(v => ({
          maKichCo: Number(v.maKichCo),
          maMauSac: Number(v.maMauSac),
          maThuongHieu: Number(product.maThuongHieu),
          sku: v.sku,
          gia: Number(v.gia),
          giaNhap: Number(v.giaNhap || 0),
          tonKho: Number(v.tonKho || 0),
              version: v.version,
          urlAnh: v.urlAnh || undefined,
        }))
        const res = await api.post('/products/with-variants', { product: payload, variants: variantReqs })
        productId = res.data.maSanPham
      }
      if (!isEdit) {
        toast.success('Tạo sản phẩm thành công')
        if (uploadedImages.length > 0) {
          await api.put(`/products/${productId}`, { ...payload, urlAnhDaiDien: uploadedImages[0].url })
        }
        navigate(`/admin/products/${productId}/edit`, { replace: true })
        return
      }
      if (uploadedImages.length > 0) {
        try {
          await api.put(`/products/${id}`, { ...payload, urlAnhDaiDien: uploadedImages[0].url })
        } catch (imgErr) { console.error('Failed to save product image', imgErr) }
      }
      toast.success('Cập nhật sản phẩm thành công')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi lưu sản phẩm')
    } finally { setSaving(false) }
  }

  const openAddForm = () => {
    setEditIdx(null)
    setVform({ maKichCo: '', maMauSac: '', gia: '', giaNhap: '', tonKho: '0', urlAnh: '' })
    setShowForm(true)
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditIdx(null)
    setVform({ maKichCo: '', maMauSac: '', gia: '', giaNhap: '', tonKho: '0', urlAnh: '' })
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
    if (duplicate) { toast.error(`Biến thể ${sizeName} - ${colorName} đã tồn tại`); return }

    setSavingVar(true)

    if (editIdx !== null) {
      const v = variants[editIdx]
      const updated = {
        ...v, maKichCo: Number(vform.maKichCo), maMauSac: Number(vform.maMauSac),
        kichCo: { kichCo: sizeName }, mauSac: { mauSac: colorName, maMauHex: colorHex },
        gia: Number(vform.gia), giaNhap: Number(vform.giaNhap || 0), tonKho: Number(vform.tonKho || 0), urlAnh: vform.urlAnh,
      }
      if (v.maBienThe) {
        try {
          const savedVariant = await api.put(`/products/variants/${v.maBienThe}`, {
            sku: v.sku, maThuongHieu: Number(product.maThuongHieu),
            maKichCo: Number(vform.maKichCo), maMauSac: Number(vform.maMauSac),
            gia: Number(vform.gia), giaNhap: Number(vform.giaNhap || 0), tonKho: Number(vform.tonKho || 0),
            version: v.version, urlAnh: vform.urlAnh || undefined,
          })
          updated.version = savedVariant.data.version
        } catch (err) {
          toast.error(err.response?.data?.message || 'Lỗi cập nhật biến thể')
          setSavingVar(false); return
        }
      }
      setVariants(prev => prev.map((x, i) => i === editIdx ? updated : x))
      toast.success('Cập nhật biến thể thành công')
    } else {
      setVariants(prev => [...prev, {
        maKichCo: Number(vform.maKichCo), maMauSac: Number(vform.maMauSac),
        kichCo: { kichCo: sizeName }, mauSac: { mauSac: colorName, maMauHex: colorHex },
        gia: Number(vform.gia), giaNhap: Number(vform.giaNhap || 0), tonKho: Number(vform.tonKho || 0), urlAnh: vform.urlAnh,
        _tempId: Date.now(),
      }])
      toast.success('Thêm biến thể thành công')
    }
    setSavingVar(false); cancelForm()
  }

  const handleDeleteVariant = (index) => {
    if (!isEdit) {
      setVariants(prev => prev.filter((_, i) => i !== index))
      setConfirmDelete(null); toast.success('Đã xóa biến thể'); return
    }
    const v = variants[index]
    if (!v.maBienThe) {
      setVariants(prev => prev.filter((_, i) => i !== index)); setConfirmDelete(null); return
    }
    api.put(`/products/variants/${v.maBienThe}/toggle`).then(() => {
      toast.success('Đã ẩn biến thể')
      setConfirmDelete(null)
      return api.get(`/products/detail/${id}`).then(r => r.data)
    }).then(detail => setVariants((detail.variants || []).map(v => ({
      ...v, maKichCo: v.maKichCo || v.kichCo?.maKichCo || '', maMauSac: v.maMauSac || v.mauSac?.maMauSac || '',
    }))))
    .catch(err => toast.error(err.response?.data?.message || 'Ẩn biến thể thất bại'))
  }

  const handleUploadVariantImage = async (files) => {
    if (!files || files.length === 0) return
    setUploadingVimg(true)
    try {
      const data = await uploadVariantImage(files[0])
      setVform(prev => ({ ...prev, urlAnh: data.url }))
      toast.success('Upload ảnh biến thể thành công')
    } catch (err) { toast.error(err.message || 'Upload ảnh thất bại') }
    finally { setUploadingVimg(false) }
  }

  const handleVariantFieldChange = (index, field, value) => {
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v))
  }

  const handleUploadColorImage = async (colorId, files) => {
    if (!files || files.length === 0) return
    setUploadingColorId(colorId)
    try {
      const data = await uploadVariantImage(files[0])
      setVariants(prev => prev.map(v => Number(v.maMauSac) === Number(colorId) ? { ...v, urlAnh: data.url } : v))
      toast.success('Upload ảnh thành công')
    } catch (err) { toast.error(err.message || 'Upload ảnh thất bại') }
    finally { setUploadingColorId(null) }
  }

  const handleSaveVariantRow = async (index) => {
    const v = variants[index]
    if (!v.gia || Number(v.gia) <= 0) { toast.error('Giá biến thể phải lớn hơn 0'); setSavingRow(null); return }
    setSavingRow(index)
    try {
      if (v.maBienThe) {
        const savedVariant = await api.put(`/products/variants/${v.maBienThe}`, {
          sku: v.sku, maThuongHieu: Number(product.maThuongHieu),
          maKichCo: Number(v.maKichCo), maMauSac: Number(v.maMauSac),
          gia: Number(v.gia), giaNhap: Number(v.giaNhap || 0), tonKho: Number(v.tonKho || 0),
          version: v.version, urlAnh: v.urlAnh || undefined,
        })
        setVariants(prev => prev.map(x => x.maBienThe === v.maBienThe ? { ...x, version: savedVariant.data.version } : x))
      } else if (id) {
        const res = await api.post(`/products/${id}/variants`, {
          maKichCo: Number(v.maKichCo), maMauSac: Number(v.maMauSac),
          maThuongHieu: Number(product.maThuongHieu), gia: Number(v.gia),
          giaNhap: Number(v.giaNhap || 0), tonKho: Number(v.tonKho || 0),
          version: v.version, urlAnh: v.urlAnh || undefined,
          sku: v.sku,
        })
        setVariants(prev => prev.map((x, i) => i === index ? { ...x, maBienThe: res.data.maBienThe, sku: res.data.sku, version: res.data.version } : x))
      }
      toast.success('Đã lưu biến thể')
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi lưu biến thể') }
    finally { setSavingRow(null) }
  }

  const handleUploadProductImage = async (files) => {
    if (!files || files.length === 0) return
    setUploadingImg(true)
    try {
      const data = await uploadProductImage(files[0])
      setUploadedImages([{ url: data.url, fileId: 'main' }])
      toast.success('Đã chọn ảnh đại diện mới')
    } catch (err) { toast.error(err.message || 'Upload ảnh thất bại') }
    finally { setUploadingImg(false) }
  }

  const handleDeleteVariantsByColor = (maMauSac) => {
    const colorId = Number(maMauSac)
    const name = colors.find(c => c.maMauSac === colorId)?.mauSac || ''
    setVariants(prev => prev.filter(v => Number(v.maMauSac) !== colorId))
    setSelectedColorIds(prev => prev.filter(id => Number(id) !== colorId))
    setDeletedColorIds(prev => {
      const next = [...prev, colorId]
      localStorage.setItem(`productDeletedColors_${id || 'new'}`, JSON.stringify(next))
      return next
    })
    setConfirmDeleteColor(null); toast.success('Đã xóa màu ' + name)
    if (isEdit && variants.some(v => v.maBienThe && Number(v.maMauSac) === colorId)) {
      api.delete(`/products/${id}/variants/by-color/${maMauSac}`).catch(() => toast.error('Xóa biến thể thất bại'))
    } else if (sessionCreatedColorIds.includes(colorId)) {
      api.delete(`/colors/${colorId}`).catch(() => {})
        .then(() => setSessionCreatedColorIds(prev => prev.filter(id => id !== colorId)))
    }
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
      setShowCatModal(false); setQuickAddName('')
      toast.success(`Đã thêm danh mục "${newCat.tenDanhMuc}"`)
    } catch { toast.error('Lỗi thêm danh mục') }
  }

  const handleQuickAddBrand = async () => {
    if (!quickAddName.trim()) return
    try {
      const newBrand = await createBrand({ tenThuongHieu: quickAddName.trim() })
      setBrands(prev => [...prev, newBrand])
      setProduct(p => ({ ...p, maThuongHieu: newBrand.maThuongHieu }))
      setShowBrandModal(false); setQuickAddName('')
      toast.success(`Đã thêm thương hiệu "${newBrand.tenThuongHieu}"`)
    } catch { toast.error('Lỗi thêm thương hiệu') }
  }

  const handleQuickAddColor = async () => {
    if (!quickColorName.trim()) return
    try {
      const newColor = await createColor({ tenMauSac: quickColorName.trim(), maMauHex: quickColorHex })
      setColors(prev => [...prev, newColor])
      setSelectedColorIds(prev => [...prev, newColor.maMauSac])
      setSessionCreatedColorIds(prev => [...prev, newColor.maMauSac])
      setShowColorModal(false); setQuickColorName(''); setQuickColorHex('#000000')
      toast.success('Thêm màu sắc thành công')
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi thêm màu sắc') }
  }

  const handleQuickAddSize = async () => {
    if (!quickSizeName.trim()) return
    try {
      const newSize = await createSize({ tenKichCo: quickSizeName.trim() })
      setSizes(prev => [...prev, newSize])
      setShowSizeModal(false); setQuickSizeName('')
      toast.success('Thêm kích cỡ thành công')
    } catch { toast.error('Lỗi thêm kích cỡ') }
  }

  const handleQuickAddThuocTinh = async () => {
    if (!quickThuocTinhName.trim()) return
    try {
      const created = await createThuocTinh(thuocTinhType, quickThuocTinhName.trim())
      if (thuocTinhType === 'XUAT_XU') {
        setOrigins(prev => [...prev, created])
        setProduct(p => ({ ...p, xuatXu: created.giaTri }))
        setShowThuocTinhModal(false); setQuickThuocTinhName('')
        toast.success(`Đã thêm xuất xứ "${created.giaTri}"`)
        return
      }
      setThuocTinhData(prev => ({ ...prev, [thuocTinhType]: [...(prev[thuocTinhType] || []), created] }))
      const fieldMap = { LOAI_AO: 'maLoaiAo', KIEU_DANG: 'maKieuDang', CHAT_LIEU: 'maChatLieu', CO_AO: 'maCoAo' }
      const field = fieldMap[thuocTinhType]
      if (field) setProduct(p => ({ ...p, [field]: created.maThuocTinh }))
      setShowThuocTinhModal(false); setQuickThuocTinhName('')
      toast.success(`Đã thêm "${created.giaTri}"`)
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi thêm thuộc tính') }
  }

  const openThuocTinhModal = (type) => {
    setThuocTinhType(type)
    setQuickThuocTinhName('')
    setShowThuocTinhModal(true)
  }

  const handleBulkApply = () => {
    const gBan = Number(bulkForm.giaBan) || 0
    const gNhap = Number(bulkForm.giaNhap) || 0
    const sl = Number(bulkForm.tonKho) || 0
    if (gBan === 0 && gNhap === 0 && sl === 0) { toast.error('Nhập ít nhất một giá trị để áp dụng'); return }

    setVariants(prev => prev.map(v => {
      const shouldApply = bulkForm.onlyEmpty
        ? (Number(v.gia) === 0 && gBan > 0) || (Number(v.giaNhap) === 0 && gNhap > 0) || (Number(v.tonKho) === 0 && sl > 0)
        : true
      if (!shouldApply) return v
      return {
        ...v,
        gia: gBan > 0 ? gBan : v.gia,
        giaNhap: gNhap > 0 ? gNhap : v.giaNhap,
        tonKho: sl > 0 ? sl : v.tonKho,
      }
    }))
    toast.success('Đã áp dụng giá trị mặc định')
    setShowBulkApply(false)
    setBulkForm({ giaBan: '', giaNhap: '', tonKho: '', onlyEmpty: true })
  }

  const toggleColorId = (id) => setSelectedColorIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const toggleSizeId = (id) => setSelectedSizeIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleGenerateVariants = () => {
    if (selectedColorIds.length === 0) { toast.error('Chọn ít nhất một màu'); return }
    if (selectedSizeIds.length === 0) { toast.error('Chọn ít nhất một kích cỡ'); return }
    const newVariants = []
    selectedColorIds.forEach(cId => {
      selectedSizeIds.forEach(sId => {
        const exists = variants.some(v => Number(v.maKichCo) === Number(sId) && Number(v.maMauSac) === Number(cId))
        if (!exists) {
          const sizeName = sizes.find(s => s.maKichCo === Number(sId))?.kichCo || ''
          const colorName = colors.find(c => c.maMauSac === Number(cId))?.mauSac || ''
          const colorHex = colors.find(c => c.maMauSac === Number(cId))?.maMauHex
          newVariants.push({
            maKichCo: Number(sId), maMauSac: Number(cId),
            kichCo: { kichCo: sizeName }, mauSac: { mauSac: colorName, maMauHex: colorHex },
            gia: 0, giaNhap: 0, tonKho: 0, urlAnh: '', _tempId: Date.now() + newVariants.length,
          })
        }
      })
    })
    if (newVariants.length === 0) { toast.error('Các biến thể đã tồn tại'); return }
    setVariants(prev => [...prev, ...newVariants])
    toast.success(`Đã tạo ${newVariants.length} biến thể`)
  }

  if (loading) {
    return <div className="animate-pulse space-y-6"><div className="h-8 w-48 bg-ivory-100 rounded-lg" /><div className="h-96 bg-ivory-100 rounded-2xl" /></div>
  }

  return (
    <div>
      <form onSubmit={requestSaveProduct} className="bg-ivory rounded-2xl border p-6 space-y-6">
        <div className="grid grid-cols-[1fr_400px] gap-6">
          {/* ═══ CỘT TRÁI ═══ */}
          <div className="space-y-6">
            {/* ── Thông tin cơ bản ── */}
            <div>
              <h2 className="font-semibold text-lg mb-3">Thông tin cơ bản</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-stone font-medium">Tên sản phẩm *</label>
                  <input value={product.tenSanPham} onChange={(e) => updateProductField('tenSanPham', e.target.value)}
                    placeholder="Nhập tên sản phẩm" required
                    className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-gold" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-stone font-medium">Thương hiệu *</label>
                      <button type="button" onClick={() => { setQuickAddName(''); setShowBrandModal(true) }}
                        className="p-1 text-gold hover:bg-gold/10 rounded" title="Thêm thương hiệu mới">
                        <Tag className="h-4 w-4" />
                      </button>
                    </div>
                    <select value={product.maThuongHieu} onChange={(e) => updateProductField('maThuongHieu', e.target.value)}
                      required className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-gold">
                      <option value="">-- Chọn thương hiệu --</option>
                      {brands.map(b => <option key={b.maThuongHieu} value={b.maThuongHieu}>{b.tenThuongHieu}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-stone font-medium">Danh mục *</label>
                      <button type="button" onClick={() => { setQuickAddName(''); setShowCatModal(true) }}
                        className="p-1 text-gold hover:bg-gold/10 rounded" title="Thêm danh mục mới">
                        <FolderPlus className="h-4 w-4" />
                      </button>
                    </div>
                    <select value={product.maDanhMuc} onChange={(e) => updateProductField('maDanhMuc', e.target.value)}
                      required className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-gold">
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map(c => <option key={c.maDanhMuc} value={c.maDanhMuc}>{c.tenDanhMuc}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-stone font-medium">Xuất xứ</label>
                    <button type="button" onClick={() => openThuocTinhModal('XUAT_XU')}
                      className="p-1 text-gold hover:bg-gold/10 rounded" title="Thêm xuất xứ mới">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <select value={product.xuatXu} onChange={(e) => updateProductField('xuatXu', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-gold">
                    <option value="">-- Chọn xuất xứ --</option>
                    {origins.map(origin => <option key={origin.maThuocTinh} value={origin.giaTri}>{origin.giaTri}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* ── Phân loại sản phẩm ── */}
            <div>
              <h2 className="font-semibold text-lg mb-3">Phân loại sản phẩm</h2>
              <div className="grid grid-cols-2 gap-3">
                {LOAI_THUOC_TINH.map(({ key, label }) => {
                  const fieldMap = { LOAI_AO: 'maLoaiAo', KIEU_DANG: 'maKieuDang', CHAT_LIEU: 'maChatLieu', CO_AO: 'maCoAo' }
                  const field = fieldMap[key]
                  return (
                    <div key={key}>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-stone font-medium">{label}</label>
                        <button type="button" onClick={() => openThuocTinhModal(key)}
                          className="p-1 text-gold hover:bg-gold/10 rounded" title={`Thêm ${label.toLowerCase()} mới`}>
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <select value={product[field]} onChange={(e) => updateProductField(field, e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-gold">
                        <option value="">-- Chọn {label.toLowerCase()} --</option>
                        {(thuocTinhData[key] || []).map(tt => (
                          <option key={tt.maThuocTinh} value={tt.maThuocTinh}>{tt.giaTri}</option>
                        ))}
                      </select>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── Mô tả sản phẩm (Rich Text Editor) ── */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-stone font-medium">Mô tả sản phẩm</label>
                <button type="button" onClick={async () => {
                  if (!product.tenSanPham) { toast.warning('Vui lòng nhập tên sản phẩm trước'); return }
                  setGeneratingDesc(true)
                  try {
                    const res = await generateDescription({ tenSanPham: product.tenSanPham, maDanhMuc: product.maDanhMuc || null, maThuongHieu: product.maThuongHieu || null })
                    updateProductField('moTa', res.description)
                    toast.success('Đã tạo mô tả bằng AI')
                  } catch { toast.error('Tạo mô tả thất bại') }
                  finally { setGeneratingDesc(false) }
                }} disabled={generatingDesc}
                  className="flex items-center gap-1 text-xs text-gold hover:text-gold-hover font-medium disabled:opacity-50">
                  <Sparkles className="h-3.5 w-3.5" />
                  {generatingDesc ? 'Đang tạo...' : 'Tạo bằng AI'}
                </button>
              </div>
              <div className="mt-1 border rounded-lg overflow-hidden">
                <ReactQuill
                  theme="snow"
                  value={product.moTa || ''}
                  onChange={(val) => updateProductField('moTa', val)}
                  modules={quillModules}
                  placeholder="Mô tả sản phẩm..."
                  style={{ minHeight: '150px' }}
                />
              </div>
            </div>

            {/* ── Trạng thái ── */}
            <div className="flex items-center gap-3">
              <label className="text-sm text-stone font-medium">Trạng thái</label>
              <button type="button" onClick={() => updateProductField('trangThai', product.trangThai === 1 ? 0 : 1)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${product.trangThai === 1 ? 'bg-gold' : 'bg-ivory-100'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-ivory transition ${product.trangThai === 1 ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm text-stone">{product.trangThai === 1 ? 'Hoạt động' : product.trangThai === 2 ? 'Nháp' : 'Ẩn'}</span>
            </div>
          </div>

          {/* ═══ CỘT PHẢI — ẢNH ═══ */}
          <div>
            <h2 className="font-semibold text-lg mb-1">Ảnh đại diện</h2>
            <p className="text-xs text-stone mb-3">Ảnh này hiển thị ở trang chủ, danh sách sản phẩm và kết quả tìm kiếm.</p>
            {uploadedImages.length > 0 ? (
              <div className="relative aspect-square bg-ivory-100 rounded-xl overflow-hidden border group">
                <SafeImg src={uploadedImages[0].url} className="w-full h-full object-cover" fallback="https://placehold.co/400x400/e2e8f0/475569?text=?" />
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/65 to-transparent">
                  <span className="inline-flex text-[10px] font-semibold bg-gold text-noir px-2 py-1 rounded-full">Ảnh đại diện</span>
                </div>
                <button type="button" onClick={() => document.getElementById('imgUpload').click()} disabled={uploadingImg}
                  className="absolute top-3 right-3 px-3 py-1.5 bg-ivory/95 text-noir rounded-lg text-xs font-semibold shadow-sm hover:bg-ivory disabled:opacity-60 transition">
                  {uploadingImg ? 'Đang tải...' : 'Thay ảnh'}
                </button>
              </div>
            ) : (
              <div onClick={() => document.getElementById('imgUpload').click()}
                className="border-2 border-dashed border-stone/30 rounded-xl aspect-square flex flex-col items-center justify-center hover:border-gold transition cursor-pointer gap-2">
                {uploadingImg ? <Loader className="h-5 w-5 animate-spin text-gold" /> : <Upload className="h-8 w-8 text-stone" />}
                <span className="text-xs text-stone">Nhấn để chọn ảnh đại diện</span>
              </div>
            )}
            <input id="imgUpload" type="file" accept="image/*" hidden onChange={(e) => { handleUploadProductImage(e.target.files); e.target.value = '' }} />
          </div>
        </div>

        <hr className="border-t" />

        {/* ═══ BIẾN THỂ ═══ */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Thiết lập biến thể</h2>
          </div>

          <div className="bg-ivory-100 rounded-2xl border border-stone/15 p-4 mb-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
              <div>
                <p className="text-sm font-semibold text-noir">Chọn thuộc tính để tạo tổ hợp</p>
                <p className="text-xs text-stone mt-0.5">Mỗi màu sẽ kết hợp với từng kích cỡ đã chọn.</p>
              </div>
              <div className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedCombinationCount === 0 ? 'bg-ivory text-stone border border-stone/15' : newCombinationCount > 0 ? 'bg-gold/15 text-noir' : 'bg-emerald-50 text-emerald-deep'}`}>
                {selectedCombinationCount === 0
                  ? 'Chưa chọn tổ hợp'
                  : newCombinationCount > 0
                    ? `${selectedColorIds.length} màu × ${selectedSizeIds.length} size · thêm ${newCombinationCount} biến thể`
                    : 'Các tổ hợp đã có sẵn'}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="text-xs text-stone font-medium">Màu sắc</label>
                  <button type="button" onClick={() => { setQuickColorName(''); setQuickColorHex('#000000'); setShowColorModal(true) }}
                    className="p-0.5 text-gold hover:bg-gold/10 rounded" title="Thêm màu mới">
                    <Palette className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {colors.filter(c => !deletedColorIds.includes(c.maMauSac)).map(c => {
                    const selected = selectedColorIds.includes(c.maMauSac)
                    return (
                      <div key={c.maMauSac} className="relative group">
                        <button type="button" onClick={() => toggleColorId(c.maMauSac)}
                          aria-pressed={selected}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition ${selected ? 'bg-gold text-noir border-gold shadow-sm' : 'bg-ivory text-stone border-stone/20 hover:border-gold/60'}`}>
                          {c.maMauHex && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.maMauHex }} />}
                          {c.mauSac}
                          {selected && <Check className="h-3 w-3" />}
                        </button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setConfirmDeleteColor({ maMauSac: c.maMauSac, mauSac: c.mauSac }) }}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-bordeaux/100 text-white rounded-full text-[10px] leading-none flex items-center justify-center hover:bg-bordeaux shadow opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Xóa tất cả biến thể màu này">×</button>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="text-xs text-stone font-medium">Kích cỡ</label>
                  <button type="button" onClick={() => { setQuickSizeName(''); setShowSizeModal(true) }}
                    className="p-0.5 text-gold hover:bg-gold/10 rounded" title="Thêm kích cỡ mới">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map(s => {
                    const selected = selectedSizeIds.includes(s.maKichCo)
                    return (
                      <button key={s.maKichCo} type="button" onClick={() => toggleSizeId(s.maKichCo)}
                        aria-pressed={selected}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border font-medium transition ${selected ? 'bg-gold text-noir border-gold shadow-sm' : 'bg-ivory text-stone border-stone/20 hover:border-gold/60'}`}>
                        {s.kichCo} {selected && <Check className="h-3 w-3" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button type="button" onClick={handleGenerateVariants}
                disabled={newCombinationCount === 0}
                className="bg-gold text-noir px-4 py-2 rounded-lg text-xs font-semibold hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-45 flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                {newCombinationCount > 0 ? `Tạo ${newCombinationCount} tổ hợp biến thể` : 'Tạo tổ hợp biến thể'}
              </button>
              {existingSelectedCombinationCount > 0 && newCombinationCount > 0 && (
                <span className="text-xs text-stone">Bỏ qua {existingSelectedCombinationCount} tổ hợp đã tồn tại</span>
              )}
            </div>
          </div>

          {variants.length === 0 && !showForm ? (
            <div className="mb-4">
              <EmptyState icon="PackageOpen" title="Chưa có biến thể" description="Chọn màu và kích cỡ, sau đó tạo tổ hợp biến thể." />
            </div>
          ) : (
            <>
              {variants.length > 0 && (
                <div className="flex justify-end mb-3">
                  <button type="button" onClick={() => { setBulkForm({ giaBan: '', giaNhap: '', tonKho: '', onlyEmpty: true }); setShowBulkApply(true) }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary-color)] text-white rounded-xl text-xs font-semibold hover:opacity-90 transition">
                    <Zap className="h-3.5 w-3.5" /> Thêm nhanh (Bulk Apply)
                  </button>
                </div>
              )}
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-ivory-100">
                  <th className="text-center px-3 py-2 font-semibold text-stone">Màu & Ảnh</th>
                  <th className="text-center px-3 py-2 font-semibold text-stone">Size</th>
                  <th className="text-center px-3 py-2 font-semibold text-stone">Giá bán</th>
                  <th className="text-center px-3 py-2 font-semibold text-stone">Giá nhập</th>
                  <th className="text-center px-3 py-2 font-semibold text-stone">Tồn</th>
                  <th className="text-center px-3 py-2 font-semibold text-stone">Hành động</th>
                </tr></thead>
                {(() => {
                  const colorGroups = variants.reduce((acc, v) => {
                    const cid = Number(v.maMauSac)
                    if (!acc[cid]) acc[cid] = []
                    acc[cid].push(v)
                    return acc
                  }, {})
                  const colorGroupEntries = Object.entries(colorGroups)
                  return (
                    <tbody className="divide-y">
                      {showForm && (
                        <tr className="bg-gold/10/50">
                          <td className="px-3 py-2">
                            <select value={vform.maMauSac} onChange={(e) => setVform(p => ({ ...p, maMauSac: e.target.value }))}
                              className="w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gold">
                              <option value="">-- Màu --</option>
                              {colors.map(c => <option key={c.maMauSac} value={c.maMauSac}>{c.mauSac} {c.maMauHex ? `(${c.maMauHex})` : ''}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <select value={vform.maKichCo} onChange={(e) => setVform(p => ({ ...p, maKichCo: e.target.value }))}
                              className="w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gold">
                              <option value="">-- Size --</option>
                              {sizes.map(s => <option key={s.maKichCo} value={s.maKichCo}>{s.kichCo}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input type="text" inputMode="numeric" value={vform.gia ? Number(vform.gia).toLocaleString('vi-VN') : ''} onChange={(e) => setVform(p => ({ ...p, gia: e.target.value.replace(/[^0-9]/g, '') }))}
                              placeholder="Giá bán" className="w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gold" />
                          </td>
                          <td className="px-3 py-2">
                            <input type="text" inputMode="numeric" value={vform.giaNhap ? Number(vform.giaNhap).toLocaleString('vi-VN') : ''} onChange={(e) => setVform(p => ({ ...p, giaNhap: e.target.value.replace(/[^0-9]/g, '') }))}
                              placeholder="Giá nhập" className="w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gold" />
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" min="0" value={vform.tonKho} onChange={(e) => setVform(p => ({ ...p, tonKho: e.target.value }))}
                              className="w-full border rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-2 focus:ring-gold" />
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex justify-center gap-1">
                              <button type="button" onClick={handleSaveVariant} disabled={savingVar}
                                className="p-1.5 text-emerald-deep hover:bg-emerald-deep/10 rounded-lg"><Check className="h-4 w-4" /></button>
                              <button type="button" onClick={() => setConfirmDelete(editIdx)}
                                className="p-1.5 text-bordeaux hover:bg-bordeaux/10 rounded-lg" title="Ẩn biến thể"><EyeOff className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </tr>
                      )}
                      {colorGroupEntries.map(([colorId, colorVariants]) => {
                        const colorObj = colors.find(c => c.maMauSac === Number(colorId))
                        const sharedImage = colorVariants[0]?.urlAnh || ''
                        return (
                          <Fragment key={colorId}>
                            {colorVariants.map((v, vi) => {
                              const idx = variants.indexOf(v)
                              return (
                                <tr key={v.maBienThe || v._tempId || `${colorId}_${vi}`} className={vi === 0 ? 'border-t-2 border-stone/20' : ''}>
                                  {vi === 0 && (
                                    <td className="px-3 py-2 align-middle" rowSpan={colorVariants.length}>
                                      <div className="flex flex-col items-start gap-2">
                                        <div className="flex items-center gap-1.5">
                                          {getColorHex(colorId) && <span className="w-4 h-4 rounded-full border shrink-0" style={{ backgroundColor: getColorHex(colorId) }} />}
                                          <span className="font-medium text-sm">{colorObj?.mauSac || getColorName(colorId)}</span>
                                        </div>
                                        <button type="button" onClick={() => document.getElementById(`colorImgInput_${colorId}`).click()}
                                          className="flex items-center gap-1 px-2.5 py-1 text-xs border border-stone/20 rounded-lg hover:bg-ivory-100 transition">
                                          {uploadingColorId === Number(colorId) ? <Loader className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                                          Upload ảnh
                                        </button>
                                        <input id={`colorImgInput_${colorId}`} type="file" accept="image/*" hidden
                                          onChange={(e) => { handleUploadColorImage(colorId, e.target.files); e.target.value = '' }} />
                                        {sharedImage ? (
                                          <SafeImg src={sharedImage} className="w-14 h-14 rounded-lg object-cover bg-ivory-100 border shrink-0"
                                            fallback="https://placehold.co/56x56/e2e8f0/475569?text=?" />
                                        ) : <span className="text-xs text-stone">—</span>}
                                      </div>
                                    </td>
                                  )}
                                  <td className="px-3 py-2 text-center font-medium">{v.kichCo?.kichCo || getSizeName(v.maKichCo)}</td>
                                  <td className="px-3 py-2">
                                    <input type="text" inputMode="numeric" value={v.gia ? Number(v.gia).toLocaleString('vi-VN') : ''}
                                      onChange={e => handleVariantFieldChange(idx, 'gia', e.target.value.replace(/[^0-9]/g, ''))}
                                      className="w-full border border-stone/20 rounded-lg px-2 py-1.5 text-xs text-center font-semibold focus:outline-none focus:ring-2 focus:ring-gold" />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input type="text" inputMode="numeric" value={v.giaNhap ? Number(v.giaNhap).toLocaleString('vi-VN') : ''}
                                      onChange={e => handleVariantFieldChange(idx, 'giaNhap', e.target.value.replace(/[^0-9]/g, ''))}
                                      placeholder="0"
                                      className="w-full border border-stone/20 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-2 focus:ring-gold" />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input type="number" min="0" value={v.tonKho}
                                      onChange={e => handleVariantFieldChange(idx, 'tonKho', e.target.value)}
                                      className="w-full border border-stone/20 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-2 focus:ring-gold" />
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <button type="button" onClick={() => setConfirmDelete(idx)}
                                      className="p-1.5 text-bordeaux hover:bg-bordeaux/10 rounded-lg" title="Ẩn biến thể"><EyeOff className="h-3.5 w-3.5" /></button>
                                  </td>
                                </tr>
                              )
                            })}
                          </Fragment>
                        )
                      })}
                    </tbody>
                  )
                })()}
              </table>
            </div>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-stone/15 bg-ivory-100/70 p-4">
          <div className="flex items-center justify-between gap-3 mb-3"><div><h3 className="font-semibold text-sm">Kiểm tra trước khi xuất bản</h3><p className="text-xs text-stone mt-0.5">Hoàn thành các mục cần thiết để sản phẩm hiển thị với khách hàng.</p></div><span className={`text-xs font-bold px-2.5 py-1 rounded-full ${canSubmitProduct ? 'bg-emerald-deep/10 text-emerald-deep' : 'bg-gold/15 text-noir'}`}>{publishChecklist.filter(item => item.done).length}/{publishChecklist.length}</span></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{publishChecklist.map(item => <div key={item.label} className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium ${item.done ? 'bg-emerald-deep/10 text-emerald-deep' : 'bg-white text-stone border border-stone/10'}`}>{item.done ? <Check className="h-3.5 w-3.5 shrink-0" /> : <X className="h-3.5 w-3.5 shrink-0" />}{item.label}</div>)}</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[0.42fr_1fr] gap-3">
          <button type="button" onClick={handleSaveDraft} disabled={saving}
            className="border border-stone/25 bg-white text-noir py-2.5 rounded-lg text-sm font-semibold hover:bg-ivory-100 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader className="h-4 w-4 animate-spin" /> : null} Lưu nháp
          </button>
          <button type="submit" disabled={saving || !canSubmitProduct}
            className="bg-gold text-noir py-2.5 rounded-lg text-sm font-semibold hover:bg-gold-hover disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader className="h-4 w-4 animate-spin" /> : null}
            {isEdit ? 'Cập nhật & xuất bản' : 'Tạo & xuất bản'}
          </button>
        </div>
      </form>

      {/* ═══ MODALS ═══ */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCatModal(false)}>
          <div className="bg-ivory rounded-2xl max-w-sm w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2">Thêm danh mục mới</h3>
            <input value={quickAddName} onChange={e => setQuickAddName(e.target.value)}
              placeholder="Nhập tên danh mục" autoFocus
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-gold"
              onKeyDown={e => e.key === 'Enter' && handleQuickAddCategory()} />
            <div className="flex gap-3">
              <button onClick={() => setShowCatModal(false)} className="flex-1 py-2.5 border rounded-xl text-sm font-medium hover:bg-ivory-100">Hủy</button>
              <button onClick={handleQuickAddCategory} className="flex-1 py-2.5 bg-gold text-noir rounded-xl text-sm font-medium hover:bg-gold-hover">Thêm</button>
            </div>
          </div>
        </div>
      )}

      {showBrandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowBrandModal(false)}>
          <div className="bg-ivory rounded-2xl max-w-sm w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2">Thêm thương hiệu mới</h3>
            <input value={quickAddName} onChange={e => setQuickAddName(e.target.value)}
              placeholder="Nhập tên thương hiệu" autoFocus
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-gold"
              onKeyDown={e => e.key === 'Enter' && handleQuickAddBrand()} />
            <div className="flex gap-3">
              <button onClick={() => setShowBrandModal(false)} className="flex-1 py-2.5 border rounded-xl text-sm font-medium hover:bg-ivory-100">Hủy</button>
              <button onClick={handleQuickAddBrand} className="flex-1 py-2.5 bg-gold text-noir rounded-xl text-sm font-medium hover:bg-gold-hover">Thêm</button>
            </div>
          </div>
        </div>
      )}

      {showThuocTinhModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowThuocTinhModal(false)}>
          <div className="bg-ivory rounded-2xl max-w-sm w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2">Thêm {thuocTinhType === 'XUAT_XU' ? 'xuất xứ' : (LOAI_THUOC_TINH.find(l => l.key === thuocTinhType)?.label || 'thuộc tính')}</h3>
            <input value={quickThuocTinhName} onChange={e => setQuickThuocTinhName(e.target.value)}
              placeholder="Nhập tên..." autoFocus
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-gold"
              onKeyDown={e => e.key === 'Enter' && handleQuickAddThuocTinh()} />
            <div className="flex gap-3">
              <button onClick={() => setShowThuocTinhModal(false)} className="flex-1 py-2.5 border rounded-xl text-sm font-medium hover:bg-ivory-100">Hủy</button>
              <button onClick={handleQuickAddThuocTinh} className="flex-1 py-2.5 bg-gold text-noir rounded-xl text-sm font-medium hover:bg-gold-hover">Thêm</button>
            </div>
          </div>
        </div>
      )}

      {showColorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowColorModal(false)}>
          <div className="bg-ivory rounded-2xl max-w-xl w-full mx-4 p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
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
                      {levels.map(lvl => <div key={lvl} className="w-7 shrink-0 text-center text-[10px] font-semibold text-stone tracking-wide">{lvl}</div>)}
                    </div>
                    {families.map((f, fi) => (
                      <div key={fi} className="flex gap-1 mb-1 items-center">
                        <div className="w-12 shrink-0 text-[11px] font-medium text-stone text-right pr-1 truncate">{f.name}</div>
                        {f.shades.map((hex, si) => (
                          <button key={hex} type="button"
                            onClick={() => { setQuickColorHex(hex); setQuickColorName(f.name) }}
                            className={`w-7 h-7 rounded-full border transition-all duration-150 ${quickColorHex === hex ? 'border-gold ring-2 ring-blue-300 ring-offset-1 scale-110 z-10 shadow-sm' : (lightHexes.has(hex) ? 'border-stone/30 hover:border-stone/50' : 'border-stone/20 hover:border-stone/40')}`}
                            style={{ backgroundColor: hex }}
                            title={`${f.name} ${levels[si]} (${hex})`} />
                        ))}
                      </div>
                    ))}
                  </>)
                })()}
                <div className="flex gap-1 mt-3 pt-2.5 border-t border-stone/20">
                  {[
                    { hex: '#FFFFFF', name: 'Trắng' }, { hex: '#000000', name: 'Đen' },
                    { hex: '#2F3640', name: 'Than' }, { hex: '#607D8B', name: 'Rêu' },
                    { hex: '#9E9E9E', name: 'Ghi' }, { hex: '#D4A574', name: 'Be' },
                    { hex: '#795548', name: 'Nâu' }, { hex: '#FF5722', name: 'Cam đỏ' },
                    { hex: '#00BCD4', name: 'Ngọc' }, { hex: '#CDDC39', name: 'Chanh' },
                  ].map(c => (
                    <button key={c.hex} type="button"
                      onClick={() => { setQuickColorHex(c.hex); setQuickColorName(c.name) }}
                      className={`w-7 h-7 rounded-full border transition-all duration-150 ${quickColorHex === c.hex ? 'border-gold ring-2 ring-blue-300 ring-offset-1 scale-110 z-10 shadow-sm' : (c.hex === '#FFFFFF' ? 'border-stone/30 hover:border-stone/50' : 'border-stone/20 hover:border-stone/40')}`}
                      style={{ backgroundColor: c.hex }}
                      title={`${c.name} (${c.hex})`} />
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-center gap-3 shrink-0 w-32 pt-2">
                <div className="w-14 h-14 rounded-full border-2 border-stone/20 shadow-md" style={{ backgroundColor: quickColorHex }} />
                <span className="text-[11px] font-mono text-stone bg-ivory-100 px-2 py-0.5 rounded-md border border-stone/20">{quickColorHex}</span>
                <input value={quickColorName} onChange={e => setQuickColorName(e.target.value)}
                  placeholder="Nhập tên màu" autoFocus
                  className="w-full border rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-gold" />
                <div className="flex gap-2 w-full mt-1">
                  <button onClick={() => setShowColorModal(false)} className="flex-1 py-2 border rounded-xl text-sm font-medium hover:bg-ivory-100">Hủy</button>
                  <button onClick={handleQuickAddColor} className="flex-1 py-2 bg-gold text-noir rounded-xl text-sm font-semibold hover:bg-gold-hover">Thêm</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowSizeModal(false)}>
          <div className="bg-ivory rounded-2xl max-w-sm w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2">Thêm kích cỡ mới</h3>
            <input value={quickSizeName} onChange={e => setQuickSizeName(e.target.value)}
              placeholder="Nhập tên kích cỡ (VD: M, L, XL)" autoFocus
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-gold"
              onKeyDown={e => e.key === 'Enter' && handleQuickAddSize()} />
            <div className="flex gap-3">
              <button onClick={() => setShowSizeModal(false)} className="flex-1 py-2.5 border rounded-xl text-sm font-medium hover:bg-ivory-100">Hủy</button>
              <button onClick={handleQuickAddSize} className="flex-1 py-2.5 bg-gold text-noir rounded-xl text-sm font-medium hover:bg-gold-hover">Thêm</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Ẩn biến thể"
        message="Bạn chắc chắn muốn ẩn biến thể này?"
        confirmText="Ẩn"
        onConfirm={() => handleDeleteVariant(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />

      <ConfirmDialog
        open={confirmDeleteColor !== null}
        title="Xóa màu"
        message={<>Xóa tất cả biến thể màu <strong>{confirmDeleteColor?.mauSac}</strong>?</>}
        confirmText="Xóa" onConfirm={() => handleDeleteVariantsByColor(confirmDeleteColor.maMauSac)} onCancel={() => setConfirmDeleteColor(null)} />
      <ConfirmDialog open={confirmSaveProduct}
        title={isEdit ? 'Cập nhật sản phẩm' : 'Tạo sản phẩm'}
        message={`Bạn chắc chắn muốn ${isEdit ? 'cập nhật' : 'tạo'} sản phẩm "${product.tenSanPham}"?`}
        confirmText={isEdit ? 'Cập nhật' : 'Tạo'} variant="gold" loading={saving}
        onConfirm={handleSaveProduct} onCancel={() => setConfirmSaveProduct(false)} />
      {/* ═══ BULK APPLY MODAL ═══ */}
      {showBulkApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowBulkApply(false)}>
          <div className="bg-ivory rounded-2xl max-w-md w-full mx-4 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-1">Thêm nhanh (Bulk Apply)</h3>
            <p className="text-xs text-stone mb-4">Áp dụng giá trị mặc định cho tất cả biến thể</p>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-stone font-medium">Giá bán mặc định (VNĐ)</label>
                <input type="text" inputMode="numeric"
                  value={bulkForm.giaBan ? Number(bulkForm.giaBan).toLocaleString('vi-VN') : ''}
                  onChange={e => setBulkForm(p => ({ ...p, giaBan: e.target.value.replace(/[^0-9]/g, '') }))}
                  placeholder="0"
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-gold" />
              </div>
              <div>
                <label className="text-sm text-stone font-medium">Giá nhập mặc định (VNĐ)</label>
                <input type="text" inputMode="numeric"
                  value={bulkForm.giaNhap ? Number(bulkForm.giaNhap).toLocaleString('vi-VN') : ''}
                  onChange={e => setBulkForm(p => ({ ...p, giaNhap: e.target.value.replace(/[^0-9]/g, '') }))}
                  placeholder="0"
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-gold" />
              </div>
              <div>
                <label className="text-sm text-stone font-medium">Số lượng tồn kho mặc định</label>
                <input type="number" min="0"
                  value={bulkForm.tonKho}
                  onChange={e => setBulkForm(p => ({ ...p, tonKho: e.target.value }))}
                  placeholder="0"
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-gold" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={bulkForm.onlyEmpty}
                  onChange={e => setBulkForm(p => ({ ...p, onlyEmpty: e.target.checked }))}
                  className="w-4 h-4 rounded border-stone/30 text-gold focus:ring-gold" />
                <span className="text-sm text-stone">Chỉ áp dụng cho các ô trống (giá trị bằng 0)</span>
              </label>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowBulkApply(false)}
                className="flex-1 py-2.5 border rounded-xl text-sm font-medium hover:bg-ivory-100 transition">Đóng</button>
              <button onClick={handleBulkApply}
                className="flex-1 py-2.5 bg-[var(--primary-color)] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition">Áp dụng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
