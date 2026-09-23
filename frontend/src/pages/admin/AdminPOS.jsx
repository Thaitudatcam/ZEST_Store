import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { getActiveCategories } from '../../api/categories'
import { createCustomer, getOrderPrintData, registerOrderPrint, lookupSku } from '../../api/admin'
import { posApi } from '../../components/admin/pos/apiClient'
import { createDraft, appendDraft, removeDraft, sameQuantities } from '../../components/admin/pos/drafts'
import OrderTabs from '../../components/admin/pos/OrderTabs'
import ProductGrid from '../../components/admin/pos/ProductGrid'
import CartPanel from '../../components/admin/pos/CartPanel'
import AddProductModal from '../../components/admin/pos/AddProductModal'
import CustomerPickerModal from '../../components/admin/pos/CustomerPickerModal'
import PaymentModal from '../../components/admin/pos/PaymentModal'
import POSConfirmDialog from '../../components/admin/pos/POSConfirmDialog'
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
  const draftStorageKey = 'posDrafts:' + (user?.maNguoiDung || user?.email || 'staff')
  const initialDrafts = useRef(null)
  if (!initialDrafts.current) {
    try {
      const saved = JSON.parse(sessionStorage.getItem(draftStorageKey) || 'null')
      initialDrafts.current = Array.isArray(saved) && saved.length > 0
        ? saved.slice(0, 10).filter(o => o.checkoutKey && Array.isArray(o.cart)) : [createDraft(1)]
    } catch { initialDrafts.current = [createDraft(1)] }
    if (!initialDrafts.current.length) initialDrafts.current = [createDraft(1)]
  }
  const initial = initialDrafts.current[0]
  const pendingCheckout = useRef(false)
  const pendingStock = useRef(false)
  const stockRequest = useRef(0)
  const lastActivity = useRef(Date.now())
  const [stockBusy, setStockBusy] = useState(false)
  const [stockReady, setStockReady] = useState(initial.cart.length === 0)
  const [availableStock, setAvailableStock] = useState({})
  const [products, setProducts] = useState([])
  const [allVariants, setAllVariants] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState(initial.cart)
  const [placing, setPlacing] = useState(false)
  const [msg, setMsg] = useState(null)
  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState('')
  const [colors, setColors] = useState([])
  const [sizes, setSizes] = useState([])

  const [orders, setOrders] = useState(initialDrafts.current)
  const [currentOrderIdx, setCurrentOrderIdx] = useState(0)

  const [showAddModal, setShowAddModal] = useState(false)
  const [showCustomerPicker, setShowCustomerPicker] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(initial.customer)
  const [coupon, setCoupon] = useState(initial.coupon)
  const [couponAuto, setCouponAuto] = useState(Boolean(initial.couponAuto))
  const couponRequest = useRef(0)
  const [couponChecking, setCouponChecking] = useState(false)
  const [couponMsg, setCouponMsg] = useState('')
  const [couponInput, setCouponInput] = useState('')
  const [availableCoupons, setAvailableCoupons] = useState([])
  const [showCouponPicker, setShowCouponPicker] = useState(false)
  const [bankInfo, setBankInfo] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [loaiDon] = useState('TAI_QUAY')
  const [payResult, setPayResult] = useState(null)
  const [printInvoice, setPrintInvoice] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [customerPaid, setCustomerPaid] = useState(initial.customerPaid || 0)
  const [showConfirmOrder, setShowConfirmOrder] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState(initial.paymentMethod || 5)
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
        giaGoc: v.giaGoc,
        phanTramGiamGia: v.phanTramGiamGia,
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

  const phiVanChuyen = 0
  const total = cart.reduce((s, c) => s + c.gia * c.soLuong, 0)
  const thanhTien = Math.max(0, total - (coupon?.soTienGiam || 0))
  const soLuongSanPham = cart.reduce((s, c) => s + c.soLuong, 0)

  const snapshotOrders = () => orders.map((o, i) => i === currentOrderIdx
    ? { ...o, cart, customer: selectedCustomer, coupon, couponAuto, loaiDon: 'TAI_QUAY', customerPaid, paymentMethod }
    : o)

  const liveDrafts = useRef([])
  liveDrafts.current = snapshotOrders()
  const activeDraftKey = orders[currentOrderIdx].checkoutKey
  const refreshStock = useCallback(async () => {
    const ids = [...new Set(allVariants.map(v => v.maBienThe).filter(Boolean))]
    if (ids.length) setAvailableStock(await posApi.availability(ids))
  }, [allVariants])

  useEffect(() => {
    let active = true
    const requestId = ++stockRequest.current
    const draft = liveDrafts.current.find(d => d.checkoutKey === activeDraftKey)
    if (!draft?.cart.length) { setStockReady(true); return }
    setStockReady(false)
    posApi.getDraft(activeDraftKey).then(result => {
      if (active && requestId === stockRequest.current) setStockReady(sameQuantities(draft.cart, result.items || []))
    }).catch(() => { if (active && requestId === stockRequest.current) setStockReady(false) })
    return () => { active = false }
  }, [activeDraftKey])

  useEffect(() => {
    let active = true
    let checking = false
    const check = async () => {
      if (checking || document.visibilityState !== 'visible' || pendingStock.current || pendingCheckout.current) return
      checking = true
      const requestId = stockRequest.current
      try {
        if (Date.now() - lastActivity.current < 25 * 60 * 1000) {
          for (const draft of liveDrafts.current.filter(d => d.cart.length)) {
            try { await posApi.heartbeatDraft(draft.checkoutKey) }
            catch { if (active && requestId === stockRequest.current && draft.checkoutKey === activeDraftKey) setStockReady(false) }
          }
        } else if (active) setStockReady(false)
        if (active) await refreshStock()
      } catch { /* Checkout always rechecks authoritative stock. */ }
      finally { checking = false }
    }
    check()
    const timer = setInterval(check, 60000)
    window.addEventListener('focus', check)
    return () => { active = false; clearInterval(timer); window.removeEventListener('focus', check) }
  }, [activeDraftKey, refreshStock])

  const commitCart = async (nextCart) => {
    if (pendingStock.current || pendingCheckout.current) return false
    pendingStock.current = true
    ++stockRequest.current
    setStockBusy(true)
    lastActivity.current = Date.now()
    try {
      await posApi.replaceDraft(activeDraftKey, nextCart)
      setCart(nextCart)
      setStockReady(true)
      await refreshStock().catch(() => {})
      return true
    } catch (err) {
      setStockReady(false)
      setMsg({ type: 'error', text: err.response?.data?.message || 'Không cập nhật được giữ hàng. Vui lòng thử lại.' })
      return false
    } finally { pendingStock.current = false; setStockBusy(false) }
  }

  useEffect(() => {
    sessionStorage.setItem(draftStorageKey, JSON.stringify(snapshotOrders()))
  }, [orders, currentOrderIdx, cart, selectedCustomer, coupon, couponAuto, loaiDon, customerPaid, paymentMethod])

  const loadDraft = (draft) => {
    ++stockRequest.current
    lastActivity.current = Date.now()
    setStockReady(draft.cart.length === 0)
    setCart(draft.cart)
    setSelectedCustomer(draft.customer)
    setCoupon(draft.coupon)
    setCouponAuto(Boolean(draft.couponAuto))
    setCouponInput(draft.coupon?.maCode || '')
    setCustomerPaid(draft.customerPaid || 0)
    setPaymentMethod(draft.paymentMethod || 5)
    setAvailableCoupons([])
    setCouponMsg('')
    setBankInfo(null)
    setQrDataUrl(null)
  }

  const switchOrder = (idx) => {
    if (idx === currentOrderIdx || pendingCheckout.current || pendingStock.current) return
    const saved = snapshotOrders()
    setOrders(saved)
    loadDraft(saved[idx])
    setCurrentOrderIdx(idx)
  }

  const addNewOrder = () => {
    if (pendingCheckout.current || pendingStock.current) return
    const next = appendDraft(snapshotOrders())
    if (next.index < 0) {
      setMsg({ type: 'error', text: 'Chỉ được mở tối đa 10 hóa đơn cùng lúc. Hãy thanh toán hoặc đóng một hóa đơn.' })
      return
    }
    setOrders(next.orders)
    loadDraft(next.orders[next.index])
    setCurrentOrderIdx(next.index)
  }

  const removeOrder = async (idx) => {
    if (pendingCheckout.current || pendingStock.current) return
    pendingStock.current = true
    setStockBusy(true)
    try {
      await posApi.clearDraft(orders[idx].checkoutKey)
      const next = removeDraft(snapshotOrders(), currentOrderIdx, idx)
      setOrders(next.orders)
      if (idx === currentOrderIdx) loadDraft(next.orders[next.index])
      setCurrentOrderIdx(next.index)
      await refreshStock().catch(() => {})
    } catch (err) { setMsg({ type: 'error', text: err.response?.data?.message || 'Chưa giải phóng được hàng; vui lòng thử lại' }) }
    finally { pendingStock.current = false; setStockBusy(false) }
  }

  // Chuẩn hóa giá KM đợt: grid/scan trả gia đã trừ + giaGoc,
  // modal chi tiết trả gia gốc + % -> tự trừ ở đây để giỏ luôn đúng
  const effPrice = (variant) => {
    const pct = Number(variant.phanTramGiamGia) || 0
    if (variant.giaGoc != null) return { gia: Number(variant.gia) || 0, giaGoc: Number(variant.giaGoc), pct }
    const base = Number(variant.gia) || 0
    if (pct > 0) return { gia: Math.max(0, Math.round(base * (1 - pct / 100))), giaGoc: base, pct }
    return { gia: base, giaGoc: undefined, pct: 0 }
  }

  const addToCart = async (variant, quantity = 1) => {
    if (!Number.isInteger(quantity) || quantity < 1) return false
    const price = effPrice(variant)
    const nextCart = (() => {
      const prev = cart
      const existing = prev.findIndex(c => c.maBienThe === variant.maBienThe)
      if (existing >= 0) {
        const next = [...prev]
        next[existing] = { ...next[existing], soLuong: next[existing].soLuong + quantity, gia: price.gia, giaGoc: price.giaGoc, phanTramGiamGia: price.pct || undefined }
        return next
      }
      return [...prev, {
        maBienThe: variant.maBienThe,
        maSanPham: variant.maSanPham || variant.sanPham?.maSanPham,
        tenSanPham: variant.tenSanPham,
        kichCo: variant.kichCo || '',
        mauSac: variant.mauSac || '',
        gia: price.gia,
        giaGoc: price.giaGoc,
        phanTramGiamGia: price.pct || undefined,
        soLuong: quantity,
        tonKho: variant.tonKho || 0,
        urlAnh: variant.urlAnhDaiDien || variant.urlAnh || '',
        maSanPhamCode: variant.sku || '',
        sku: variant.sku || '',
      }]
    })()
    if (!await commitCart(nextCart)) return false
    setMsg({ type: 'success', text: `Đã thêm ${variant.tenSanPham} (${variant.mauSac || ''} ${variant.kichCo || ''}) vào giỏ hàng` })
    return true
  }

  const updateQtyCart = (idx, delta) => {
    const updated = cart.map((c, i) => {
        if (i !== idx) return c
        const newQty = c.soLuong + delta
        if (newQty <= 0) return null
        return { ...c, soLuong: newQty }
      }).filter(Boolean)
    return commitCart(updated)
  }

  const updateQtyModal = (variant, delta) => {
    const idx = cart.findIndex(c => c.maBienThe === variant.maBienThe)
    if (idx >= 0) {
      updateQtyCart(idx, delta)
    } else if (delta > 0) {
      addToCart(variant)
    }
  }

  const removeItem = (idx) => commitCart(cart.filter((_, i) => i !== idx))
  const clearCart = () => commitCart([])

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
    const requestId = ++couponRequest.current
    setCouponChecking(true)
    setCoupon(null)
    setCouponMsg('')
    try {
      const res = await posApi.validateCoupon({
        maCode: code.trim(),
        maSanPhamIds: [...new Set(cart.map(c => c.maSanPham).filter(Boolean))],
        items: cart.filter(c => c.maSanPham).map(c => ({ maSanPham: c.maSanPham, thanhTien: c.gia * c.soLuong })),
        tongTien: total,
        maNguoiDung: selectedCustomer?.maNguoiDung || undefined,
      })
      if (requestId !== couponRequest.current) return
      if (res.hopLe) { setCoupon(res); setCouponAuto(false); setCouponInput(code) }
      else { setCouponMsg(res.lyDoTuChoi || 'Mã giảm giá không hợp lệ') }
    } catch (err) {
      if (requestId === couponRequest.current) setCouponMsg(err.response?.data?.message || 'Mã giảm giá không hợp lệ')
    } finally {
      if (requestId === couponRequest.current) setCouponChecking(false)
    }
  }

  useEffect(() => {
    let active = true
    const requestId = ++couponRequest.current
    const selectedCode = coupon?.maCode
    setBankInfo(null)
    setQrDataUrl(null)
    setCoupon(null)
    setCouponMsg('')
    setCouponChecking(false)
    if (!cart.length) {
      setCouponAuto(true)
      setCouponInput('')
      setAvailableCoupons([])
      return
    }
    const couponPayload = {
      tongTien: total,
      maSanPhamIds: [...new Set(cart.map(c => c.maSanPham).filter(Boolean))],
      items: cart.filter(c => c.maSanPham).map(c => ({ maSanPham: c.maSanPham, thanhTien: c.gia * c.soLuong })),
      maNguoiDung: selectedCustomer?.maNguoiDung || undefined,
    }
    // Preserve a coupon explicitly chosen by staff. Auto-selected coupons are
    // recalculated whenever the cart or customer changes.
    if (selectedCode && !couponAuto) {
      setCouponChecking(true)
      posApi.validateCoupon({ ...couponPayload, maCode: selectedCode }).then(res => {
        if (!active || requestId !== couponRequest.current) return
        if (res.hopLe) setCoupon(res)
        else setCouponMsg(res.lyDoTuChoi || 'Mã giảm giá không còn phù hợp với hóa đơn')
      }).catch(() => {
        if (active && requestId === couponRequest.current) setCouponMsg('Vui lòng áp dụng lại mã giảm giá')
      }).finally(() => {
        if (active && requestId === couponRequest.current) setCouponChecking(false)
      })
    } else {
      setCouponChecking(true)
      posApi.getBestCoupon(couponPayload).then(res => {
        if (!active || requestId !== couponRequest.current) return
        if (res.found) {
          setCoupon(res)
          setCouponAuto(true)
          setCouponInput(res.maCode)
          setCouponMsg(`Đã tự động áp dụng mã tốt nhất, tiết kiệm ${VND(res.soTienGiam)}`)
        } else {
          setCoupon(null)
          setCouponAuto(true)
          setCouponInput('')
          setCouponMsg('')
        }
      }).catch(() => {
        if (active && requestId === couponRequest.current) setCouponMsg('Không thể tự động tìm mã tốt nhất')
      }).finally(() => {
        if (active && requestId === couponRequest.current) setCouponChecking(false)
      })
    }
    posApi.getAvailableCoupons(total, [...new Set(cart.map(c => c.maSanPham).filter(Boolean))], selectedCustomer?.maNguoiDung)
      .then(list => { if (active) setAvailableCoupons(list.filter(c => c.kieuGiamGia !== 3)) })
      .catch(() => { if (active) setAvailableCoupons([]) })
    return () => { active = false }
  }, [cart, selectedCustomer, currentOrderIdx])

  useEffect(() => {
    if (!showCouponPicker) return
    const handler = (e) => {
      if (!e.target.closest('[data-coupon-picker]')) setShowCouponPicker(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showCouponPicker])

  const resetOrderState = () => {
    const next = removeDraft(snapshotOrders(), currentOrderIdx, currentOrderIdx)
    sessionStorage.setItem(draftStorageKey, JSON.stringify(next.orders))
    setOrders(next.orders)
    loadDraft(next.orders[next.index])
    setCurrentOrderIdx(next.index)
    setShowConfirmOrder(false)
  }

  const checkoutPayload = (method) => {
    if (pendingStock.current || !stockReady) throw new Error('Vui lòng giữ đủ hàng cho hóa đơn trước khi thanh toán')
    if (couponChecking) throw new Error('Vui lòng chờ kiểm tra mã giảm giá')
    const name = (selectedCustomer?.hoTen || '').trim()
    const phone = (selectedCustomer?.soDienThoai || '').trim()
    return {
      checkoutKey: orders[currentOrderIdx].checkoutKey,
      items: cart.map(c => ({ maBienThe: c.maBienThe, soLuong: c.soLuong })),
      maNguoiDung: selectedCustomer?.maNguoiDung || undefined,
      maCode: coupon?.maCode || undefined, phuongThucThanhToan: method,
      giaoHang: false, tenKhachHang: name || undefined, sdtKhachHang: phone || undefined,
      diaChiGiaoHang: undefined,
      toDistrictId: undefined,
      toWardCode: undefined,
      mienPhiVanChuyen: false, expectedTotal: thanhTien,
    }
  }

  const handleCheckout = async (paymentMethod = 5) => {
    setShowPaymentModal(false)
    if (cart.length === 0 || pendingCheckout.current) return
    pendingCheckout.current = true
    setPlacing(true)
    try {
      if (paymentMethod === 6) {
        checkoutPayload(6)
        const totalAmount = thanhTien
        const vqRes = await posApi.vietQRPreview(totalAmount, activeDraftKey)
        setQrDataUrl(vqRes.qrUrl)
        setBankInfo(vqRes)
      } else {
        const res = await posApi.createOrder(checkoutPayload(5))
        if (!res || !res.maDonHang) throw new Error('Phản hồi không hợp lệ')
        resetOrderState()
        setPayResult(res)
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || Object.values(err.response?.data?.errors || {}).join(', ') || err.message || 'Tạo đơn thất bại' })
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
      const res = await posApi.createOrder(checkoutPayload(6))
      if (!res || !res.maDonHang) throw new Error('Phản hồi không hợp lệ')
      resetOrderState()
      setBankInfo(null)
      setQrDataUrl(null)
      setPayResult(res)
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || Object.values(err.response?.data?.errors || {}).join(', ') || err.message || 'Xác nhận thất bại' })
    } finally {
      pendingCheckout.current = false
      setPlacing(false)
    }
  }

  const handleTransferTabActive = async () => {
    if (cart.length > 0) {
      try {
        checkoutPayload(6)
        const totalAmount = thanhTien
        const vqRes = await posApi.vietQRPreview(totalAmount, activeDraftKey)
        setQrDataUrl(vqRes.qrUrl)
        setBankInfo(vqRes)
      } catch (err) {
        setMsg({ type: 'error', text: err.response?.data?.message || Object.values(err.response?.data?.errors || {}).join(', ') || err.message || 'Không thể tạo mã QR' })
      }
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

  const addToCartFromModal = async () => {
    if (!variantModal) return
    const variant = variantModal.variants?.find(v => v.kichCo?.kichCo === selectedSize && v.mauSac?.mauSac === selectedColor)
    if (!variant) return
    const added = await addToCart({
      ...variant,
      maSanPham: variant.maSanPham || variantModal.product?.maSanPham,
      tenSanPham: variantModal.product?.tenSanPham || '',
      urlAnhDaiDien: variant.urlAnh || variantModal.product?.urlAnhDaiDien,
      gia: variant.gia || 0,
      tonKho: variant.tonKho || 0,
      mauSac: variant.mauSac?.mauSac || '',
      kichCo: variant.kichCo?.kichCo || '',
      sku: variant.sku || '',
    }, Number(vQty))
    if (added) setVariantModal(null)
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
          <div className="mt-3 flex items-center gap-3 text-sm" role="status" aria-live="polite">
            <span className={stockReady ? 'text-emerald-deep' : 'text-bordeaux'}>
              {stockBusy ? 'Đang cập nhật số lượng giữ hàng…' : stockReady
                ? `Đã giữ ${soLuongSanPham} sản phẩm cho hóa đơn này`
                : 'Chưa giữ đủ hàng hoặc giữ hàng đã hết hạn'}
            </span>
            {!stockReady && !stockBusy && cart.length > 0 && <button type="button" onClick={() => commitCart(cart)}
              className="font-semibold underline text-[var(--primary-color)]">Kiểm tra và giữ lại hàng</button>}
            <span className="text-xs text-stone">Giữ hàng hết hạn sau 30 phút không được gia hạn.</span>
          </div>
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
                    <button onClick={() => { setSelectedCustomer(null); setCoupon(null); setCouponAuto(true); setCouponInput(''); setCouponMsg('') }}
                      className="text-xs text-bordeaux hover:underline font-medium">Gỡ khách</button>
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
                <span className="text-xs text-stone">Tại quầy</span>
              </div>
              <div className="space-y-3">
                {/* Coupon */}
                <div className="relative" data-coupon-picker>
                  <label className="text-xs font-semibold text-stone mb-1.5 block">Mã phiếu giảm giá</label>
                  <div className="flex items-center gap-2">
                    <input value={couponInput} onChange={e => setCouponInput(e.target.value)}
                      placeholder="Nhập mã (Enter để áp dụng)"
                      disabled={cart.length === 0}
                      className="flex-1 border border-stone/20 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] disabled:opacity-50"
                      onKeyDown={e => { if (e.key === 'Enter') { handleApplyCoupon(e.target.value); setShowCouponPicker(false) } }} />
                    <button onClick={() => setShowCouponPicker(v => !v)}
                      disabled={cart.length === 0}
                      className="text-xs font-semibold text-white bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] px-3 py-2 rounded-lg whitespace-nowrap disabled:opacity-40 transition">Chọn mã</button>
                    <span className="text-xs text-stone whitespace-nowrap">Giá trị</span>
                    <span className="text-sm font-bold text-[var(--primary-color)] w-20 text-right">{coupon ? VND(coupon.soTienGiam) : '0 đ'}</span>
                  </div>
                  {couponMsg && <p className="text-[11px] text-bordeaux mt-1">{couponMsg}</p>}

                  {/* Coupon picker dropdown */}
                  {showCouponPicker && cart.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-stone/20 rounded-xl shadow-lg max-h-52 overflow-auto">
                      <div className="flex items-center justify-between px-3 py-2 border-b border-stone/10">
                        <span className="text-xs font-bold text-ink">Mã giảm giá khả dụng</span>
                        <button onClick={() => setShowCouponPicker(false)} className="text-stone hover:text-ink"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                      </div>
                      {availableCoupons.length === 0 ? (
                        <p className="px-3 py-4 text-xs text-stone text-center">Không có mã giảm giá phù hợp</p>
                      ) : (
                        availableCoupons.map((c, i) => (
                          <button key={i} onClick={() => {
                            handleApplyCoupon(c.maCode)
                            setShowCouponPicker(false)
                          }} className="w-full text-left px-3 py-2.5 hover:bg-ivory-100 transition flex items-center justify-between border-b border-stone/5 last:border-0">
                            <div>
                              <p className="text-xs font-bold text-ink">{c.maCode}</p>
                              <p className="text-[11px] text-stone mt-0.5">{c.kieuGiamGia === 1 ? `Giảm ${c.giaTriGiam || 10}%` : `Giảm ${VND(c.soTienGiam)}`}</p>
                            </div>
                            <span className="text-xs font-bold text-[var(--primary-color)]">{VND(c.soTienGiam)}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Applied coupon badge */}
                {coupon && (
                  <div className="flex items-start gap-2 bg-emerald-deep/5 border border-emerald-deep/20 rounded-lg px-3 py-2">
                    <svg className="h-4 w-4 text-emerald-deep mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-emerald-deep">Áp dụng thành công phiếu giảm giá {coupon.maCode} ({coupon.kieuGiamGia === 1 ? `${coupon.giaTriGiam || 10}%` : VND(coupon.soTienGiam)})</p>
                      <p className="text-[11px] text-emerald-deep/70 mt-0.5">Giảm {VND(coupon.soTienGiam)}</p>
                      {couponAuto && <p className="text-[11px] text-emerald-deep/70 mt-0.5">Hệ thống đã tự chọn mã có lợi nhất</p>}
                    </div>
                  </div>
                )}

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
                  <div className="flex justify-between items-center pt-2 border-t border-stone/10">
                    <span className="font-bold text-ink">Tổng số tiền</span>
                    <span className="text-xl font-bold text-[var(--primary-color)]">{VND(thanhTien)}</span>
                  </div>
                </div>

                {/* Customer Payment */}
                <div className="pt-2 border-t border-stone/10">
                  <button onClick={() => setShowPaymentModal(true)}
                    className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-ivory-100 transition group">
                    <span className="text-xs font-semibold text-stone">Khách thanh toán</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-ink">{customerPaid > 0 ? VND(customerPaid) : '0 đ'}</span>
                      <svg className="h-4 w-4 text-stone group-hover:text-[var(--primary-color)] transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                    </div>
                  </button>
                </div>

                {/* Change */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone">Tiền thừa trả khách</span>
                  <span className={`font-bold ${customerPaid - thanhTien >= 0 ? 'text-emerald-deep' : 'text-bordeaux'}`}>
                    {VND(Math.max(0, customerPaid - thanhTien))}
                  </span>
                </div>

                {/* Checkout */}
                <button onClick={() => {
                  try {
                    checkoutPayload(paymentMethod)
                    if (customerPaid < thanhTien) { setShowPaymentModal(true); return }
                    setShowConfirmOrder(true)
                  } catch (err) { setMsg({ type: 'error', text: err.message }) }
                }} disabled={cart.length === 0 || placing || stockBusy || !stockReady}
                  className="w-full py-3 bg-[var(--primary-color)] text-white font-bold rounded-xl hover:bg-[var(--primary-hover)] transition disabled:opacity-40 text-sm tracking-wide mt-2">
                  {placing ? 'Đang xử lý...' : 'XÁC NHẬN THANH TOÁN'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddProductModal open={showAddModal} onClose={() => setShowAddModal(false)}
        variants={allVariants.map(v => ({ ...v, tonKho: availableStock[v.maBienThe] ?? v.tonKhoKhaDung ?? v.tonKho }))} colors={colors} sizes={sizes} cart={cart}
        onAdd={addToCart} onQtyChange={updateQtyModal} />

      <CustomerPickerModal open={showCustomerPicker} onClose={() => setShowCustomerPicker(false)}
        onSelect={async (c) => {
          setSelectedCustomer(c)
        }} />

      <PaymentModal open={showPaymentModal} onClose={() => setShowPaymentModal(false)}
        thanhTien={thanhTien} placing={placing} bankInfo={bankInfo}
        onConfirmPaid={(amount) => {
          setCustomerPaid(amount)
          setPaymentMethod(5)
          setShowConfirmOrder(true)
        }}
        onConfirmTransfer={(amount) => {
          setCustomerPaid(amount)
          setPaymentMethod(6)
          setShowConfirmOrder(true)
        }}
        onTransferTabActive={handleTransferTabActive} />

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
                  if (!v) return null
                  const pct = Number(v.phanTramGiamGia) || 0
                  const price = pct > 0 ? Math.max(0, Math.round(Number(v.gia) * (1 - pct / 100))) : v.gia
                  return (
                    <span className="flex items-center gap-2 mt-1">
                      {pct > 0 && <span className="text-[10px] font-bold text-white bg-bordeaux rounded-full px-1.5 py-0.5">-{pct}%</span>}
                      <p className="text-[var(--primary-color)] font-bold text-lg">{VND(price)}</p>
                      {pct > 0 && <p className="text-sm text-stone line-through">{VND(v.gia)}</p>}
                    </span>
                  )
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

      <POSConfirmDialog
        open={showConfirmOrder}
        loaiDon={loaiDon}
        tienHang={total}
        giamGia={coupon?.soTienGiam || 0}
        tongPhaiTra={thanhTien}
        hinhThucThanhToan={paymentMethod === 6 ? 'Chuyển khoản' : 'Tiền mặt'}
        khachThanhToan={customerPaid || thanhTien}
        loading={placing}
        onConfirm={() => {
          setShowConfirmOrder(false)
          if (paymentMethod === 6) {
            handleConfirmQR()
          } else {
            handleCheckout(5)
          }
        }}
        onCancel={() => setShowConfirmOrder(false)}
      />
    </div>
  )
}
