import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { getActiveCategories } from '../../api/categories'
import { createCustomer, getOrderPrintData, registerOrderPrint, lookupSku } from '../../api/admin'
import { getBestOffer } from '../../api/coupons'
import { posApi } from '../../components/admin/pos/apiClient'
import OrderTabs from '../../components/admin/pos/OrderTabs'
import ProductGrid from '../../components/admin/pos/ProductGrid'
import CartPanel from '../../components/admin/pos/CartPanel'
import AddProductModal from '../../components/admin/pos/AddProductModal'
import CustomerPickerModal from '../../components/admin/pos/CustomerPickerModal'
import PaymentModal from '../../components/admin/pos/PaymentModal'
import POSToast from '../../components/admin/pos/POSToast'
import CameraScanner from '../../components/CameraScanner'
import ConfirmDialog from '../../components/ConfirmDialog'
import InvoicePrint from '../../components/InvoicePrint'
import { Plus, Minus, ShoppingCart, Trash2, X } from 'lucide-react'
import SafeImg from '../../components/SafeImg'
import { useAuth } from '../../context/AuthContext'

const VND = (n) => { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }

export default function AdminPOS() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const checkoutKey = useRef(sessionStorage.getItem('posCheckoutKey') || crypto.randomUUID())
  const pendingCheckout = useRef(false)
  const persistCheckoutKey = () => {
    sessionStorage.setItem('posCheckoutKey', checkoutKey.current)
    return checkoutKey.current
  }
  const finishCheckout = () => {
    sessionStorage.removeItem('posCheckoutKey')
    checkoutKey.current = crypto.randomUUID()
  }
  const [products, setProducts] = useState([])
  const [allVariants, setAllVariants] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState([])
  const [placing, setPlacing] = useState(false)
  const [msg, setMsg] = useState(null)
  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState('')
  const [colors, setColors] = useState([])
  const [sizes, setSizes] = useState([])

  const [orders, setOrders] = useState([])
  const [currentOrderIdx, setCurrentOrderIdx] = useState(0)
  const orderIdCounter = useRef(0)

  const [showAddModal, setShowAddModal] = useState(false)
  const [showCustomerPicker, setShowCustomerPicker] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [coupon, setCoupon] = useState(null)
  const [couponMsg, setCouponMsg] = useState('')
  const [couponInput, setCouponInput] = useState('')
  const [availableCoupons, setAvailableCoupons] = useState([])
  const [bankInfo, setBankInfo] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [loaiDon, setLoaiDon] = useState('TAI_QUAY')
  const [shippingInfo, setShippingInfo] = useState({ hoTen: '', soDienThoai: '', diaChi: '', tinhThanh: '', quanHuyen: '', phuongXa: '', phuongThuc: 'GHN' })
  const [shippingFee, setShippingFee] = useState(0)
  const [shippingLoading, setShippingLoading] = useState(false)
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [wards, setWards] = useState([])
  const [mienPhiVanChuyen, setMienPhiVanChuyen] = useState(false)
  const shippingDebounceRef = useRef(null)
  const [payResult, setPayResult] = useState(null)
  const [printInvoice, setPrintInvoice] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [customerPaid, setCustomerPaid] = useState(0)
  const [variantModal, setVariantModal] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [vQty, setVQty] = useState(1)
  const [variantSizes, setVariantSizes] = useState([])
  const [variantColors, setVariantColors] = useState([])

  useEffect(() => {
    getActiveCategories().then(r => setCategories(Array.isArray(r) ? r : [])).catch(() => {})
    posApi.getColors().then(setColors).catch(() => {})
    posApi.getSizes().then(setSizes).catch(() => {})
    posApi.getVariants().then(r => {
      const data = Array.isArray(r) ? r : []
      setAllVariants(data)
      setProducts(data.map(v => ({
        maSanPham: v.maSanPham,
        tenSanPham: v.tenSanPham,
        urlAnhDaiDien: v.urlAnhDaiDien,
        gia: v.gia,
        giaNhap: v.giaNhap,
        tonKho: v.tonKho,
        mauSac: v.mauSac,
        kichCo: v.kichCo,
        sku: v.sku,
        maBienThe: v.maBienThe,
        trangThai: v.trangThai,
      })).filter(v => v.trangThai !== 0 && v.tonKho > 0))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const params = { size: 100 }
    if (categoryId) params.categoryId = categoryId
    api.get('/products', { params }).then(r => {
      const content = r.data.content || []
      if (content.length > 0 && allVariants.length === 0) {
        setProducts(content)
      }
    }).catch(() => {})
  }, [categoryId])

  useEffect(() => {
    posApi.getProvinces().then(setProvinces).catch(() => {})
  }, [])

  useEffect(() => {
    if (!shippingInfo.tinhThanh) { setDistricts([]); setWards([]); return }
    posApi.getDistricts(shippingInfo.tinhThanh).then(setDistricts).catch(() => setDistricts([]))
  }, [shippingInfo.tinhThanh])

  useEffect(() => {
    if (!shippingInfo.quanHuyen) { setWards([]); return }
    posApi.getWards(shippingInfo.quanHuyen).then(setWards).catch(() => setWards([]))
  }, [shippingInfo.quanHuyen])

  useEffect(() => {
    if (loaiDon !== 'GIAO_HANG' || !shippingInfo.tinhThanh || !shippingInfo.quanHuyen || !shippingInfo.phuongXa) { setShippingFee(0); return }
    setShippingLoading(true)
    clearTimeout(shippingDebounceRef.current)
    shippingDebounceRef.current = setTimeout(() => {
      posApi.calculateShipping({
        serviceTypeId: shippingInfo.phuongThuc === 'GHTK' ? 1 : 2,
        toDistrictId: parseInt(shippingInfo.quanHuyen, 10),
        toWardCode: String(shippingInfo.phuongXa),
        weight: (cart.reduce((s, c) => s + c.soLuong, 0) || 1) * 500,
      }).then(r => setShippingFee(r.fee || 0)).catch(() => setShippingFee(30000)).finally(() => setShippingLoading(false))
    }, 300)
    return () => clearTimeout(shippingDebounceRef.current)
  }, [loaiDon, shippingInfo.tinhThanh, shippingInfo.quanHuyen, shippingInfo.phuongXa, shippingInfo.phuongThuc, cart])

  const phiVanChuyen = loaiDon === 'GIAO_HANG' && !mienPhiVanChuyen ? shippingFee : 0
  const total = cart.reduce((s, c) => s + c.gia * c.soLuong, 0)
  const thanhTien = Math.max(0, total - (coupon?.soTienGiam || 0) + phiVanChuyen)
  const soLuongSanPham = cart.reduce((s, c) => s + c.soLuong, 0)

  const saveCurrentOrder = (idxOverride) => {
    const idx = idxOverride !== undefined ? idxOverride : currentOrderIdx
    setOrders(prev => prev.map((o, i) => i === idx ? { ...o, cart, customer: selectedCustomer, coupon } : o))
  }

  const switchOrder = (idx) => {
    if (idx === currentOrderIdx) return
    saveCurrentOrder(currentOrderIdx)
    const target = orders[idx]
    setCart(target.cart)
    setSelectedCustomer(target.customer)
    setCoupon(target.coupon)
    setCouponInput(target.coupon?.maCode || '')
    setAvailableCoupons([])
    setCouponMsg('')
    setCurrentOrderIdx(idx)
  }

  const addNewOrder = () => {
    if (orders.length >= 10) {
      setMsg({ type: 'error', text: 'Đã đạt giới hạn 10 đơn hàng mở. Vui lòng thanh toán hoặc đóng đơn hiện tại.' })
      return
    }
    if (orders.length > 0) saveCurrentOrder()
    orderIdCounter.current += 1
    const newOrder = { id: orderIdCounter.current, cart: [], customer: null, coupon: null }
    setOrders(prev => [...prev, newOrder])
    setCart([])
    setSelectedCustomer(null)
    setCoupon(null)
    setCouponInput('')
    setCouponMsg('')
    setAvailableCoupons([])
    setCurrentOrderIdx(0)
  }

  const removeOrder = (idx) => {
    const newOrders = orders.filter((_, i) => i !== idx)
    setOrders(newOrders)
    if (newOrders.length === 0) {
      setCart([])
      setSelectedCustomer(null)
      setCoupon(null)
      setCouponInput('')
      setCouponMsg('')
      setCurrentOrderIdx(0)
    } else if (idx === currentOrderIdx) {
      const newIdx = Math.min(idx, newOrders.length - 1)
      const target = newOrders[newIdx]
      setCart(target.cart)
      setSelectedCustomer(target.customer)
      setCoupon(target.coupon)
      setCouponInput(target.coupon?.maCode || '')
      setCurrentOrderIdx(newIdx)
    } else if (idx < currentOrderIdx) {
      setCurrentOrderIdx(prev => prev - 1)
    }
  }

  const addToCart = (variant) => {
    const qtyInCart = cart.filter(c => c.maBienThe === variant.maBienThe).reduce((s, c) => s + c.soLuong, 0)
    if (qtyInCart >= (variant.tonKho || 0)) { setMsg({ type: 'error', text: 'Sản phẩm đã hết hàng' }); return }
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
        gia: variant.gia || 0,
        soLuong: 1,
        tonKho: variant.tonKho || 0,
        urlAnh: variant.urlAnhDaiDien || variant.urlAnh || '',
        maSanPhamCode: variant.sku || '',
        sku: variant.sku || '',
      }]
    })
    setMsg({ type: 'success', text: `Đã thêm ${variant.tenSanPham} (${variant.mauSac || ''} ${variant.kichCo || ''}) vào giỏ hàng` })
  }

  const updateQtyCart = (idx, delta) => {
    setCart(prev => {
      const updated = prev.map((c, i) => {
        if (i !== idx) return c
        const newQty = c.soLuong + delta
        if (newQty <= 0) return null
        if (delta > 0 && newQty > c.tonKho) {
          setMsg({ type: 'error', text: `Chỉ còn ${c.tonKho} sản phẩm trong kho` })
          return c
        }
        return { ...c, soLuong: newQty }
      }).filter(Boolean)
      return updated
    })
  }

  const updateQtyModal = (variant, delta) => {
    const idx = cart.findIndex(c => c.maBienThe === variant.maBienThe)
    if (idx >= 0) {
      updateQtyCart(idx, delta)
    } else if (delta > 0) {
      addToCart(variant)
    }
  }

  const removeItem = (idx) => setCart(prev => prev.filter((_, i) => i !== idx))
  const clearCart = () => setCart([])

  const handleScannedSku = async (rawSku) => {
    const sku = rawSku.trim().toUpperCase()
    try {
      const variant = await lookupSku(sku)
      addToCart(variant)
    } catch {
      setSearch(sku)
    }
  }

  const handleApplyCoupon = async (code) => {
    if (!code?.trim()) return
    setCoupon(null)
    setCouponMsg('')
    try {
      const res = await posApi.validateCoupon({
        maCode: code.trim(),
        tongTien: total,
        maNguoiDung: selectedCustomer?.maNguoiDung || undefined,
      })
      if (res.hopLe) { setCoupon(res); setCouponInput(code); setCouponCodeState(code) }
      else { setCouponMsg(res.lyDoTuChoi || 'Mã giảm giá không hợp lệ') }
    } catch (err) {
      setCouponMsg(err.response?.data?.message || 'Mã giảm giá không hợp lệ')
    }
  }

  const autoApplyBestCoupon = useCallback(async () => {
    if (cart.length === 0) {
      setCoupon(null)
      setCouponMsg('')
      return
    }
    try {
      const res = await getBestOffer(total, [], selectedCustomer?.maNguoiDung)
      if (res.found) {
        setCoupon({ hopLe: true, maCode: res.maCode, soTienGiam: res.soTienGiam, kieuGiamGia: res.kieuGiamGia, loaiMa: res.loaiMa || 'COUPON' })
        setCouponInput(res.maCode)
        setCouponMsg('')
      } else {
        setCoupon(null)
        setCouponInput('')
        setCouponMsg('')
      }
    } catch {
      // silently ignore
    }
  }, [cart.length, total, selectedCustomer?.maNguoiDung])

  useEffect(() => {
    autoApplyBestCoupon()
  }, [autoApplyBestCoupon])

  const [couponCodeState, setCouponCodeState] = useState('')

  const resetOrderState = () => {
    const newOrders = orders.filter((_, i) => i !== currentOrderIdx)
    if (newOrders.length === 0) newOrders.push({ id: ++orderIdCounter.current, cart: [], customer: null, coupon: null })
    setOrders(newOrders)
    setCart(newOrders[0]?.cart || [])
    setSelectedCustomer(newOrders[0]?.customer || null)
    setCoupon(newOrders[0]?.coupon || null)
    setCouponInput(newOrders[0]?.coupon?.maCode || '')
    setCurrentOrderIdx(0)
    setCustomerPaid(0)
  }

  const handleCheckout = async (paymentMethod = 5) => {
    setShowPaymentModal(false)
    if (cart.length === 0 || pendingCheckout.current) return
    pendingCheckout.current = true
    setPlacing(true)
    try {
      if (paymentMethod === 6) {
        const totalAmount = Math.max(0, total - (coupon?.soTienGiam || 0))
        const vqRes = await posApi.vietQRPreview(totalAmount)
        setQrDataUrl(vqRes.qrUrl)
        setBankInfo(vqRes)
      } else {
        const res = await posApi.createOrder({
          items: cart.map(c => ({ maBienThe: c.maBienThe, soLuong: c.soLuong })),
          maNguoiDung: selectedCustomer?.maNguoiDung || undefined,
          maCode: coupon?.maCode || undefined,
          phuongThucThanhToan: 5,
        })
        if (!res || !res.maDonHang) throw new Error('Phản hồi không hợp lệ')
        resetOrderState()
        setPayResult(res)
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || err.message || 'Tạo đơn thất bại' })
    } finally {
      pendingCheckout.current = false
      setPlacing(false)
    }
  }

  const handleConfirmQR = async () => {
    if (cart.length === 0 || pendingCheckout.current) return
    pendingCheckout.current = true
    setShowPaymentModal(false)
    setPlacing(true)
    try {
      const res = await posApi.createOrder({
        items: cart.map(c => ({ maBienThe: c.maBienThe, soLuong: c.soLuong })),
        maNguoiDung: selectedCustomer?.maNguoiDung || undefined,
        maCode: coupon?.maCode || undefined,
        phuongThucThanhToan: 6,
      })
      if (!res || !res.maDonHang) throw new Error('Phản hồi không hợp lệ')
      resetOrderState()
      setBankInfo(null)
      setQrDataUrl(null)
      setPayResult(res)
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || err.message || 'Xác nhận thất bại' })
    } finally {
      pendingCheckout.current = false
      setPlacing(false)
    }
  }

  const handlePrintInvoice = async () => {
    if (!payResult?.maDonHang) return
    setPrintInvoice('loading')
    try {
      const data = await registerOrderPrint(payResult.maDonHang)
      setPrintInvoice(data)
    } catch {
      try { const data = await getOrderPrintData(payResult.maDonHang); setPrintInvoice(data) }
      catch { setMsg({ type: 'error', text: 'Không thể tải hóa đơn' }); setPrintInvoice(null) }
    }
  }

  const closeResult = () => { setPayResult(null); setBankInfo(null); setQrDataUrl(null) }
  const goToOrders = useCallback(() => { setPayResult(null); setPrintInvoice(null); navigate('/admin/orders/pos', { replace: true }) }, [navigate])

  useEffect(() => {
    if (!printInvoice || printInvoice === 'loading') return
    const timer = setTimeout(() => window.print(), 300)
    const afterPrint = () => goToOrders()
    window.addEventListener('afterprint', afterPrint)
    return () => { clearTimeout(timer); window.removeEventListener('afterprint', afterPrint) }
  }, [printInvoice, goToOrders])

  const openVariant = async (product) => {
    try {
      const detail = await api.get(`/products/${product.slug || product.maSanPham}`).then(r => r.data)
      const vars = detail.variants || []
      setVariantModal(detail)
      setVariantSizes([...new Set(vars.map(v => v.kichCo?.kichCo).filter(Boolean))])
      setVariantColors([...new Set(vars.map(v => v.mauSac?.mauSac).filter(Boolean))])
      const firstAvail = vars.find(v => (v.tonKho || 0) > 0) || vars[0]
      setSelectedSize(firstAvail?.kichCo?.kichCo || null)
      setSelectedColor(firstAvail?.mauSac?.mauSac || null)
      setVQty(1)
    } catch { setMsg({ type: 'error', text: 'Không thể tải thông tin sản phẩm' }) }
  }

  const addToCartFromModal = () => {
    if (!variantModal) return
    const variant = variantModal.variants?.find(v => v.kichCo?.kichCo === selectedSize && v.mauSac?.mauSac === selectedColor)
    if (!variant) return
    const qtyInCart = cart.filter(c => c.maBienThe === variant.maBienThe).reduce((s, c) => s + c.soLuong, 0)
    if (qtyInCart >= (variant.tonKho || 0)) { setMsg({ type: 'error', text: 'Sản phẩm đã hết hàng' }); return }
    addToCart({
      ...variant,
      tenSanPham: variantModal.product?.tenSanPham || '',
      urlAnhDaiDien: variant.urlAnh || variantModal.product?.urlAnhDaiDien,
      gia: variant.gia || 0,
      tonKho: variant.tonKho || 0,
      mauSac: variant.mauSac?.mauSac || '',
      kichCo: variant.kichCo?.kichCo || '',
      sku: variant.sku || '',
    })
    setVariantModal(null)
  }

  return (
    <div className="min-h-[calc(100vh-6rem)]">
      {msg && <POSToast message={msg.text} type={msg.type} onClose={() => setMsg(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Bán hàng</h1>
          <p className="text-sm text-stone mt-0.5">Người bán: <span className="font-semibold text-ink-soft">{user?.hoTen || 'Admin'}</span></p>
        </div>
        <button onClick={addNewOrder}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--primary-color)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--primary-hover)] transition shadow-sm">
          <Plus className="h-4 w-4" /> Tạo đơn hàng
        </button>
      </div>

      {/* Order Tabs */}
      {orders.length > 0 && (
        <div className="mb-4">
          <OrderTabs orders={orders} currentIdx={currentOrderIdx} onSwitch={switchOrder} onAdd={addNewOrder} onRemove={removeOrder} />
        </div>
      )}

      {/* Empty state - no orders */}
      {orders.length === 0 && (
        <div className="bg-white rounded-2xl border border-stone/10 p-12 text-center">
          <ShoppingCart className="h-16 w-16 text-stone/20 mx-auto mb-4" />
          <p className="text-stone">Chưa có đơn hàng nào được mở. Vui lòng nhấn <span className="font-semibold text-ink">"Tạo đơn hàng"</span> để bắt đầu.</p>
        </div>
      )}

      {/* Main content when order exists */}
      {orders.length > 0 && (
        <div className="space-y-4">
          {/* Product Table Section */}
          <div className="bg-white rounded-2xl border border-stone/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-stone/10 flex items-center justify-between">
              <h2 className="font-bold text-ink">Sản phẩm giỏ hàng</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setCameraOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-stone/30 rounded-xl text-sm font-medium text-stone hover:border-[var(--primary-color)] hover:text-[var(--primary-color)] transition">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                  Quét QR sản phẩm
                </button>
                <button onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--primary-color)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--primary-hover)] transition">
                  <Plus className="h-4 w-4" /> Thêm sản phẩm
                </button>
              </div>
            </div>

            {cart.length === 0 ? (
              <div className="p-8 text-center text-stone">
                <p>Giỏ hàng trống! Nhấn <span className="font-semibold text-ink">"Thêm sản phẩm"</span> hoặc <span className="font-semibold text-ink">"Quét QR"</span> để chọn đồ.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-ivory-100 text-left">
                      <th className="px-5 py-3 font-semibold text-stone w-12">STT</th>
                      <th className="px-5 py-3 font-semibold text-stone">Sản phẩm</th>
                      <th className="px-5 py-3 font-semibold text-stone w-28">Đơn giá</th>
                      <th className="px-5 py-3 font-semibold text-stone w-32">Số lượng</th>
                      <th className="px-5 py-3 font-semibold text-stone w-28">Thành tiền</th>
                      <th className="px-5 py-3 font-semibold text-stone w-16">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((c, i) => (
                      <tr key={i} className="border-t border-stone/5 hover:bg-ivory/50">
                        <td className="px-5 py-3 text-stone">{i + 1}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-ivory-100 rounded-lg overflow-hidden shrink-0">
                              <SafeImg src={c.urlAnh} alt="" className="w-full h-full object-cover" fallback="https://placehold.co/80x80/e2e8f0/475569?text=P" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-ink truncate">{c.tenSanPham}</p>
                              <p className="text-xs text-stone">{[c.mauSac, c.kichCo].filter(Boolean).join(' - ')}</p>
                              <p className="text-[10px] text-stone font-mono">{c.sku || c.maSanPhamCode || ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 font-semibold text-ink">{VND(c.gia)}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => updateQtyCart(i, -1)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-ivory-100 hover:bg-ivory text-stone transition" aria-label="Giảm">
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm font-bold">{c.soLuong}</span>
                            <button onClick={() => updateQtyCart(i, 1)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-ivory-100 hover:bg-ivory text-stone transition" aria-label="Tăng">
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-3 font-bold text-[var(--primary-color)]">{VND(c.gia * c.soLuong)}</td>
                        <td className="px-5 py-3">
                          <button onClick={() => removeItem(i)} className="w-7 h-7 flex items-center justify-center rounded-lg text-stone hover:text-bordeaux hover:bg-bordeaux/10 transition" aria-label="Xóa">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {cart.length > 0 && (
              <div className="px-5 py-3 border-t border-stone/10 flex justify-between items-center">
                <button onClick={clearCart} className="text-xs text-bordeaux hover:text-bordeaux/80 font-medium">Xóa hết</button>
                <div className="text-sm">
                  <span className="text-stone">Tạm tính: </span>
                  <span className="font-bold text-ink">{VND(total)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Section: Customer Info + Payment Info */}
          <div className="grid grid-cols-2 gap-4">
            {/* Customer Info */}
            <div className="bg-white rounded-2xl border border-stone/10 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-ink">Thông tin khách hàng</h3>
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowCustomerPicker(true)} className="text-xs text-[var(--primary-color)] font-semibold hover:underline">Chọn khách hàng</button>
                  {selectedCustomer && (
                    <>
                      <button className="text-xs text-stone hover:underline">Sửa địa chỉ</button>
                      <button onClick={() => { setSelectedCustomer(null); setCoupon(null); setCouponMsg('') }}
                        className="text-xs text-bordeaux hover:underline font-medium">Gỡ khách</button>
                    </>
                  )}
                </div>
              </div>
              {selectedCustomer ? (
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-ink">{selectedCustomer.hoTen}</p>
                    <span className="w-5 h-5 rounded-full bg-emerald-deep/10 flex items-center justify-center">
                      <svg className="h-3 w-3 text-emerald-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </span>
                  </div>
                  {selectedCustomer.soDienThoai && (
                    <p className="text-xs text-stone mt-1">SĐT: {selectedCustomer.soDienThoai}</p>
                  )}
                  {selectedCustomer.email && (
                    <p className="text-xs text-stone mt-0.5">Email: {selectedCustomer.email}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-stone">Đơn đang được đặt dưới dạng "Khách lẻ" (Mua ẩn danh)</p>
              )}
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-2xl border border-stone/10 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-ink">Thông tin thanh toán</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone">Tại quầy</span>
                  <button onClick={() => setLoaiDon(loaiDon === 'TAI_QUAY' ? 'GIAO_HANG' : 'TAI_QUAY')}
                    className={`relative w-11 h-6 rounded-full transition-colors ${loaiDon === 'GIAO_HANG' ? 'bg-[var(--primary-color)]' : 'bg-stone/30'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${loaiDon === 'GIAO_HANG' ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {/* Coupon */}
                <div>
                  <label className="text-xs font-semibold text-stone mb-1.5 block">Mã phiếu giảm giá</label>
                  <div className="flex items-center gap-2">
                    <input value={couponInput} onChange={e => setCouponInput(e.target.value)}
                      placeholder="Nhập mã (Enter để áp dụng)"
                      disabled={cart.length === 0}
                      className="flex-1 border border-stone/20 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] disabled:opacity-50"
                      onKeyDown={e => { if (e.key === 'Enter') handleApplyCoupon(e.target.value) }} />
                    {coupon && (
                      <button onClick={() => { setCoupon(null); setCouponInput(''); setCouponMsg('') }}
                        className="text-xs text-bordeaux hover:underline font-medium whitespace-nowrap">Xóa</button>
                    )}
                    <span className="text-xs text-stone whitespace-nowrap">Giá trị</span>
                    <span className="text-sm font-bold text-[var(--primary-color)] w-20 text-right">{coupon ? VND(coupon.soTienGiam) : '0 đ'}</span>
                  </div>
                  {couponMsg && <p className="text-[11px] text-bordeaux mt-1">{couponMsg}</p>}
                </div>

                {/* Totals */}
                <div className="space-y-2 text-sm pt-2 border-t border-stone/10">
                  <div className="flex justify-between text-stone">
                    <span>Tiền hàng</span><span>{VND(total)}</span>
                  </div>
                  {coupon && (
                    <div className="flex justify-between text-emerald-deep">
                      <span>Giảm giá</span><span>-{VND(coupon.soTienGiam)}</span>
                    </div>
                  )}
                  {loaiDon === 'GIAO_HANG' && (
                    <div className="flex justify-between text-stone">
                      <span>Phí vận chuyển</span>
                      <span>{mienPhiVanChuyen ? <span className="text-emerald-deep">Miễn phí</span> : VND(shippingFee || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-stone/10">
                    <span className="font-bold text-ink">Tổng số tiền</span>
                    <span className="text-xl font-bold text-[var(--primary-color)]">{VND(thanhTien)}</span>
                  </div>
                </div>

                {/* Customer Payment Input */}
                <div className="pt-2 border-t border-stone/10">
                  <label className="text-xs font-semibold text-stone mb-1.5 block">Khách thanh toán</label>
                  <div className="relative">
                    <input type="text" inputMode="numeric"
                      value={customerPaid === 0 ? '' : customerPaid.toLocaleString('vi-VN')}
                      onChange={e => {
                        const raw = e.target.value.replace(/[^0-9]/g, '')
                        setCustomerPaid(Number(raw) || 0)
                      }}
                      placeholder="0"
                      className="w-full border border-stone/20 rounded-lg pl-8 pr-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] text-right font-semibold"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone text-sm">đ</span>
                  </div>
                </div>

                {/* Change */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone">Tiền thừa trả khách</span>
                  <span className={`font-bold ${customerPaid - thanhTien >= 0 ? 'text-emerald-deep' : 'text-bordeaux'}`}>
                    {VND(Math.max(0, customerPaid - thanhTien))}
                  </span>
                </div>

                {/* Checkout */}
                <button onClick={() => handleCheckout(5)} disabled={cart.length === 0 || placing}
                  className="w-full py-3 bg-[var(--primary-color)] text-white font-bold rounded-xl hover:bg-[var(--primary-hover)] transition disabled:opacity-40 text-sm tracking-wide mt-2">
                  {placing ? 'Đang xử lý...' : 'XÁC NHẬN THANH TOÁN'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Info (when Giao hàng) */}
      {loaiDon === 'GIAO_HANG' && orders.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone/10 p-5 mt-4">
          <h3 className="font-bold text-ink mb-4">Thông tin giao hàng</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone mb-1 block">Họ tên <span className="text-bordeaux">*</span></label>
              <input value={shippingInfo?.hoTen || ''} onChange={e => setShippingInfo(prev => ({ ...prev, hoTen: e.target.value }))}
                placeholder="Nguyễn Văn A" className="w-full border border-stone/20 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone mb-1 block">Số điện thoại <span className="text-bordeaux">*</span></label>
              <input value={shippingInfo?.soDienThoai || ''} onChange={e => setShippingInfo(prev => ({ ...prev, soDienThoai: e.target.value }))}
                placeholder="0912345678" className="w-full border border-stone/20 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-stone mb-1 block">Địa chỉ <span className="text-bordeaux">*</span></label>
              <input value={shippingInfo?.diaChi || ''} onChange={e => setShippingInfo(prev => ({ ...prev, diaChi: e.target.value }))}
                placeholder="Số nhà, đường..." className="w-full border border-stone/20 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone mb-1 block">Tỉnh/TP <span className="text-bordeaux">*</span></label>
              <select value={shippingInfo?.tinhThanh || ''} onChange={e => setShippingInfo(prev => ({ ...prev, tinhThanh: e.target.value, quanHuyen: '', phuongXa: '' }))}
                className="w-full border border-stone/20 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]">
                <option value="">Chọn</option>
                {provinces?.map(p => <option key={p.ProvinceID || p.ma} value={p.ProvinceID || p.ma}>{p.ProvinceName || p.ten}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-stone mb-1 block">Quận/Huyện <span className="text-bordeaux">*</span></label>
              <select value={shippingInfo?.quanHuyen || ''} onChange={e => setShippingInfo(prev => ({ ...prev, quanHuyen: e.target.value, phuongXa: '' }))}
                disabled={!shippingInfo?.tinhThanh}
                className="w-full border border-stone/20 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] disabled:opacity-50">
                <option value="">Chọn</option>
                {districts?.map(d => <option key={d.DistrictID || d.ma} value={d.DistrictID || d.ma}>{d.DistrictName || d.ten}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-stone mb-1 block">Phường/Xã <span className="text-bordeaux">*</span></label>
              <select value={shippingInfo?.phuongXa || ''} onChange={e => setShippingInfo(prev => ({ ...prev, phuongXa: e.target.value }))}
                disabled={!shippingInfo?.quanHuyen}
                className="w-full border border-stone/20 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] disabled:opacity-50">
                <option value="">Chọn</option>
                {wards?.map(w => <option key={w.WardCode || w.ma} value={w.WardCode || w.ma}>{w.WardName || w.ten}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-stone mb-1 block">Phương thức</label>
              <select value={shippingInfo?.phuongThuc || 'GHN'} onChange={e => setShippingInfo(prev => ({ ...prev, phuongThuc: e.target.value }))}
                className="w-full border border-stone/20 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]">
                <option value="GHN">Giao hàng nhanh</option>
                <option value="GHTK">Giao hàng tiết kiệm</option>
              </select>
            </div>
          </div>
          {mienPhiThreshold && total >= mienPhiThreshold && (
            <label className="flex items-center gap-2 text-xs text-emerald-deep cursor-pointer mt-3">
              <input type="checkbox" checked={mienPhiVanChuyen} onChange={() => setMienPhiVanChuyen(v => !v)}
                className="rounded border-stone/30 text-emerald-deep focus:ring-emerald-deep" />
              Miễn phí vận chuyển (đơn từ {VND(mienPhiThreshold)})
            </label>
          )}
          <div className="flex justify-between items-center text-sm bg-ivory-100 rounded-lg px-3 py-2 mt-3">
            <span className="text-stone">Phí vận chuyển</span>
            <span className="font-semibold text-ink">
              {shippingLoading ? 'Đang tính...' : (mienPhiVanChuyen ? <span className="text-emerald-deep">Miễn phí</span> : VND(shippingFee || 0))}
            </span>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddProductModal open={showAddModal} onClose={() => setShowAddModal(false)}
        variants={allVariants} colors={colors} sizes={sizes} cart={cart}
        onAdd={addToCart} onQtyChange={updateQtyModal} />

      <CustomerPickerModal open={showCustomerPicker} onClose={() => setShowCustomerPicker(false)}
        onSelect={(c) => setSelectedCustomer(c)} />

      <PaymentModal open={showPaymentModal} onClose={() => setShowPaymentModal(false)}
        thanhTien={thanhTien} onCheckout={() => handleCheckout(5)} onConfirmQR={handleConfirmQR}
        placing={placing} bankInfo={bankInfo} />

      {cameraOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70" onClick={() => setCameraOpen(false)}>
          <div className="bg-ivory rounded-2xl max-w-lg w-full mx-4 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-stone/10">
              <h3 className="font-bold text-lg">Quét mã vạch</h3>
              <button onClick={() => setCameraOpen(false)} className="text-stone hover:text-ink"><X className="h-5 w-5" /></button>
            </div>
            <CameraScanner onScan={(sku) => { setCameraOpen(false); handleScannedSku(sku) }} onClose={() => setCameraOpen(false)} />
          </div>
        </div>
      )}

      {variantModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setVariantModal(null)}>
          <div className="bg-ivory rounded-2xl max-w-md w-full mx-4 shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-start p-5 border-b border-stone/10 gap-4">
              <div className="w-20 h-20 bg-ivory-100 rounded-xl overflow-hidden shrink-0">
                <SafeImg src={variantModal.product?.urlAnhDaiDien} alt="" className="w-full h-full object-cover" fallback="https://placehold.co/100x100/e2e8f0/475569?text=P" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-ink">{variantModal.product?.tenSanPham || 'Sản phẩm'}</h3>
                {(() => {
                  const v = variantModal.variants?.find(va => va.kichCo?.kichCo === selectedSize && va.mauSac?.mauSac === selectedColor)
                  return v ? <p className="text-[var(--primary-color)] font-bold text-lg mt-1">{VND(v.gia)}</p> : null
                })()}
              </div>
              <button onClick={() => setVariantModal(null)} className="text-stone hover:text-ink shrink-0 p-1"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {variantSizes.length > 1 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Kích cỡ</p>
                  <div className="flex gap-2 flex-wrap">
                    {variantSizes.map(s => {
                      const avail = variantModal.variants?.some(v => v.kichCo?.kichCo === s && (v.tonKho || 0) > cart.filter(c => c.maBienThe === v.maBienThe).reduce((a, b) => a + b.soLuong, 0))
                      return (
                        <button key={s} onClick={() => { setSelectedSize(s); setVQty(1) }}
                          disabled={!avail}
                          className={`px-4 py-2 text-sm border-2 rounded-xl font-semibold transition ${selectedSize === s ? 'border-[var(--primary-color)] bg-[var(--primary-bg)] text-[var(--primary-color)]' : avail ? 'border-stone/20 hover:border-stone/40' : 'opacity-30 cursor-not-allowed border-stone/10'}`}>
                          {s}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              {variantColors.length > 1 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Màu sắc</p>
                  <div className="flex gap-2 flex-wrap">
                    {variantColors.map(c => {
                      const avail = variantModal.variants?.some(v => v.mauSac?.mauSac === c && v.kichCo?.kichCo === selectedSize && (v.tonKho || 0) > cart.filter(cx => cx.maBienThe === v.maBienThe).reduce((a, b) => a + b.soLuong, 0))
                      return (
                        <button key={c} onClick={() => { setSelectedColor(c); setVQty(1) }}
                          disabled={!avail}
                          className={`px-4 py-2 text-sm border-2 rounded-xl font-semibold transition ${selectedColor === c ? 'border-[var(--primary-color)] bg-[var(--primary-bg)] text-[var(--primary-color)]' : avail ? 'border-stone/20 hover:border-stone/40' : 'opacity-30 cursor-not-allowed border-stone/10'}`}>
                          {c}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">Số lượng:</span>
                <div className="flex border-2 border-stone/20 rounded-xl overflow-hidden">
                  <button onClick={() => setVQty(Math.max(1, vQty - 1))} className="px-4 py-2 hover:bg-ivory-100 transition font-bold">-</button>
                  <span className="px-5 py-2 border-x-2 border-stone/20 min-w-[3rem] text-center font-bold">{vQty}</span>
                  <button onClick={() => setVQty(prev => { const v = variantModal.variants?.find(va => va.kichCo?.kichCo === selectedSize && va.mauSac?.mauSac === selectedColor); const max = (v?.tonKho || 0) - cart.filter(c => c.maBienThe === v?.maBienThe).reduce((a, b) => a + b.soLuong, 0); return prev < max ? prev + 1 : prev })} className="px-4 py-2 hover:bg-ivory-100 transition font-bold">+</button>
                </div>
                {(() => {
                  const v = variantModal.variants?.find(va => va.kichCo?.kichCo === selectedSize && va.mauSac?.mauSac === selectedColor)
                  if (!v) return null
                  const avail = (v.tonKho || 0) - cart.filter(c => c.maBienThe === v.maBienThe).reduce((a, b) => a + b.soLuong, 0)
                  return <span className="text-xs text-stone">Kho: {v.tonKho ?? 0} (còn {Math.max(0, avail)})</span>
                })()}
              </div>
            </div>
            <div className="border-t border-stone/10 p-5">
              <button onClick={addToCartFromModal}
                disabled={!selectedSize || !selectedColor || !variantModal.variants?.some(va => va.kichCo?.kichCo === selectedSize && va.mauSac?.mauSac === selectedColor)}
                className="w-full bg-[var(--primary-color)] text-white font-bold py-3 rounded-xl hover:bg-[var(--primary-hover)] transition disabled:opacity-50 flex items-center justify-center gap-2">
                <ShoppingCart className="h-5 w-5" /> Thêm vào giỏ hàng
              </button>
            </div>
          </div>
        </div>
      )}

      {payResult && !printInvoice && !bankInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-ivory rounded-2xl max-w-sm w-full mx-4 shadow-2xl animate-scale-in">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-emerald-deep/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-emerald-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="font-bold text-xl text-ink">Thanh toán thành công</h3>
              <p className="text-sm text-stone mt-1">Đơn hàng #{payResult.maDonHang}</p>
              <p className="text-2xl font-bold text-[var(--primary-color)] mt-3">{VND(payResult.thanhToan)}</p>
            </div>
            <div className="border-t border-stone/10 p-5">
              <p className="text-sm text-center text-stone mb-4">Bạn có muốn in hóa đơn không?</p>
              <div className="flex gap-3">
                <button onClick={closeResult} className="flex-1 px-4 py-2.5 border border-stone/20 rounded-xl text-sm font-semibold hover:bg-ivory-100 transition">Không</button>
                <button onClick={handlePrintInvoice} className="flex-1 px-4 py-2.5 bg-[var(--primary-color)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--primary-hover)] transition">Có</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {payResult && !printInvoice && bankInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-ivory rounded-2xl max-w-sm w-full mx-4 shadow-2xl animate-scale-in">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-[var(--primary-bg)] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-[var(--primary-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
              </div>
              <h3 className="font-bold text-xl text-ink">Quét mã VietQR</h3>
              {qrDataUrl && <img src={qrDataUrl} alt="VietQR" className="mx-auto my-4 w-56 h-56 rounded-xl" />}
              <div className="bg-ivory-100 rounded-xl p-4 text-left space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-stone">Ngân hàng:</span><span className="font-semibold">{bankInfo.bankName}</span></div>
                <div className="flex justify-between"><span className="text-stone">STK:</span><span className="font-semibold">{bankInfo.accountNumber}</span></div>
                <div className="flex justify-between"><span className="text-stone">Chủ TK:</span><span className="font-semibold">{bankInfo.accountName}</span></div>
                <div className="flex justify-between border-t border-stone/10 pt-2 mt-2"><span className="text-stone">Số tiền:</span><span className="font-bold text-[var(--primary-color)]">{VND(payResult.thanhToan)}</span></div>
              </div>
              <p className="text-xs text-stone mt-3">Khách quét mã bằng ứng dụng ngân hàng</p>
            </div>
            <div className="border-t border-stone/10 p-5 flex gap-3">
              <button onClick={closeResult} className="flex-1 px-4 py-2.5 border border-stone/20 rounded-xl text-sm font-semibold hover:bg-ivory-100 transition">Hủy</button>
              <button onClick={handleConfirmQR} className="flex-1 px-4 py-2.5 bg-[var(--primary-color)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--primary-hover)] transition">Đã nhận tiền</button>
            </div>
          </div>
        </div>
      )}

      {printInvoice && printInvoice !== 'loading' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-ivory rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone/10 sticky top-0 bg-ivory z-10">
              <h2 className="font-bold text-lg">Hóa đơn {printInvoice.maHoaDonCode}</h2>
              <button onClick={goToOrders} className="p-2 text-stone hover:text-ink"><X className="h-5 w-5" /></button>
            </div>
            <InvoicePrint data={printInvoice} />
          </div>
        </div>
      )}

      <ConfirmDialog open={typeof confirmAction === 'number'} title="Xóa sản phẩm" message="Bạn chắc chắn muốn xóa sản phẩm này?" confirmText="Xóa" onConfirm={() => { removeItem(confirmAction); setConfirmAction(null) }} onCancel={() => setConfirmAction(null)} />
    </div>
  )
}
