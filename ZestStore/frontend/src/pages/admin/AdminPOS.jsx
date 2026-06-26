import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { createCustomer, getCoupons, getInvoiceByOrderId, generateInvoice } from '../../api/admin'
import { VND } from '../../components/ProductCard'
import { Search, Plus, Minus, Trash2, ShoppingCart, X, User, ChevronDown, UserPlus, Tag } from 'lucide-react'
import SafeImg from '../../components/SafeImg'

export default function AdminPOS() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState([])
  const [tenKhach, setTenKhach] = useState('')
  const [sdtKhach, setSdtKhach] = useState('')
  const [placing, setPlacing] = useState(false)
  const [msg, setMsg] = useState(null)
  const [variantModal, setVariantModal] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [vQty, setVQty] = useState(1)
  const [sizes, setSizes] = useState([])
  const [colors, setColors] = useState([])
  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState('')

  useEffect(() => {
    api.get('/categories').then(r => {
      const flatten = (list) => list.reduce((acc, c) => {
        acc.push(c)
        if (c.children) acc.push(...flatten(c.children))
        return acc
      }, [])
      setCategories(flatten(r.data || []))
    }).catch(() => {})
  }, [])

  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState([])
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [searchingCustomer, setSearchingCustomer] = useState(false)
  const customerRef = useRef(null)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [quickForm, setQuickForm] = useState({ hoTen: '', soDienThoai: '', email: '', matKhau: '' })
  const [quickSaving, setQuickSaving] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [couponMsg, setCouponMsg] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponModal, setCouponModal] = useState(false)
  const [availableCoupons, setAvailableCoupons] = useState([])
  const [couponListLoading, setCouponListLoading] = useState(false)
  const [payResult, setPayResult] = useState(null)
  const [printInvoice, setPrintInvoice] = useState(null)

  useEffect(() => {
    const handler = setTimeout(async () => {
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

  const selectCustomer = (c) => {
    setSelectedCustomer(c)
    setTenKhach(c.hoTen)
    setSdtKhach(c.soDienThoai || '')
    setCustomerSearch(c.hoTen + (c.soDienThoai ? ` (${c.soDienThoai})` : ''))
    setShowCustomerDropdown(false)
  }

  const clearCustomer = () => {
    setSelectedCustomer(null)
    setTenKhach('')
    setSdtKhach('')
    setCustomerSearch('')
    setCustomerResults([])
  }

  useEffect(() => {
    setLoading(true)
    const params = { size: 100 }
    if (categoryId) params.categoryId = categoryId
    api.get('/products', { params })
      .then(r => setProducts(r.data.content || []))
      .catch(() => setMsg({ type: 'error', text: 'Không thể tải sản phẩm' }))
      .finally(() => setLoading(false))
  }, [categoryId])

  const searchRef = useRef(null)
  const doSearch = (val) => {
    setSearch(val)
    if (searchRef.current) clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => {
      setLoading(true)
      const params = { size: 100 }
      if (val.trim()) params.keyword = val.trim()
      else if (categoryId) params.categoryId = categoryId
      api.get('/products', { params })
        .then(r => setProducts(r.data.content || []))
        .catch(() => {})
        .finally(() => setLoading(false))
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

  const addToCart = () => {
    const detail = variantModal
    const variant = detail.variants?.find(v => v.kichCo?.kichCo === selectedSize && v.mauSac?.mauSac === selectedColor)
    if (!variant) return
    if (vQty > (variant.tonKho || 0)) {
      setMsg({ type: 'error', text: 'Số lượng vượt quá tồn kho' })
      return
    }
    setCart(prev => {
      const existing = prev.findIndex(c => c.maBienThe === selectedVar)
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
      if (newQty > c.tonKho) {
        setMsg({ type: 'error', text: 'Vượt quá tồn kho' })
        return c
      }
      return { ...c, soLuong: newQty }
    }))
  }

  const removeItem = (idx) => setCart(prev => prev.filter((_, i) => i !== idx))

  const total = cart.reduce((s, c) => s + c.gia * c.soLuong, 0)

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponMsg('')
    setCoupon(null)
    try {
      const res = await api.post('/coupons/validate', {
        maCode: couponCode.trim(),
        giaTriDon: total,
      }).then(r => r.data)
      setCoupon(res)
    } catch (err) {
      setCouponMsg(err.response?.data?.message || 'Mã giảm giá không hợp lệ')
    } finally {
      setCouponLoading(false)
    }
  }

  const handleOpenCouponModal = async () => {
    setCouponModal(true)
    setCouponListLoading(true)
    try {
      const list = await getCoupons()
      setAvailableCoupons(list.filter(c => c.trangThai === 1))
    } catch {
      setMsg({ type: 'error', text: 'Không thể tải danh sách mã giảm giá' })
    } finally {
      setCouponListLoading(false)
    }
  }

  const selectCoupon = async (c) => {
    setCouponCode(c.maCode)
    setCouponModal(false)
    setCoupon(null)
    setCouponMsg('')
    if (total > 0) {
      try {
        setCouponLoading(true)
        const res = await api.post('/coupons/validate', { maCode: c.maCode, giaTriDon: total }).then(r => r.data)
        setCoupon(res)
      } catch (err) {
        setCouponMsg(err.response?.data?.message || 'Mã giảm giá không hợp lệ')
      } finally {
        setCouponLoading(false)
      }
    }
  }

  const handleQuickAdd = async () => {
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
    if (cart.length === 0) return
    setPlacing(true)
    try {
      const res = await api.post('/admin/pos/orders', {
        items: cart.map(c => ({ maBienThe: c.maBienThe, soLuong: c.soLuong })),
        maNguoiDung: selectedCustomer?.maNguoiDung || undefined,
        maCode: coupon?.maCode || undefined,
        tenKhachHang: tenKhach.trim() || undefined,
        sdtKhachHang: sdtKhach.trim() || undefined,
      }).then(r => r.data)
      if (!res || !res.maDonHang) throw new Error('Phản hồi không hợp lệ')
      setCart([])
      setSelectedCustomer(null)
      setTenKhach('')
      setSdtKhach('')
      setCoupon(null)
      setCouponCode('')
      setPayResult(res)
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || err.message || 'Tạo đơn thất bại' })
    } finally {
      setPlacing(false)
    }
  }

  const goToOrders = useCallback(() => {
    setPayResult(null)
    setPrintInvoice(null)
    navigate('/admin/orders', { replace: true })
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
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-50 border border-green-300 text-green-700' : 'bg-red-50 border border-red-300 text-red-700'}`}>
          <span className="text-sm">{msg.text}</span>
          <button onClick={() => setMsg(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="flex-1 flex flex-col bg-white rounded-xl border">
        <div className="p-4 border-b space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input value={search} onChange={e => doSearch(e.target.value)}
              placeholder="Tìm sản phẩm..."
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-2">
            <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setSearch('') }}
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tất cả danh mục</option>
              {categories.map(c => (
                <option key={c.maDanhMuc} value={c.maDanhMuc}>
                  {'—'.repeat((c.maDanhMucCha ? 1 : 0))}{c.tenDanhMuc}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Đang tải...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Không tìm thấy sản phẩm</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map(p => (
                <button key={p.maSanPham} onClick={() => openVariant(p)}
                  className="text-left border rounded-xl p-3 hover:border-blue-400 hover:shadow-sm transition">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                    <SafeImg src={p.urlAnhDaiDien} alt="" className="w-full h-full object-cover object-center"
                      fallback="https://placehold.co/200x200/e2e8f0/475569?text=Polo" />
                  </div>
                  <p className="text-sm font-medium truncate">{p.tenSanPham}</p>
                  <p className="text-blue-700 font-bold text-sm">{VND(p.giaTrungBinh || 0)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-80 bg-white rounded-xl border flex flex-col">
        <div className="p-4 border-b flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-blue-700" />
          <span className="font-semibold">Giỏ hàng</span>
          <span className="ml-auto text-sm text-gray-500">{cart.length} món</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">Chưa có sản phẩm</div>
          ) : (
            cart.map((c, i) => (
              <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-lg p-2.5">
                  <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden shrink-0">
                    <SafeImg src={c.urlAnh} alt="" className="w-full h-full object-cover"
                      fallback="https://placehold.co/100x100/e2e8f0/475569?text=P" />
                  </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{c.tenSanPham}</p>
                  <p className="text-xs text-gray-500">{[c.mauSac, c.kichCo].filter(Boolean).join(' - ') || '—'}</p>
                  <p className="text-xs text-blue-700 font-semibold">{VND(c.gia)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(i, -1)}
                    className="w-6 h-6 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 text-xs">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-medium">{c.soLuong}</span>
                  <button onClick={() => updateQty(i, 1)}
                    className="w-6 h-6 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 text-xs">
                    <Plus className="h-3 w-3" />
                  </button>
                  <button onClick={() => removeItem(i)}
                    className="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:text-red-600 text-xs">
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
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-600">Khách hàng</span>
              {selectedCustomer && (
                <button onClick={clearCustomer}
                  className="ml-auto text-xs text-red-500 hover:text-red-700">Bỏ chọn</button>
              )}
            </div>
            <div className="relative flex gap-1">
              <input value={customerSearch} onChange={e => {
                setCustomerSearch(e.target.value)
                if (selectedCustomer) clearCustomer()
              }} onFocus={() => customerResults.length > 0 && setShowCustomerDropdown(true)}
                placeholder="Tìm tên hoặc SĐT khách..."
                className="flex-1 border rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={() => { setQuickAddOpen(true); setQuickForm({ hoTen: '', soDienThoai: '', email: '', matKhau: '' }) }}
                className="shrink-0 w-9 flex items-center justify-center border border-dashed border-blue-400 text-blue-600 rounded-lg hover:bg-blue-50 transition"
                title="Thêm khách hàng nhanh">
                <UserPlus className="h-4 w-4" />
              </button>
              {searchingCustomer ? (
                <div className="absolute right-12 top-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <ChevronDown className="absolute right-12 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              )}
            </div>
            {showCustomerDropdown && customerResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {customerResults.map(c => (
                  <button key={c.maNguoiDung} onClick={() => selectCustomer(c)}
                    className="w-full text-left px-3 py-2.5 hover:bg-blue-50 border-b last:border-0">
                    <p className="text-sm font-medium">{c.hoTen}</p>
                    <p className="text-xs text-gray-500">{c.email}{c.soDienThoai ? ` - ${c.soDienThoai}` : ''}</p>
                  </button>
                ))}
              </div>
            )}
            {showCustomerDropdown && customerResults.length === 0 && customerSearch.trim() && !searchingCustomer && (
              <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg p-3 text-center text-sm text-gray-400">
                Không tìm thấy khách hàng
              </div>
            )}
          </div>
          <input value={tenKhach} onChange={e => { setTenKhach(e.target.value); setSelectedCustomer(null) }}
            placeholder="Tên khách (không bắt buộc)"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input value={sdtKhach} onChange={e => { setSdtKhach(e.target.value); setSelectedCustomer(null) }}
            placeholder="SĐT (không bắt buộc)"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="border-t pt-2 space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={couponCode} onChange={e => { setCouponCode(e.target.value); setCoupon(null); setCouponMsg('') }}
                  placeholder="Mã giảm giá"
                  className="w-full pl-8 pr-2 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button onClick={handleValidateCoupon} disabled={couponLoading || !couponCode.trim()}
                className="shrink-0 px-3 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition disabled:opacity-50">
                {couponLoading ? '...' : 'Áp dụng'}
              </button>
              <button onClick={handleOpenCouponModal} type="button"
                className="shrink-0 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 border transition flex items-center gap-1">
                <Search className="h-4 w-4" /> Chọn
              </button>
            </div>
            {couponMsg && <p className="text-xs text-red-500">{couponMsg}</p>}
            {coupon && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-700">{coupon.maCode}</span>
                  <button onClick={() => { setCoupon(null); setCouponCode(''); setCouponMsg('') }}
                    className="text-green-500 hover:text-green-700"><X className="h-3.5 w-3.5" /></button>
                </div>
                <p className="text-xs text-green-600">Giảm {VND(coupon.soTienGiam)}</p>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tạm tính:</span>
              <span>{VND(total)}</span>
            </div>
            {coupon && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Giảm giá:</span>
                <span>-{VND(coupon.soTienGiam)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1 border-t">
              <span className="font-semibold">Phải thanh toán:</span>
              <span className="text-lg font-bold text-blue-700">{VND(Math.max(0, total - (coupon?.soTienGiam || 0)))}</span>
            </div>
          </div>
          <button onClick={handlePlace} disabled={cart.length === 0 || placing}
            className="w-full bg-blue-700 text-white font-semibold py-3 rounded-xl hover:bg-blue-800 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {placing ? 'Đang xử lý...' : 'Thanh toán tiền mặt'}
          </button>
        </div>
      </div>

      {quickAddOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 animate-fade-in"
          onClick={() => !quickSaving && setQuickAddOpen(false)}>
          <div className="bg-white rounded-2xl max-w-sm w-full mx-4 animate-scale-in"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-lg">Thêm khách hàng nhanh</h3>
              <button onClick={() => setQuickAddOpen(false)} className="text-gray-400 hover:text-gray-600" disabled={quickSaving}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <input value={quickForm.hoTen} onChange={e => setQuickForm(f => ({ ...f, hoTen: e.target.value }))}
                placeholder="Họ tên *"
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={quickForm.soDienThoai} onChange={e => setQuickForm(f => ({ ...f, soDienThoai: e.target.value }))}
                placeholder="Số điện thoại"
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={quickForm.email} onChange={e => setQuickForm(f => ({ ...f, email: e.target.value }))}
                placeholder="Email (tự động nếu để trống)"
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={quickForm.matKhau} onChange={e => setQuickForm(f => ({ ...f, matKhau: e.target.value }))}
                type="text" placeholder="Mật khẩu (mặc định: customer123)"
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="border-t p-4">
              <button onClick={handleQuickAdd} disabled={quickSaving || !quickForm.hoTen.trim()}
                className="w-full bg-blue-700 text-white font-semibold py-3 rounded-xl hover:bg-blue-800 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {quickSaving ? 'Đang lưu...' : 'Thêm khách hàng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {couponModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 animate-fade-in"
          onClick={() => setCouponModal(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full mx-4 max-h-[70vh] flex flex-col animate-scale-in"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-lg">Chọn mã giảm giá</h3>
              <button onClick={() => setCouponModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2">
              {couponListLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : availableCoupons.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Không có mã giảm giá nào khả dụng</p>
              ) : (
                availableCoupons.map(c => (
                  <button key={c.maPhieuGiamGia} onClick={() => selectCoupon(c)}
                    className="w-full text-left border rounded-xl p-3 hover:border-blue-400 hover:bg-blue-50 transition flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <Tag className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{c.maCode}</p>
                      <p className="text-xs text-gray-500">
                        {c.kieuGiamGia === 1 ? `Giảm ${c.giaTriGiam}%` : `Giảm ${VND(c.giaTriGiam)}`}
                        {c.giaTriDonToiThieu ? ` - Đơn tối thiểu ${VND(c.giaTriDonToiThieu)}` : ''}
                        {c.soLuong != null ? ` - Còn ${c.soLuong} lượt` : ''}
                      </p>
                    </div>
                    <ChevronDown className="h-5 w-5 text-gray-400 -rotate-90 shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {payResult && !printInvoice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full mx-4 animate-scale-in">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="font-bold text-lg">Thanh toán thành công</h3>
              <p className="text-sm text-gray-500 mt-1">Đơn hàng #{payResult.maDonHang}</p>
              <p className="text-lg font-bold text-blue-700 mt-2">{VND(payResult.thanhToan)}</p>
            </div>
            <div className="border-t p-4">
              <p className="text-sm text-center text-gray-600 mb-4">Bạn có muốn in hóa đơn không?</p>
              <div className="flex gap-3">
                <button onClick={goToOrders}
                  className="flex-1 px-4 py-2.5 border rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                  Không
                </button>
                <button onClick={handlePrintInvoice}
                  className="flex-1 px-4 py-2.5 bg-blue-700 text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition">
                  Có
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {printInvoice === 'loading' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="h-8 w-8 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {printInvoice && printInvoice !== 'loading' && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold text-lg">Hóa đơn {printInvoice.maHoaDonCode}</h2>
              <button onClick={goToOrders} className="p-2 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div id="invoice-print" className="p-6 space-y-6">
              <div className="text-center border-b pb-4">
                <h3 className="text-2xl font-bold">ZEST STORE</h3>
                <p className="text-sm text-gray-500">HÓA ĐƠN BÁN HÀNG</p>
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
                  <tr className="border-b bg-gray-50">
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
                        {item.thongTinBienThe && <p className="text-xs text-gray-400">{item.thongTinBienThe}</p>}
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
                    <p><span className="text-gray-500">Tổng:</span> <span className="font-semibold">{VND(Number(t) + Number(g))}</span></p>
                    {Number(g) > 0 && <p><span className="text-green-600">Giảm giá:</span> <span className="font-semibold text-green-600">-{VND(g)}</span></p>}
                    <p className="text-lg font-bold text-blue-700">Phải thanh toán: {VND(t)}</p>
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

      {variantModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 animate-fade-in"
          onClick={() => setVariantModal(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full mx-4 animate-scale-in"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start p-4 border-b gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                <SafeImg src={variantModal.product?.urlAnhDaiDien} alt="" className="w-full h-full object-cover object-center"
                  fallback="https://placehold.co/200x200/e2e8f0/475569?text=Polo" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold">{variantModal.product?.tenSanPham || 'Sản phẩm'}</h3>
                {(() => {
                  const v = variantModal.variants?.find(va => va.kichCo?.kichCo === selectedSize && va.mauSac?.mauSac === selectedColor)
                  return v ? <p className="text-blue-700 font-bold text-lg">{VND(v.gia)}</p> : null
                })()}
              </div>
              <button onClick={() => setVariantModal(null)} className="text-gray-400 hover:text-gray-600 shrink-0">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {sizes.length > 1 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Kích cỡ</p>
                  <div className="flex gap-2 flex-wrap">
                    {sizes.map(s => {
                      const hasStock = (variantModal.variants || []).some(v => v.kichCo?.kichCo === s && (v.tonKho || 0) > 0)
                      return (
                        <button key={s} onClick={() => {
                          const avail = (variantModal.variants || []).find(v => v.kichCo?.kichCo === s && (v.tonKho || 0) > 0)
                          setSelectedSize(s); setSelectedColor(avail ? avail.mauSac?.mauSac : (colors[0] || null)); setVQty(1)
                        }}
                          disabled={!hasStock}
                          className={`px-4 py-2 text-sm border rounded-lg font-medium transition ${selectedSize === s ? 'border-blue-700 bg-blue-50 text-blue-700' : hasStock ? 'hover:border-gray-400' : 'opacity-30 cursor-not-allowed'}`}>
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
                      const hasStock = (variantModal.variants || []).some(v => v.mauSac?.mauSac === c && v.kichCo?.kichCo === selectedSize && (v.tonKho || 0) > 0)
                      return (
                        <button key={c} onClick={() => { setSelectedColor(c); setVQty(1) }}
                          disabled={!hasStock}
                          className={`px-4 py-2 text-sm border rounded-lg font-medium transition ${selectedColor === c ? 'border-blue-700 bg-blue-50 text-blue-700' : hasStock ? 'hover:border-gray-400' : 'opacity-30 cursor-not-allowed'}`}>
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
                    className="px-3 py-1.5 hover:bg-gray-100">-</button>
                  <span className="px-4 py-1.5 border-x min-w-[2.5rem] text-center text-sm">{vQty}</span>
                  <button onClick={() => setVQty(vQty + 1)}
                    className="px-3 py-1.5 hover:bg-gray-100">+</button>
                </div>
                {(() => {
                  const v = variantModal.variants?.find(va => va.kichCo?.kichCo === selectedSize && va.mauSac?.mauSac === selectedColor)
                  return v ? <span className="text-xs text-gray-400">Kho: {v.tonKho ?? 0}</span> : null
                })()}
              </div>
            </div>

            <div className="border-t p-4">
              <button onClick={addToCart}
                disabled={!selectedSize || !selectedColor || !variantModal.variants?.some(va => va.kichCo?.kichCo === selectedSize && va.mauSac?.mauSac === selectedColor)}
                className="w-full bg-blue-700 text-white font-semibold py-3 rounded-xl hover:bg-blue-800 transition disabled:opacity-50 flex items-center justify-center gap-2">
                <Plus className="h-5 w-5" /> Thêm vào giỏ hàng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
