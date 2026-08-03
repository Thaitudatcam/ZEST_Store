import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { getActiveCategories } from '../../api/categories'
import { createCustomer, getInvoiceByOrderId, generateInvoice, lookupSku } from '../../api/admin'
import { getCustomerDiem, getDiemQuyTac } from '../../api/vi'
import { getAvailableCoupons } from '../../api/coupons'
import { VND } from '../../components/ProductCard'
import { Search, Plus, Minus, Trash2, ShoppingCart, X, User, ChevronDown, UserPlus, ScanBarcode, QrCode, Coins, RefreshCw, History } from 'lucide-react'
import SafeImg from '../../components/SafeImg'
import CameraScanner from '../../components/CameraScanner'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function AdminPOS() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState([])
  const [placing, setPlacing] = useState(false)
  const [msg, setMsg] = useState(null)
  const [variantModal, setVariantModal] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [vQty, setVQty] = useState(1)
  const [sizes, setSizes] = useState([])
  const [colors, setColors] = useState([])
  const [categories, setCategories] = useState([])
  const [dungDiem, setDungDiem] = useState(false)
  const [customerDiem, setCustomerDiem] = useState({ soDiem: 0, tongTichLuy: 0, tongSuDung: 0 })
  const [categoryId, setCategoryId] = useState('')
  const [diemQuyTac, setDiemQuyTac] = useState(null)

  useEffect(() => {
    getActiveCategories().then(r => {
      setCategories(Array.isArray(r) ? r : [])
    }).catch(() => {})
    getDiemQuyTac().then(setDiemQuyTac).catch(() => {})
  }, [])

  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState([])
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [searchingCustomer, setSearchingCustomer] = useState(false)
  const customerRef = useRef(null)
  const justSelectedRef = useRef(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [quickForm, setQuickForm] = useState({ hoTen: '', soDienThoai: '', email: '', matKhau: '' })
  const [quickSaving, setQuickSaving] = useState(false)
  const [confirmQuickAdd, setConfirmQuickAdd] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [couponMsg, setCouponMsg] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [availableCoupons, setAvailableCoupons] = useState([])
  const [showCouponDropdown, setShowCouponDropdown] = useState(false)
  const [couponDropdownLoading, setCouponDropdownLoading] = useState(false)

  const [payResult, setPayResult] = useState(null)
  const [printInvoice, setPrintInvoice] = useState(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState(5)
  const [bankInfo, setBankInfo] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)

  const getQtyInCart = (maBienThe) => cart.filter(c => c.maBienThe === maBienThe).reduce((s, c) => s + c.soLuong, 0)

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (justSelectedRef.current) { justSelectedRef.current = false; return }
      if (!customerSearch.trim()) {
        setCustomerResults([])
        return
      }
      setSearchingCustomer(true)
      try {
        const res = await api.get('/admin/customers/search', { params: { q: customerSearch.trim() } }).then(r => r.data)
        setCustomerResults(res)
        setShowCustomerDropdown(true)
      } catch { /* ignore */ }
      setSearchingCustomer(false)
    }, 300)
    return () => clearTimeout(handler)
  }, [customerSearch])

  useEffect(() => {
    const handleClick = (e) => {
      if (customerRef.current && !customerRef.current.contains(e.target)) {
        setShowCustomerDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const total = cart.reduce((s, c) => s + c.gia * c.soLuong, 0)

  const tiLeDoi = diemQuyTac?.tiLeDoi ?? 1000
  const giamToiDaPhanTram = diemQuyTac?.giamToiDaPhanTram ?? 50
  const diemToiThieu = diemQuyTac?.diemToiThieu ?? 10
  const giaTriHangSauCoupon = Math.max(0, total - (coupon?.soTienGiam || 0))
  const maxDiemTheoQuyTac = Math.floor(giaTriHangSauCoupon * giamToiDaPhanTram / 100 / tiLeDoi)
  const maxDiemSuDung = Math.max(0, Math.min(customerDiem.soDiem, maxDiemTheoQuyTac))
  const diemDungDuoc = customerDiem.soDiem > 0 && maxDiemSuDung >= diemToiThieu
  const soDiemSuDung = dungDiem && diemDungDuoc ? maxDiemSuDung : 0

  const fetchAvailableCoupons = useCallback(async (maNguoiDung) => {
    setCouponDropdownLoading(true)
    try {
      const res = await getAvailableCoupons(total, [], maNguoiDung || null)
      setAvailableCoupons((res || []).filter(v => v.kieuGiamGia !== 3))
    } catch { setAvailableCoupons([]) }
    setCouponDropdownLoading(false)
  }, [total])

  const selectCustomer = (c) => {
    setSelectedCustomer(c)
    justSelectedRef.current = true
    setCustomerSearch(c.hoTen + (c.soDienThoai ? ` (${c.soDienThoai})` : ''))
    setShowCustomerDropdown(false)
    setDungDiem(false)
    setCoupon(null); setCouponCode(''); setCouponMsg('')
    getCustomerDiem(c.maNguoiDung).then(setCustomerDiem).catch(() => setCustomerDiem({ soDiem: 0, tongTichLuy: 0, tongSuDung: 0 }))
    fetchAvailableCoupons(c.maNguoiDung)
  }

  const clearCustomer = () => {
    setSelectedCustomer(null)
    setCustomerSearch('')
    setCustomerResults([])
    setCustomerDiem({ soDiem: 0, tongTichLuy: 0, tongSuDung: 0 })
    setDungDiem(false)
    setCoupon(null); setCouponCode(''); setCouponMsg('')
    setAvailableCoupons([])
  }

  useEffect(() => {
    const myReq = ++reqCounter.current
    setLoading(true)
    const params = { size: 100 }
    if (categoryId) params.categoryId = categoryId
    api.get('/products', { params })
      .then(r => { if (reqCounter.current === myReq) setProducts(r.data.content || []) })
      .catch(() => { if (reqCounter.current === myReq) setMsg({ type: 'error', text: 'Không thể tải sản phẩm' }) })
      .finally(() => { if (reqCounter.current === myReq) setLoading(false) })
  }, [categoryId])

  useEffect(() => {
    if (!selectedCustomer) return
    const timer = setTimeout(() => fetchAvailableCoupons(selectedCustomer.maNguoiDung), 500)
    return () => clearTimeout(timer)
  }, [total])

  useEffect(() => {
    if (cart.length === 0) {
      setCoupon(null); setCouponCode(''); setCouponMsg('')
      setAvailableCoupons([]); setShowCouponDropdown(false)
    }
  }, [cart.length])

  const searchRef = useRef(null)
  const reqCounter = useRef(0)
  const doSearch = (val) => {
    setSearch(val)
    if (searchRef.current) clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => {
      const myReq = ++reqCounter.current
      setLoading(true)
      const params = { size: 100 }
      if (val.trim()) params.keyword = val.trim()
      else if (categoryId) params.categoryId = categoryId
      api.get('/products', { params })
        .then(r => { if (reqCounter.current === myReq) setProducts(r.data.content || []) })
        .catch(() => {})
        .finally(() => { if (reqCounter.current === myReq) setLoading(false) })
    }, 300)
  }

  const openVariant = async (product) => {
    try {
      const detail = await api.get(`/products/${product.slug || product.maSanPham}`).then(r => r.data)
      const vars = detail.variants || []
      const uniqueSizes = [...new Set(vars.map(v => v.kichCo?.kichCo).filter(Boolean))]
      const uniqueColors = [...new Set(vars.map(v => v.mauSac?.mauSac).filter(Boolean))]
      const firstAvail = vars.find(v => (v.tonKho || 0) > 0) || vars[0]
      setVariantModal(detail)
      setSizes(uniqueSizes)
      setColors(uniqueColors)
      setSelectedSize(firstAvail?.kichCo?.kichCo || uniqueSizes[0] || null)
      setSelectedColor(firstAvail?.mauSac?.mauSac || uniqueColors[0] || null)
      setVQty(1)
    } catch {
      setMsg({ type: 'error', text: 'Không thể tải thông tin sản phẩm' })
    }
  }

  const handleScannedSku = async (rawSku) => {
    const sku = rawSku.trim().toUpperCase()
    try {
      const variant = await lookupSku(sku)
      const qtyInCart = getQtyInCart(variant.maBienThe)
      if (qtyInCart >= variant.tonKho) { setMsg({ type: 'error', text: 'Sản phẩm đã hết hàng' }); return }
      setCart(prev => {
        const existing = prev.findIndex(c => c.maBienThe === variant.maBienThe)
        if (existing >= 0) {
          const next = [...prev]
          next[existing] = { ...next[existing], soLuong: next[existing].soLuong + 1 }
          return next
        }
        return [...prev, {
          maBienThe: variant.maBienThe,
          tenSanPham: variant.tenSanPham,
          kichCo: variant.kichCo || '',
          mauSac: variant.mauSac || '',
          gia: variant.gia,
          soLuong: 1,
          tonKho: variant.tonKho,
          urlAnh: variant.urlAnh || '',
        }]
      })
      setMsg({ type: 'success', text: `Đã thêm ${variant.tenSanPham}` })
    } catch {
      doSearch(sku)
    }
  }

  const addToCart = () => {
    const detail = variantModal
    const variant = detail.variants?.find(v => v.kichCo?.kichCo === selectedSize && v.mauSac?.mauSac === selectedColor)
    if (!variant) return
    const qtyInCart = getQtyInCart(variant.maBienThe)
    const availStock = (variant.tonKho || 0) - qtyInCart
    if (availStock <= 0) {
      setMsg({ type: 'error', text: 'Sản phẩm đã hết hàng' })
      return
    }
    if (vQty > availStock) {
      setMsg({ type: 'error', text: `Chỉ còn ${availStock} sản phẩm trong kho` })
      return
    }
    setCart(prev => {
      const existing = prev.findIndex(c => c.maBienThe === variant.maBienThe)
      if (existing >= 0) {
        const next = [...prev]
        next[existing] = { ...next[existing], soLuong: next[existing].soLuong + vQty }
        return next
      }
      return [...prev, {
        maBienThe: variant.maBienThe,
        tenSanPham: detail.product?.tenSanPham || 'SP',
        kichCo: variant.kichCo?.kichCo || '',
        mauSac: variant.mauSac?.mauSac || '',
        gia: variant.gia || 0,
        soLuong: vQty,
        tonKho: variant.tonKho || 0,
        urlAnh: variant.urlAnh || detail.product?.urlAnhDaiDien || '',
      }]
    })
    setVariantModal(null)
  }

  const updateQty = (idx, delta) => {
    setCart(prev => prev.map((c, i) => {
      if (i !== idx) return c
      const newQty = Math.max(1, c.soLuong + delta)
      const availStock = c.tonKho - (getQtyInCart(c.maBienThe) - c.soLuong)
      if (delta > 0 && newQty > availStock) {
        setMsg({ type: 'error', text: `Chỉ còn ${availStock} sản phẩm trong kho` })
        return c
      }
      return { ...c, soLuong: newQty }
    }))
  }

  const removeItem = (idx) => {
    setConfirmAction(null)
    setCart(prev => prev.filter((_, i) => i !== idx))
  }

  const applyCouponCode = async (code) => {
    if (!code?.trim()) return
    setCoupon(null)
    setCouponMsg('')
    try {
      setCouponLoading(true)
      const res = await api.post('/admin/pos/validate-coupon', {
        maCode: code.trim(),
        tongTien: total,
        maNguoiDung: selectedCustomer?.maNguoiDung || undefined,
      }).then(r => r.data)
      if (res.hopLe) {
        setCoupon(res)
      } else {
        setCouponMsg(res.lyDoTuChoi || 'Mã giảm giá không hợp lệ')
      }
    } catch (err) {
      setCouponMsg(err.response?.data?.message || 'Mã giảm giá không hợp lệ')
    } finally {
      setCouponLoading(false)
    }
  }

  const handleApplyCoupon = () => applyCouponCode(couponCode)

  const handleQuickAdd = async () => {
    setConfirmQuickAdd(false)
    if (!quickForm.hoTen.trim()) {
      setMsg({ type: 'error', text: 'Vui lòng nhập họ tên khách hàng' })
      return
    }
    setQuickSaving(true)
    try {
      const res = await createCustomer({
        hoTen: quickForm.hoTen.trim(),
        soDienThoai: quickForm.soDienThoai.trim() || undefined,
        email: quickForm.email.trim() || undefined,
        matKhau: quickForm.matKhau.trim() || undefined,
        nguonTao: 'POS_QUICK',
      })
      selectCustomer(res)
      setQuickAddOpen(false)
      setQuickForm({ hoTen: '', soDienThoai: '', email: '' })
      setMsg({ type: 'success', text: 'Thêm khách hàng thành công' })
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Thêm khách hàng thất bại' })
    } finally {
      setQuickSaving(false)
    }
  }

  const handlePlace = async () => {
    setConfirmAction(null)
    if (cart.length === 0) return
    if (soDiemSuDung > 0 && soDiemSuDung < diemToiThieu) { setMsg({ type: 'error', text: `Tối thiểu ${diemToiThieu} điểm để sử dụng` }); return }
    setPlacing(true)
    try {
      if (paymentMethod === 6) {
        const totalAmount = Math.max(0, total - (coupon?.soTienGiam || 0))
        const vqRes = await api.post('/admin/pos/vietqr/preview', { amount: totalAmount }).then(r => r.data)
        setQrDataUrl(vqRes.qrUrl)
        setBankInfo(vqRes)
        setPayResult({ thanhToan: totalAmount })
      } else {
        const res = await api.post('/admin/pos/orders', {
          items: cart.map(c => ({ maBienThe: c.maBienThe, soLuong: c.soLuong })),
          maNguoiDung: selectedCustomer?.maNguoiDung || undefined,
          maCode: coupon?.maCode || undefined,
          phuongThucThanhToan: 5,
          soDiemSuDung: soDiemSuDung > 0 ? soDiemSuDung : undefined,
        }).then(r => r.data)
        if (!res || !res.maDonHang) throw new Error('Phản hồi không hợp lệ')
        setCart([])
        setSelectedCustomer(null)
        setCoupon(null)
        setCouponCode('')
        setPayResult(res)
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || err.message || 'Tạo đơn thất bại' })
    } finally {
      setPlacing(false)
    }
  }

  const handleConfirmReceived = async () => {
    if (cart.length === 0) return
    setPlacing(true)
    try {
      const res = await api.post('/admin/pos/orders', {
        items: cart.map(c => ({ maBienThe: c.maBienThe, soLuong: c.soLuong })),
        maNguoiDung: selectedCustomer?.maNguoiDung || undefined,
        maCode: coupon?.maCode || undefined,
        phuongThucThanhToan: 6,
        soDiemSuDung: soDiemSuDung > 0 ? soDiemSuDung : undefined,
      }).then(r => r.data)
      if (!res || !res.maDonHang) throw new Error('Phản hồi không hợp lệ')
      setCart([])
      setSelectedCustomer(null)
      setCoupon(null)
      setCouponCode('')
      setBankInfo(null)
      setQrDataUrl(null)
      setPayResult(res)
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || err.message || 'Xác nhận thất bại' })
    } finally {
      setPlacing(false)
    }
  }

  const closeResult = () => {
    setPayResult(null)
    setBankInfo(null)
    setQrDataUrl(null)
  }

  const goToOrders = useCallback(() => {
    setPayResult(null)
    setPrintInvoice(null)
    navigate('/admin/orders/pos', { replace: true })
  }, [navigate])

  const handlePrintInvoice = async () => {
    if (!payResult?.maDonHang) return
    setPrintInvoice('loading')
    try {
      await generateInvoice(payResult.maDonHang)
    } catch {}
    try {
      const data = await getInvoiceByOrderId(payResult.maDonHang)
      setPrintInvoice(data)
    } catch {
      setMsg({ type: 'error', text: 'Không thể tải hóa đơn' })
      setPrintInvoice(null)
    }
  }

  useEffect(() => {
    if (!printInvoice || printInvoice === 'loading') return
    const timer = setTimeout(() => window.print(), 300)
    const afterPrint = () => goToOrders()
    window.addEventListener('afterprint', afterPrint)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('afterprint', afterPrint)
    }
  }, [printInvoice, goToOrders])

  return (
    <div className="flex gap-4 h-[calc(100vh-6rem)]">
      {msg && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 ${msg.type === 'success' ? 'bg-emerald-deep/10 border border-emerald-deep/20 text-emerald-deep' : 'bg-bordeaux/10 border border-bordeaux/20 text-bordeaux'}`}>
          <span className="text-sm">{msg.text}</span>
          <button onClick={() => setMsg(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="flex-1 flex flex-col bg-ivory rounded-xl border">
        <div className="p-4 border-b space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone" />
            <input value={search} onChange={e => doSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && search.trim()) { handleScannedSku(search); setSearch('') } }}
              placeholder="Tìm sản phẩm hoặc nhập mã SKU..."
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
          </div>
          <button onClick={() => setCameraOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gold text-gold rounded-lg text-sm font-medium hover:bg-gold/10 transition">
            <ScanBarcode className="h-5 w-5" /> Quét mã bằng camera
          </button>
          <div className="flex gap-2">
            <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setSearch('') }}
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold">
              <option value="">Tất cả danh mục</option>
              {categories.map(c => (
                <option key={c.maDanhMuc} value={c.maDanhMuc}>
                  {categories.some(p => Number(p.maDanhMuc) === Number(c.maDanhMucCha)) ? '—' : ''}{c.tenDanhMuc}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-12 text-stone">Đang tải...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-stone">Không tìm thấy sản phẩm</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map(p => {
                const isOutOfStock = (p.tongTonKho ?? 0) === 0
                const price = p.giaThapNhat ?? p.giaTrungBinh ?? 0
                return (
                  <button key={p.maSanPham} onClick={() => openVariant(p)}
                    className="group bg-ivory rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative text-left">
                    <div className="aspect-square bg-ivory-100 overflow-hidden relative">
                      <SafeImg src={p.urlAnhDaiDien} alt={p.tenSanPham}
                        className={`w-full h-full object-cover object-center group-hover:scale-105 transition duration-500 ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}
                        fallback="https://placehold.co/200x200/e2e8f0/475569?text=Polo" />
                      {isOutOfStock &&
                        <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white font-bold text-sm z-10">Hết hàng</span>}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm text-ink truncate">{p.tenSanPham}</h3>
                      <p className="text-gold font-bold text-sm mt-1.5">{VND(price)}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="w-80 bg-ivory rounded-xl border flex flex-col">
        <div className="p-4 border-b flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-gold" />
          <span className="font-semibold">Giỏ hàng</span>
          <span className="ml-auto text-sm text-stone">{cart.length} món</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-8 text-stone text-sm">Chưa có sản phẩm</div>
          ) : (
            cart.map((c, i) => (
              <div key={i} className="flex items-start gap-3 bg-ivory-100 rounded-lg p-2.5">
                  <div className="w-10 h-10 bg-ivory-100 rounded overflow-hidden shrink-0">
                    <SafeImg src={c.urlAnh} alt="" className="w-full h-full object-cover"
                      fallback="https://placehold.co/100x100/e2e8f0/475569?text=P" />
                  </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{c.tenSanPham}</p>
                  <p className="text-xs text-stone">{[c.mauSac, c.kichCo].filter(Boolean).join(' - ') || '—'}</p>
                  <p className="text-xs text-gold font-semibold">{VND(c.gia)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(i, -1)}
                    className="w-6 h-6 flex items-center justify-center rounded bg-ivory-100 hover:bg-ivory-100 text-xs">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-medium">{c.soLuong}</span>
                  <button onClick={() => updateQty(i, 1)}
                    className="w-6 h-6 flex items-center justify-center rounded bg-ivory-100 hover:bg-ivory-100 text-xs">
                    <Plus className="h-3 w-3" />
                  </button>
                  <button onClick={() => setConfirmAction(i)}
                    className="w-6 h-6 flex items-center justify-center rounded text-bordeaux hover:text-bordeaux text-xs">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t p-4 space-y-2">
          <div className="relative" ref={customerRef}>
            <div className="flex items-center gap-1 mb-1">
              <User className="h-4 w-4 text-stone" />
              <span className="text-xs font-medium text-stone">Khách hàng</span>
              {selectedCustomer && (
                <button onClick={clearCustomer}
                  className="ml-auto text-xs text-bordeaux hover:text-bordeaux">Bỏ chọn</button>
              )}
            </div>
            <div className="relative flex gap-1">
              <input value={customerSearch} onChange={e => {
                setCustomerSearch(e.target.value)
                if (selectedCustomer) clearCustomer()
              }} onFocus={() => customerResults.length > 0 && setShowCustomerDropdown(true)}
                placeholder="Tìm tên, email hoặc SĐT khách..."
                className="flex-1 border rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
              <button onClick={() => { setQuickAddOpen(true); setQuickForm({ hoTen: '', soDienThoai: '', email: '', matKhau: '' }) }}
                className="shrink-0 w-9 flex items-center justify-center border border-dashed border-gold text-gold rounded-lg hover:bg-gold/10 transition"
                title="Thêm khách hàng nhanh">
                <UserPlus className="h-4 w-4" />
              </button>
              {searchingCustomer ? (
                <div className="absolute right-12 top-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <ChevronDown className="absolute right-12 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
              )}
            </div>
            {showCustomerDropdown && customerResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-ivory border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {customerResults.map(c => (
                  <button key={c.maNguoiDung} onClick={() => selectCustomer(c)}
                    className="w-full text-left px-3 py-2.5 hover:bg-gold/10 border-b last:border-0">
                    <p className="text-sm font-medium">{c.hoTen}</p>
                    <p className="text-xs text-stone">{c.email}{c.soDienThoai ? ` - ${c.soDienThoai}` : ''}</p>
                  </button>
                ))}
              </div>
            )}
            {showCustomerDropdown && customerResults.length === 0 && customerSearch.trim() && !searchingCustomer && (
              <div className="absolute z-50 w-full mt-1 bg-ivory border rounded-lg shadow-lg p-3 text-center text-sm text-stone">
                Không tìm thấy khách hàng
              </div>
            )}
          </div>
          <div className="border-t pt-2 space-y-2">
            <label className="text-xs font-medium text-stone">Mã giảm giá</label>
            <div className="flex gap-2 relative">
              <div className="flex-1 relative">
                <input value={couponCode} onChange={e => setCouponCode(e.target.value)}
                  disabled={cart.length === 0}
                  placeholder={cart.length === 0 ? ' ' : 'Nhập mã...'}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold pr-20 disabled:bg-stone/10 disabled:cursor-not-allowed" />
                {(availableCoupons.length > 0 || couponDropdownLoading) && (
                  <button onClick={() => setShowCouponDropdown(prev => !prev)}
                    disabled={cart.length === 0}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gold hover:text-gold-hover font-medium disabled:opacity-40">
                    Gợi ý {!couponDropdownLoading && `(${availableCoupons.length})`}
                  </button>
                )}
              </div>
              <button onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim() || cart.length === 0}
                className="px-3 py-2 bg-gold text-noir text-sm font-medium rounded-lg hover:bg-gold-hover transition disabled:opacity-50">
                {couponLoading ? '...' : 'Áp dụng'}
              </button>
            </div>
            {showCouponDropdown && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 animate-fade-in"
                onClick={() => setShowCouponDropdown(false)}>
                <div className="bg-ivory rounded-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-bold text-lg">Chọn mã giảm giá</h3>
                    <button onClick={() => setShowCouponDropdown(false)} className="text-stone hover:text-stone">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {couponDropdownLoading ? (
                      <div className="p-6 text-center text-sm text-stone">
                        <div className="h-4 w-4 border-2 border-gold border-t-transparent rounded-full animate-spin inline-block mr-2" />
                        Đang tải...
                      </div>
                    ) : availableCoupons.length === 0 ? (
                      <div className="p-6 text-center text-sm text-stone">Không có mã giảm giá khả dụng</div>
                    ) : (
                      availableCoupons.map((v, i) => (
                        <button key={i} onClick={() => { setCouponCode(v.maCode); setShowCouponDropdown(false); applyCouponCode(v.maCode) }}
                          className="w-full text-left px-4 py-3 hover:bg-gold/10 border-b last:border-0 flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium">{v.maCode}</span>
                            <span className={`ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${v.isPersonal ? 'bg-royal/20 text-royal' : 'bg-gold/20 text-gold'}`}>
                              {v.isPersonal ? 'Ví' : 'Coupon'}
                            </span>
                            <p className="text-xs text-emerald-deep mt-0.5">
                              {v.kieuGiamGia === 1 ? `Giảm ${v.giaTriGiam}%` : `Giảm ${VND(v.giaTriGiam)}`}
                              {v.giaTriDonToiThieu > 0 && ` - Đơn tối thiểu ${VND(v.giaTriDonToiThieu)}`}
                            </p>
                          </div>
                          <div className="text-right text-xs text-stone">
                            {v.ngayKetThuc && <p>HSD: {v.ngayKetThuc.slice(0, 10)}</p>}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
            {couponMsg && <p className="text-xs text-bordeaux">{couponMsg}</p>}
            {coupon && (
              <div className="bg-emerald-deep/10 border border-emerald-deep/20 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-emerald-deep">{coupon.maCode}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${coupon.loaiMa === 'VOUCHER' ? 'bg-royal/20 text-royal' : 'bg-gold/20 text-gold'}`}>
                      {coupon.loaiMa === 'VOUCHER' ? 'Ví' : 'Coupon'}
                    </span>
                  </div>
                  <button onClick={() => { setCoupon(null); setCouponCode(''); setCouponMsg('') }}
                    className="text-emerald-deep hover:text-emerald-deep"><X className="h-3.5 w-3.5" /></button>
                </div>
                <p className="text-xs text-emerald-deep">Giảm {VND(coupon.soTienGiam)}</p>
              </div>
            )}
          </div>
          <div className="border-t pt-2 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-stone flex items-center gap-1">
                  <Coins className="h-3.5 w-3.5 text-gold" /> Điểm tích lũy
                </label>
                <div className="flex items-center gap-1">
                  {selectedCustomer && (
                    <button onClick={() => getCustomerDiem(selectedCustomer.maNguoiDung).then(setCustomerDiem).catch(() => {})}
                      className="p-1 text-stone hover:text-gold hover:bg-gold/10 rounded transition" title="Cập nhật số dư">
                      <RefreshCw className="h-3 w-3" />
                    </button>
                  )}
                  <a href="/tich-diem" target="_blank" rel="noopener noreferrer"
                    className="p-1 text-stone hover:text-gold hover:bg-gold/10 rounded transition" title="Lịch sử giao dịch">
                    <History className="h-3 w-3" />
                  </a>
                </div>
              </div>
              {selectedCustomer && customerDiem.soDiem > 0 ? (
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                    <span className="text-sm text-stone">Số dư: <strong className="text-gold-hover">{customerDiem.soDiem.toLocaleString()} điểm</strong></span>
                    <span className="text-xs text-stone">Giảm tối đa {giamToiDaPhanTram}% giá trị hàng</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm">Dùng điểm tích lũy giảm giá</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={dungDiem}
                      disabled={!diemDungDuoc}
                      onClick={() => setDungDiem(v => !v)}
                      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${dungDiem ? 'bg-gold' : 'bg-ivory-100 border border-stone/30'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${dungDiem ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>
                  {diemDungDuoc ? (
                    dungDiem && (
                      <p className="text-xs text-gold">
                        Sẽ dùng {maxDiemSuDung.toLocaleString()} điểm (giảm {VND(maxDiemSuDung * tiLeDoi)})
                      </p>
                    )
                  ) : (
                    <p className="text-xs text-stone">Cần tối thiểu {diemToiThieu} điểm để sử dụng</p>
                  )}
                </div>
              ) : selectedCustomer ? (
                <p className="text-xs text-stone">Khách chưa có điểm tích lũy</p>
              ) : (
                <p className="text-xs text-stone">Chọn khách hàng để xem điểm tích lũy</p>
              )}
            </div>
          <div className="space-y-1">
            {coupon && (
              <div className="flex justify-between text-sm text-emerald-deep">
                <span>Giảm giá ({coupon.maCode}):</span>
                <span>-{VND(coupon.soTienGiam)}</span>
              </div>
            )}
            {soDiemSuDung > 0 && (
              <div className="flex justify-between text-sm text-gold">
                <span>Giảm điểm:</span>
                <span>-{VND(soDiemSuDung * tiLeDoi)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1 border-t">
              <span className="font-semibold">Phải thanh toán:</span>
              <span className="text-lg font-bold text-gold">{VND(Math.max(0, total - (coupon?.soTienGiam || 0) - soDiemSuDung * tiLeDoi))}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <select value={paymentMethod} onChange={e => setPaymentMethod(Number(e.target.value))}
              className="border rounded-xl px-3 py-3 text-sm bg-ivory focus:outline-none focus:ring-2 focus:ring-gold">
              <option value={5}>💵 Tiền mặt</option>
              <option value={6}>🏦 VietQR</option>
            </select>
            <button onClick={() => setConfirmAction('place')} disabled={cart.length === 0 || placing}
              className="flex-1 bg-gold text-noir font-semibold py-3 rounded-xl hover:bg-gold-hover transition disabled:opacity-50 flex items-center justify-center gap-2">
              {placing ? 'Đang xử lý...' : 'Thanh toán'}
            </button>
          </div>
        </div>
      </div>

      {quickAddOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 animate-fade-in"
          onClick={() => !quickSaving && setQuickAddOpen(false)}>
          <div className="bg-ivory rounded-2xl max-w-sm w-full mx-4 animate-scale-in"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-lg">Thêm khách hàng nhanh</h3>
              <button onClick={() => setQuickAddOpen(false)} className="text-stone hover:text-stone" disabled={quickSaving}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <input value={quickForm.hoTen} onChange={e => setQuickForm(f => ({ ...f, hoTen: e.target.value }))}
                placeholder="Họ tên *"
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
              <input value={quickForm.soDienThoai} onChange={e => setQuickForm(f => ({ ...f, soDienThoai: e.target.value }))}
                placeholder="Số điện thoại"
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
              <input value={quickForm.email} onChange={e => setQuickForm(f => ({ ...f, email: e.target.value }))}
                placeholder="Email (tự động nếu để trống)"
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
              <input value={quickForm.matKhau} onChange={e => setQuickForm(f => ({ ...f, matKhau: e.target.value }))}
                type="text" placeholder="Mật khẩu (mặc định: customer123)"
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
            </div>
            <div className="border-t p-4">
              <button onClick={() => setConfirmQuickAdd(true)} disabled={quickSaving || !quickForm.hoTen.trim()}
                className="w-full bg-gold text-noir font-semibold py-3 rounded-xl hover:bg-gold-hover transition disabled:opacity-50 flex items-center justify-center gap-2">
                {quickSaving ? 'Đang lưu...' : 'Thêm khách hàng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {payResult && !printInvoice && !bankInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 animate-fade-in">
          <div className="bg-ivory rounded-2xl max-w-sm w-full mx-4 animate-scale-in">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-emerald-deep/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-emerald-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="font-bold text-lg">Thanh toán thành công</h3>
              <p className="text-sm text-stone mt-1">Đơn hàng #{payResult.maDonHang}</p>
              <p className="text-lg font-bold text-gold mt-2">{VND(payResult.thanhToan)}</p>
            </div>
            <div className="border-t p-4">
              <p className="text-sm text-center text-stone mb-4">Bạn có muốn in hóa đơn không?</p>
              <div className="flex gap-3">
                <button onClick={closeResult}
                  className="flex-1 px-4 py-2.5 border rounded-xl text-sm font-medium hover:bg-ivory-100 transition">
                  Không
                </button>
                <button onClick={handlePrintInvoice}
                  className="flex-1 px-4 py-2.5 bg-gold text-noir rounded-xl text-sm font-semibold hover:bg-gold-hover transition">
                  Có
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {payResult && !printInvoice && bankInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 animate-fade-in">
          <div className="bg-ivory rounded-2xl max-w-sm w-full mx-4 animate-scale-in">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="h-8 w-8 text-gold" />
              </div>
              <h3 className="font-bold text-lg">Quét mã VietQR</h3>
              {qrDataUrl && <img src={qrDataUrl} alt="VietQR" className="mx-auto my-3 w-64 h-64" />}
              <div className="bg-ivory-100 rounded-xl p-3 text-left space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone">Ngân hàng:</span>
                  <span className="font-medium">{bankInfo.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone">Số tài khoản:</span>
                  <span className="font-medium">{bankInfo.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone">Chủ tài khoản:</span>
                  <span className="font-medium">{bankInfo.accountName}</span>
                </div>
                <div className="flex justify-between border-t pt-1 mt-1">
                  <span className="text-stone">Số tiền:</span>
                  <span className="font-bold text-gold">{VND(payResult.thanhToan)}</span>
                </div>
              </div>
              <p className="text-xs text-stone mt-3">Khách quét mã bằng ứng dụng ngân hàng để thanh toán</p>
            </div>
            <div className="border-t p-4 flex gap-3">
              <button onClick={closeResult}
                className="flex-1 px-4 py-2.5 border rounded-xl text-sm font-medium hover:bg-ivory-100 transition">
                Hủy
              </button>
              <button onClick={handleConfirmReceived}
                className="flex-1 px-4 py-2.5 bg-gold text-noir rounded-xl text-sm font-semibold hover:bg-gold-hover transition flex items-center justify-center gap-1.5">
                Đã nhận được tiền
              </button>
            </div>
          </div>
        </div>
      )}

      {printInvoice === 'loading' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="h-8 w-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {printInvoice && printInvoice !== 'loading' && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-ivory rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-ivory">
              <h2 className="font-bold text-lg">Hóa đơn {printInvoice.maHoaDonCode}</h2>
              <button onClick={goToOrders} className="p-2 text-stone hover:text-stone"><X className="h-5 w-5" /></button>
            </div>
            <div id="invoice-print" className="p-6 space-y-6">
              <div className="text-center border-b pb-4">
                <h3 className="text-2xl font-bold">ZEST STORE</h3>
                <p className="text-sm text-stone">HÓA ĐƠN BÁN HÀNG</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><span className="font-semibold">Mã hóa đơn:</span> {printInvoice.maHoaDonCode}</p>
                  <p><span className="font-semibold">Ngày tạo:</span> {printInvoice.ngayTao ? new Date(printInvoice.ngayTao).toLocaleDateString('vi-VN') : '-'}</p>
                  <p><span className="font-semibold">Email:</span> {printInvoice.emailKhachHang}</p>
                </div>
                {printInvoice.donHang && (
                  <div>
                    <p><span className="font-semibold">Khách hàng:</span> {printInvoice.donHang.khachHang}</p>
                    <p><span className="font-semibold">Người nhận:</span> {printInvoice.donHang.tenNguoiNhan}</p>
                    <p><span className="font-semibold">SĐT:</span> {printInvoice.donHang.sdtNguoiNhan}</p>
                    <p><span className="font-semibold">Địa chỉ:</span> {printInvoice.donHang.diaChiGiaoHang}</p>
                  </div>
                )}
              </div>
              <table className="w-full text-sm border-t">
                <thead>
                  <tr className="border-b bg-ivory-100">
                    <th className="text-left px-3 py-2">Sản phẩm</th>
                    <th className="text-center px-3 py-2">SL</th>
                    <th className="text-right px-3 py-2">Đơn giá</th>
                    <th className="text-right px-3 py-2">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {(printInvoice.chiTiet || []).map((item, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-3 py-2">
                        <p>{item.tenSanPham}</p>
                        {item.thongTinBienThe && <p className="text-xs text-stone">{item.thongTinBienThe}</p>}
                      </td>
                      <td className="text-center px-3 py-2">{item.soLuong}</td>
                      <td className="text-right px-3 py-2">{VND(item.donGia)}</td>
                      <td className="text-right px-3 py-2 font-semibold">{VND(item.thanhTien)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {printInvoice.donHang && (() => {
                const t = printInvoice.donHang.tongTien ?? printInvoice.tongTien ?? 0
                const g = printInvoice.donHang.soTienGiam || 0
                return (
                  <div className="text-right space-y-1 text-sm">
                    <p><span className="text-stone">Tổng:</span> <span className="font-semibold">{VND(Number(t) + Number(g))}</span></p>
                    {Number(g) > 0 && <p><span className="text-emerald-deep">Giảm giá:</span> <span className="font-semibold text-emerald-deep">-{VND(g)}</span></p>}
                    <p className="text-lg font-bold text-gold">Phải thanh toán: {VND(t)}</p>
                  </div>
                )
              })()}
            </div>
            <style>{`
              @media print {
                body * { visibility: hidden; }
                #invoice-print, #invoice-print * { visibility: visible; }
                #invoice-print { position: fixed; top: 0; left: 0; width: 100%; }
              }
            `}</style>
          </div>
        </div>
      )}

      {cameraOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 animate-fade-in" onClick={() => setCameraOpen(false)}>
          <div className="bg-ivory rounded-2xl max-w-lg w-full mx-4 overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-lg">Quét mã vạch</h3>
              <button onClick={() => setCameraOpen(false)} className="text-stone hover:text-stone">
                <X className="h-5 w-5" />
              </button>
            </div>
            <CameraScanner onScan={(sku) => { setCameraOpen(false); handleScannedSku(sku) }} onClose={() => setCameraOpen(false)} />
          </div>
        </div>
      )}
      {variantModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 animate-fade-in"
          onClick={() => setVariantModal(null)}>
          <div className="bg-ivory rounded-2xl max-w-md w-full mx-4 animate-scale-in"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start p-4 border-b gap-4">
              <div className="w-20 h-20 bg-ivory-100 rounded-xl overflow-hidden shrink-0">
                <SafeImg src={variantModal.product?.urlAnhDaiDien} alt="" className="w-full h-full object-cover object-center"
                  fallback="https://placehold.co/200x200/e2e8f0/475569?text=Polo" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold">{variantModal.product?.tenSanPham || 'Sản phẩm'}</h3>
                {(() => {
                  const v = variantModal.variants?.find(va => va.kichCo?.kichCo === selectedSize && va.mauSac?.mauSac === selectedColor)
                  return v ? <p className="text-gold font-bold text-lg">{VND(v.gia)}</p> : null
                })()}
              </div>
              <button onClick={() => setVariantModal(null)} className="text-stone hover:text-stone shrink-0">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {sizes.length > 1 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Kích cỡ</p>
                  <div className="flex gap-2 flex-wrap">
                    {sizes.map(s => {
                      const availVariants = (variantModal.variants || []).filter(v => v.kichCo?.kichCo === s && (v.tonKho || 0) > getQtyInCart(v.maBienThe))
                      return (
                        <button key={s} onClick={() => {
                          const avail = availVariants.length > 0 ? availVariants[0] : (variantModal.variants || []).find(v => v.kichCo?.kichCo === s)
                          setSelectedSize(s); setSelectedColor(avail ? avail.mauSac?.mauSac : (colors[0] || null)); setVQty(1)
                        }}
                          disabled={availVariants.length === 0}
                          className={`px-4 py-2 text-sm border rounded-lg font-medium transition ${selectedSize === s ? 'border-gold bg-gold/10 text-gold' : availVariants.length > 0 ? 'hover:border-stone/40' : 'opacity-30 cursor-not-allowed'}`}>
                          {s}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              {colors.length > 1 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Màu sắc</p>
                  <div className="flex gap-2 flex-wrap">
                    {colors.map(c => {
                      const availVariants = (variantModal.variants || []).filter(v => v.mauSac?.mauSac === c && v.kichCo?.kichCo === selectedSize && (v.tonKho || 0) > getQtyInCart(v.maBienThe))
                      return (
                        <button key={c} onClick={() => { setSelectedColor(c); setVQty(1) }}
                          disabled={availVariants.length === 0}
                          className={`px-4 py-2 text-sm border rounded-lg font-medium transition ${selectedColor === c ? 'border-gold bg-gold/10 text-gold' : availVariants.length > 0 ? 'hover:border-stone/40' : 'opacity-30 cursor-not-allowed'}`}>
                          {c}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">Số lượng:</span>
                <div className="flex border rounded-lg">
                  <button onClick={() => setVQty(Math.max(1, vQty - 1))}
                    className="px-3 py-1.5 hover:bg-ivory-100">-</button>
                  <span className="px-4 py-1.5 border-x min-w-[2.5rem] text-center text-sm">{vQty}</span>
                  <button onClick={() => setVQty(prev => { const v = variantModal.variants?.find(va => va.kichCo?.kichCo === selectedSize && va.mauSac?.mauSac === selectedColor); const max = (v?.tonKho || 0) - getQtyInCart(v?.maBienThe); return prev < max ? prev + 1 : prev })}
                    className="px-3 py-1.5 hover:bg-ivory-100">+</button>
                </div>
                {(() => {
                  const v = variantModal.variants?.find(va => va.kichCo?.kichCo === selectedSize && va.mauSac?.mauSac === selectedColor)
                  if (!v) return null
                  const avail = (v.tonKho || 0) - getQtyInCart(v.maBienThe)
                  return <span className="text-xs text-stone">Kho: {v.tonKho ?? 0} (còn {Math.max(0, avail)})</span>
                })()}
              </div>
            </div>

            <div className="border-t p-4">
              <button onClick={addToCart}
                disabled={!selectedSize || !selectedColor || !variantModal.variants?.some(va => va.kichCo?.kichCo === selectedSize && va.mauSac?.mauSac === selectedColor)}
                className="w-full bg-gold text-noir font-semibold py-3 rounded-xl hover:bg-gold-hover transition disabled:opacity-50 flex items-center justify-center gap-2">
                <Plus className="h-5 w-5" /> Thêm vào giỏ hàng
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={typeof confirmAction === 'number'}
        title="Xóa sản phẩm"
        message="Bạn chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?"
        confirmText="Xóa"
        onConfirm={() => removeItem(confirmAction)}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmAction === 'place'}
        title="Xác nhận thanh toán"
        message="Bạn chắc chắn muốn tạo đơn bán hàng với giỏ hiện tại?"
        confirmText="Thanh toán"
        variant="gold"
        onConfirm={() => handlePlace()}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmQuickAdd}
        title="Thêm khách hàng"
        message={`Bạn chắc chắn muốn tạo khách hàng "${quickForm.hoTen.trim()}"?`}
        confirmText="Thêm"
        variant="gold"
        loading={quickSaving}
        onConfirm={handleQuickAdd}
        onCancel={() => setConfirmQuickAdd(false)}
      />
    </div>
  )
}
