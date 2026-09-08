import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { getActiveCategories } from '../../api/categories'
import { createCustomer, getOrderPrintData, registerOrderPrint, lookupSku } from '../../api/admin'
import { getCustomerDiem, getDiemQuyTac } from '../../api/vi'
import { getAvailableCoupons } from '../../api/coupons'
import { posApi } from '../../components/admin/pos/apiClient'
import OrderTabs from '../../components/admin/pos/OrderTabs'
import ProductGrid from '../../components/admin/pos/ProductGrid'
import CartPanel from '../../components/admin/pos/CartPanel'
import AddProductModal from '../../components/admin/pos/AddProductModal'
import CustomerPickerModal from '../../components/admin/pos/CustomerPickerModal'
import POSToast from '../../components/admin/pos/POSToast'
import CameraScanner from '../../components/CameraScanner'
import ConfirmDialog from '../../components/ConfirmDialog'
import InvoicePrint from '../../components/InvoicePrint'
import { Plus, ShoppingCart, X } from 'lucide-react'
import SafeImg from '../../components/SafeImg'
import { useAuth } from '../../context/AuthContext'

const VND = (n) => { try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) } catch { return n } }

export default function AdminPOS() {
  const navigate = useNavigate()
  const { user } = useAuth()

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

  const [orders, setOrders] = useState([{ id: 1, cart: [], customer: null, coupon: null, couponCode: '', dungDiem: false }])
  const [currentOrderIdx, setCurrentOrderIdx] = useState(0)
  const orderIdCounter = useRef(1)

  const [showAddModal, setShowAddModal] = useState(false)
  const [showCustomerPicker, setShowCustomerPicker] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerDiem, setCustomerDiem] = useState({ soDiem: 0 })
  const [dungDiem, setDungDiem] = useState(false)
  const [coupon, setCoupon] = useState(null)
  const [couponMsg, setCouponMsg] = useState('')
  const [availableCoupons, setAvailableCoupons] = useState([])
  const [diemQuyTac, setDiemQuyTac] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState(5)
  const [tienKhachDua, setTienKhachDua] = useState('')
  const [bankInfo, setBankInfo] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [payResult, setPayResult] = useState(null)
  const [printInvoice, setPrintInvoice] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [variantModal, setVariantModal] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [vQty, setVQty] = useState(1)
  const [variantSizes, setVariantSizes] = useState([])
  const [variantColors, setVariantColors] = useState([])

  useEffect(() => {
    getActiveCategories().then(r => setCategories(Array.isArray(r) ? r : [])).catch(() => {})
    getDiemQuyTac().then(setDiemQuyTac).catch(() => {})
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
    if (!selectedCustomer) return
    getCustomerDiem(selectedCustomer.maNguoiDung).then(setCustomerDiem).catch(() => setCustomerDiem({ soDiem: 0 }))
  }, [selectedCustomer])

  const tiLeDoi = diemQuyTac?.tiLeDoi ?? 1
  const giamToiDaPhanTram = diemQuyTac?.giamToiDaPhanTram ?? 50
  const diemToiThieu = diemQuyTac?.diemToiThieu ?? 10
  const total = cart.reduce((s, c) => s + c.gia * c.soLuong, 0)
  const giaTriSauCoupon = Math.max(0, total - (coupon?.soTienGiam || 0))
  const maxDiemTheoQuyTac = Math.floor(giaTriSauCoupon * giamToiDaPhanTram / 100 / tiLeDoi)
  const maxDiemSuDung = Math.max(0, Math.min(customerDiem.soDiem || 0, maxDiemTheoQuyTac))
  const diemDungDuoc = (customerDiem.soDiem || 0) > 0 && maxDiemSuDung >= diemToiThieu
  const soDiemSuDung = dungDiem && diemDungDuoc ? maxDiemSuDung : 0
  const thanhTien = Math.max(0, total - (coupon?.soTienGiam || 0) - soDiemSuDung * tiLeDoi)
  const soLuongSanPham = cart.reduce((s, c) => s + c.soLuong, 0)
  const tienThua = tienKhachDua !== '' && !isNaN(Number(tienKhachDua)) ? Number(tienKhachDua) - thanhTien : null

  const saveCurrentOrder = (idxOverride) => {
    const idx = idxOverride !== undefined ? idxOverride : currentOrderIdx
    setOrders(prev => prev.map((o, i) => i === idx ? { ...o, cart, customer: selectedCustomer, coupon, dungDiem } : o))
  }

  const switchOrder = (idx) => {
    if (idx === currentOrderIdx) return
    saveCurrentOrder(currentOrderIdx)
    const target = orders[idx]
    setCart(target.cart)
    setSelectedCustomer(target.customer)
    setCoupon(target.coupon)
    setDungDiem(target.dungDiem)
    setCustomerDiem({ soDiem: 0 })
    setAvailableCoupons([])
    setCouponMsg('')
    if (target.customer) {
      getCustomerDiem(target.customer.maNguoiDung).then(setCustomerDiem).catch(() => {})
    }
    setCurrentOrderIdx(idx)
  }

  const addNewOrder = () => {
    saveCurrentOrder()
    orderIdCounter.current += 1
    setOrders(prev => [...prev, { id: orderIdCounter.current, cart: [], customer: null, coupon: null, dungDiem: false }])
    setCart([])
    setSelectedCustomer(null)
    setCoupon(null)
    setCouponMsg('')
    setDungDiem(false)
    setCustomerDiem({ soDiem: 0 })
    setAvailableCoupons([])
    setCurrentOrderIdx(orders.length)
  }

  const removeOrder = (idx) => {
    if (orders.length <= 1) return
    const newOrders = orders.filter((_, i) => i !== idx)
    setOrders(newOrders)
    if (idx === currentOrderIdx) {
      const newIdx = Math.min(idx, newOrders.length - 1)
      const target = newOrders[newIdx]
      setCart(target.cart)
      setSelectedCustomer(target.customer)
      setCoupon(target.coupon)
      setDungDiem(target.dungDiem)
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
    setCart(prev => prev.map((c, i) => {
      if (i !== idx) return c
      const newQty = Math.max(1, c.soLuong + delta)
      if (delta > 0 && newQty > c.tonKho) {
        setMsg({ type: 'error', text: `Chỉ còn ${c.tonKho} sản phẩm trong kho` })
        return c
      }
      return { ...c, soLuong: newQty }
    }))
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
      if (res.hopLe) { setCoupon(res); setCouponCodeState(code) }
      else { setCouponMsg(res.lyDoTuChoi || 'Mã giảm giá không hợp lệ') }
    } catch (err) {
      setCouponMsg(err.response?.data?.message || 'Mã giảm giá không hợp lệ')
    }
  }

  const [couponCodeState, setCouponCodeState] = useState('')

  const handleCheckout = async () => {
    setConfirmAction(null)
    if (cart.length === 0) return
    setPlacing(true)
    try {
      if (paymentMethod === 6) {
        const totalAmount = Math.max(0, total - (coupon?.soTienGiam || 0))
        const vqRes = await posApi.vietQRPreview(totalAmount)
        setQrDataUrl(vqRes.qrUrl)
        setBankInfo(vqRes)
        setPayResult({ thanhToan: totalAmount })
      } else {
        const res = await posApi.createOrder({
          items: cart.map(c => ({ maBienThe: c.maBienThe, soLuong: c.soLuong })),
          maNguoiDung: selectedCustomer?.maNguoiDung || undefined,
          maCode: coupon?.maCode || undefined,
          phuongThucThanhToan: 5,
          soDiemSuDung: soDiemSuDung > 0 ? soDiemSuDung : undefined,
        })
        if (!res || !res.maDonHang) throw new Error('Phản hồi không hợp lệ')
        const newOrders = orders.filter((_, i) => i !== currentOrderIdx)
        if (newOrders.length === 0) newOrders.push({ id: ++orderIdCounter.current, cart: [], customer: null, coupon: null, dungDiem: false })
        setOrders(newOrders)
        setCart(newOrders[0]?.cart || [])
        setSelectedCustomer(newOrders[0]?.customer || null)
        setCoupon(newOrders[0]?.coupon || null)
        setDungDiem(newOrders[0]?.dungDiem || false)
        setCurrentOrderIdx(0)
        setPayResult(res)
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || err.message || 'Tạo đơn thất bại' })
    } finally { setPlacing(false) }
  }

  const handleConfirmQR = async () => {
    if (cart.length === 0) return
    setPlacing(true)
    try {
      const res = await posApi.createOrder({
        items: cart.map(c => ({ maBienThe: c.maBienThe, soLuong: c.soLuong })),
        maNguoiDung: selectedCustomer?.maNguoiDung || undefined,
        maCode: coupon?.maCode || undefined,
        phuongThucThanhToan: 6,
        soDiemSuDung: soDiemSuDung > 0 ? soDiemSuDung : undefined,
      })
      if (!res || !res.maDonHang) throw new Error('Phản hồi không hợp lệ')
      const newOrders = orders.filter((_, i) => i !== currentOrderIdx)
      if (newOrders.length === 0) newOrders.push({ id: ++orderIdCounter.current, cart: [], customer: null, coupon: null, dungDiem: false })
      setOrders(newOrders)
      setCart(newOrders[0]?.cart || [])
      setSelectedCustomer(newOrders[0]?.customer || null)
      setCoupon(newOrders[0]?.coupon || null)
      setDungDiem(newOrders[0]?.dungDiem || false)
      setCurrentOrderIdx(0)
      setBankInfo(null)
      setQrDataUrl(null)
      setPayResult(res)
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || err.message || 'Xác nhận thất bại' })
    } finally { setPlacing(false) }
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
    <div className="flex gap-4 h-[calc(100vh-6rem)]">
      {msg && <POSToast message={msg.text} type={msg.type} onClose={() => setMsg(null)} />}

      <div className="flex-1 flex flex-col bg-ivory rounded-2xl border border-stone/10 overflow-hidden">
        <div className="px-5 py-4 border-b border-stone/10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-ink">Bán hàng</h1>
              <p className="text-xs text-stone mt-0.5">Người bán: <span className="font-semibold text-ink-soft">{user?.hoTen || 'Admin'}</span></p>
            </div>
            <button onClick={addNewOrder}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary-color)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--primary-hover)] transition shadow-sm">
              <Plus className="h-4 w-4" /> Tạo đơn hàng
            </button>
          </div>
          <OrderTabs orders={orders} currentIdx={currentOrderIdx} onSwitch={switchOrder} onAdd={addNewOrder} onRemove={removeOrder} />
        </div>

        <div className="flex-1 overflow-hidden p-4">
          <ProductGrid products={products} loading={loading} cart={cart}
            onAdd={addToCart} onQtyChange={updateQtyModal}
            onScanCamera={() => setCameraOpen(true)} onSearch={setSearch} search={search}
            onCategoryChange={setCategoryId} categories={categories} categoryId={categoryId} />
        </div>
      </div>

      <CartPanel cart={cart} customer={selectedCustomer} coupon={coupon} couponMsg={couponMsg}
        customerDiem={customerDiem} dungDiem={dungDiem}
        onRemoveItem={removeItem} onUpdateQty={updateQtyCart} onClearCart={clearCart}
        onSelectCustomer={(c) => { setSelectedCustomer(c); setShowCustomerPicker(false) }}
        onClearCustomer={() => { setSelectedCustomer(null); setCustomerDiem({ soDiem: 0 }); setDungDiem(false); setCoupon(null); setCouponMsg('') }}
        onApplyCoupon={handleApplyCoupon} onClearCoupon={() => { setCoupon(null); setCouponMsg('') }}
        onToggleDiem={() => setDungDiem(v => !v)}
        paymentMethod={paymentMethod} onPaymentMethodChange={(v) => { setPaymentMethod(v); setTienKhachDua('') }}
        tienKhachDua={tienKhachDua} onTienKhachDuaChange={setTienKhachDua} tienThua={tienThua}
        onCheckout={() => setConfirmAction('place')} placing={placing}
        thanhTien={thanhTien} total={total} soLuongSanPham={soLuongSanPham} diemQuyTac={diemQuyTac}
        onOpenCustomerPicker={() => setShowCustomerPicker(true)}
        availableCoupons={availableCoupons} onOpenCouponDropdown={() => {}} />

      <AddProductModal open={showAddModal} onClose={() => setShowAddModal(false)}
        variants={allVariants} colors={colors} sizes={sizes} cart={cart}
        onAdd={addToCart} onQtyChange={updateQtyModal} />

      <CustomerPickerModal open={showCustomerPicker} onClose={() => setShowCustomerPicker(false)}
        onSelect={(c) => { setSelectedCustomer(c); getCustomerDiem(c.maNguoiDung).then(setCustomerDiem).catch(() => {}) }} />

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
      <ConfirmDialog open={confirmAction === 'place'} title="Xác nhận thanh toán" message="Tạo đơn bán hàng với giỏ hiện tại?" confirmText="Thanh toán" variant="gold" onConfirm={handleCheckout} onCancel={() => setConfirmAction(null)} />
    </div>
  )
}
