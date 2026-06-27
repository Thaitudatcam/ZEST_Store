import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getCart } from '../api/cart'
import { getAddresses, addAddress } from '../api/users'
import { placeOrder } from '../api/orders'
import { createVnPayPayment, createMomoPayment, createZaloPayPayment, createVietQrPayment, confirmVietQrPayment } from '../api/payment'
import { getProvinces, getDistricts, getWards, getServices, calculateShippingFee } from '../api/ghn'
import LoadingSpinner from '../components/LoadingSpinner'
import { VND } from '../components/ProductCard'
import { MapPin, CreditCard, Tag, ArrowLeft, Loader, Check, X, QrCode, Truck, Banknote, Smartphone, Landmark, ChevronRight, Plus } from 'lucide-react'
import api from '../api/axios'
import SafeImg from '../components/SafeImg'

const STEPS = [
  { key: 'delivery', label: 'Địa chỉ' },
  { key: 'payment', label: 'Thanh toán' },
  { key: 'review', label: 'Xác nhận' },
]

const PAYMENT_CARDS = [
  { value: 1, label: 'COD', desc: 'Thanh toán khi nhận hàng', icon: Truck, badge: null },
  { value: 2, label: 'VNPay', desc: 'Cổng thanh toán VNPay', icon: CreditCard, badge: 'Phổ biến' },
  { value: 3, label: 'MoMo', desc: 'Thanh toán qua MoMo (ATM / Visa / Master)', icon: Smartphone, badge: null },
  { value: 4, label: 'ZaloPay', desc: 'Ví điện tử ZaloPay', icon: Smartphone, badge: null },
  { value: 6, label: 'VietQR', desc: 'Quét mã QR ngân hàng', icon: QrCode, badge: null },
]

const flexibleMatch = (name, list, nameKey, extensionKey) => {
  if (!name || !list) return null
  const lower = name.toLowerCase().trim()
  return list.find(item => {
    const main = item[nameKey]?.toLowerCase()
    if (!main) return false
    if (main === lower || main.includes(lower) || lower.includes(main)) return true
    if (extensionKey) {
      const exts = item[extensionKey] || []
      return exts.some(n => {
        const e = n.toLowerCase()
        return e === lower || e.includes(lower) || lower.includes(e)
      })
    }
    return false
  }) || null
}

const matchProvince = (name, list) => flexibleMatch(name, list, 'ProvinceName', 'NameExtension')

const matchDistrict = (name, list) => {
  const m = flexibleMatch(name, list, 'DistrictName', 'NameExtension')
  return m ? m.DistrictID : null
}

const matchWard = (name, list) => flexibleMatch(name, list, 'WardName', 'NameExtension')

function CheckoutStepper({ currentStep }) {
  const stepIndex = STEPS.findIndex(s => s.key === currentStep)
  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {STEPS.map((s, i) => {
        const isDone = i < stepIndex
        const isCurrent = i === stepIndex
        return (
          <div key={s.key} className="flex items-center">
            <div className="flex items-center gap-2">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shrink-0
                ${isDone ? 'bg-blue-700 text-white' : isCurrent ? 'ring-2 ring-blue-700 bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>
                {isDone ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={`text-sm font-medium hidden sm:inline ${isCurrent ? 'text-blue-700' : isDone ? 'text-blue-600' : 'text-gray-400'}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-12 sm:w-20 h-0.5 mx-2 ${i < stepIndex ? 'bg-blue-700' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Checkout() {
  const navigate = useNavigate()
  const location = useLocation()
  const selectedItems = location.state?.selectedItems

  const [cart, setCart] = useState(selectedItems || [])
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(!selectedItems)
  const [placing, setPlacing] = useState(false)
  const [vietQrData, setVietQrData] = useState(null)
  const [confirmingQr, setConfirmingQr] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [couponMsg, setCouponMsg] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [step, setStep] = useState('delivery')
  const [form, setForm] = useState({
    maDiaChi: '',
    tenNguoiNhan: '',
    sdtNguoiNhan: '',
    diaChiGiaoHang: '',
    tinhThanhPho: '',
    quanHuyen: '',
    phuongXa: '',
    ghiChu: '',
    phuongThucThanhToan: 1,
  })

  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [wards, setWards] = useState([])
  const [services, setServices] = useState([])
  const [selectedProvinceId, setSelectedProvinceId] = useState(0)
  const [selectedDistrictId, setSelectedDistrictId] = useState(0)
  const [selectedWardCode, setSelectedWardCode] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState(2)
  const [ghnFee, setGhnFee] = useState(null)
  const [ghnError, setGhnError] = useState(false)
  const [ghnLoading, setGhnLoading] = useState(false)
  const [qrTimer, setQrTimer] = useState(900)
  const qrPollRef = useRef(null)
  const qrTimerRef = useRef(null)
  const cascadingRef = useRef(false)
  const [showAddrModal, setShowAddrModal] = useState(false)
  const [addrForm, setAddrForm] = useState({ tenNguoiNhan: '', soDienThoai: '', tinhThanhPho: '', quanHuyen: '', phuongXa: '', provinceId: null, districtId: null, wardCode: '', chiTietDiaChi: '', laMacDinh: false })
  const [addrProvinceId, setAddrProvinceId] = useState(0)
  const [addrDistrictId, setAddrDistrictId] = useState(0)
  const [addrWardCode, setAddrWardCode] = useState('')
  const [addrDistricts, setAddrDistricts] = useState([])
  const [addrWards, setAddrWards] = useState([])
  const [addrLoading, setAddrLoading] = useState(false)

  useEffect(() => {
    Promise.all([!selectedItems ? getCart() : Promise.resolve([]), getAddresses(), getProvinces()])
      .then(([cartData, addrData, provData]) => {
        if (!selectedItems) setCart(cartData)
        setAddresses(addrData)
        setProvinces(provData || [])
        const def = addrData.find((a) => a.laMacDinh) || addrData[0]
        if (def) {
          const fullAddr = def.tinhThanhPho ? `${def.chiTietDiaChi}, ${def.tinhThanhPho}` : def.chiTietDiaChi
          setForm((f) => ({
            ...f,
            maDiaChi: def.maDiaChi,
            tenNguoiNhan: def.tenNguoiNhan,
            sdtNguoiNhan: def.soDienThoai,
            diaChiGiaoHang: fullAddr,
            tinhThanhPho: def.tinhThanhPho || '',
            quanHuyen: def.quanHuyen || '',
            phuongXa: def.phuongXa || '',
          }))
          cascadeAddress(def.tinhThanhPho, def.quanHuyen, provData || [], def.phuongXa, def)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedProvinceId && !cascadingRef.current) {
      setSelectedDistrictId(0); setSelectedWardCode(''); setWards([]); setGhnFee(null); setGhnError(false)
      getDistricts(selectedProvinceId).then(setDistricts).catch(() => setDistricts([]))
    }
  }, [selectedProvinceId])

  useEffect(() => {
    if (selectedDistrictId && !cascadingRef.current) {
      setSelectedWardCode(''); setGhnFee(null)
      Promise.all([
        getWards(selectedDistrictId).then(setWards).catch(() => setWards([])),
        getServices(selectedDistrictId).then(setServices).catch(() => setServices([])),
      ])
    }
  }, [selectedDistrictId])

  useEffect(() => {
    if (addrProvinceId) {
      setAddrDistrictId(0); setAddrWardCode(''); setAddrWards([])
      getDistricts(addrProvinceId).then(setAddrDistricts).catch(() => setAddrDistricts([]))
    }
  }, [addrProvinceId])

  useEffect(() => {
    if (addrDistrictId) {
      setAddrWardCode('')
      getWards(addrDistrictId).then(setAddrWards).catch(() => setAddrWards([]))
    }
  }, [addrDistrictId])

  const cascadeAddress = async (provinceName, districtName, provs, wardName, address) => {
    cascadingRef.current = true

    if (address?.provinceId) {
      setSelectedProvinceId(address.provinceId)
      setSelectedWardCode(''); setWards([]); setGhnFee(null); setGhnError(false)

      let distData = []
      try { distData = await getDistricts(address.provinceId); setDistricts(distData || []) } catch {}

      if (address.districtId && distData?.length > 0) {
        setSelectedDistrictId(address.districtId)
        try {
          const w = await getWards(address.districtId)
          setWards(w || [])
          if (address.wardCode && w?.length > 0) setSelectedWardCode(address.wardCode)
        } catch {}
      } else {
        setSelectedDistrictId(0)
      }

      cascadingRef.current = false
      return
    }

    provs = provs || provinces
    const matchedProv = matchProvince(provinceName, provs)
    if (!matchedProv) {
      cascadingRef.current = false
      return
    }

    let distData = []
    try {
      distData = await getDistricts(matchedProv.ProvinceID)
      setDistricts(distData || [])
    } catch { distData = [] }

    setSelectedProvinceId(matchedProv.ProvinceID)
    setSelectedWardCode(''); setWards([]); setGhnFee(null); setGhnError(false)

    if (districtName && distData?.length > 0) {
      const matchedDist = matchDistrict(districtName, distData)
      if (matchedDist) {
        setSelectedDistrictId(matchedDist)
        try { const w = await getWards(matchedDist); setWards(w || []) } catch {}
        if (wardName && w?.length > 0) {
          const matchedWard = matchWard(wardName, w)
          if (matchedWard) setSelectedWardCode(matchedWard.WardCode)
        }
        cascadingRef.current = false
        return
      }
    }
    setSelectedDistrictId(0)
    cascadingRef.current = false
  }

  useEffect(() => {
    if (selectedWardCode && selectedDistrictId && cart.length > 0) {
      setGhnLoading(true)
      setGhnError(false)
      const weight = cart.reduce((s, i) => s + ((i.soLuong || 1) * 500), 0)
      calculateShippingFee({
        toDistrictId: selectedDistrictId,
        toWardCode: selectedWardCode,
        weight: Math.max(weight, 500),
        provinceName: form.tinhThanhPho,
      }).then((res) => {
        if (res?.error) {
          setGhnFee(null)
          setGhnError(true)
        } else {
          setGhnFee(res?.fee ?? null)
          setGhnError(false)
        }
      }).catch(() => {
        setGhnFee(null)
        setGhnError(true)
      })
      .finally(() => setGhnLoading(false))
    }
  }, [selectedWardCode, selectedDistrictId, selectedServiceId, cart, form.tinhThanhPho])

  useEffect(() => {
    if (!vietQrData) {
      clearInterval(qrPollRef.current)
      clearInterval(qrTimerRef.current)
      setQrTimer(900)
      return
    }
    qrTimerRef.current = setInterval(() => {
      setQrTimer((prev) => { if (prev <= 1) { clearInterval(qrTimerRef.current); return 0 }; return prev - 1 })
    }, 1000)
    qrPollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/payments/${vietQrData.paymentId}`)
        if (res.data.trangThaiThanhToan === 2) {
          clearInterval(qrPollRef.current)
          clearInterval(qrTimerRef.current)
          navigate(`/orders/${vietQrData.orderId}`)
        }
      } catch {}
    }, 5000)
    return () => { clearInterval(qrPollRef.current); clearInterval(qrTimerRef.current) }
  }, [vietQrData])

  const selectAddress = (a) => {
    const fullAddr = a.tinhThanhPho ? `${a.chiTietDiaChi}, ${a.tinhThanhPho}` : a.chiTietDiaChi
    setForm((f) => ({
      ...f,
      maDiaChi: a.maDiaChi,
      tenNguoiNhan: a.tenNguoiNhan,
      sdtNguoiNhan: a.soDienThoai,
      diaChiGiaoHang: fullAddr,
      tinhThanhPho: a.tinhThanhPho || '',
      quanHuyen: a.quanHuyen || '',
      phuongXa: a.phuongXa || '',
    }))
    cascadeAddress(a.tinhThanhPho, a.quanHuyen, undefined, a.phuongXa, a)
  }

  const handleAddAddress = async (e) => {
    e.preventDefault()
    setAddrLoading(true)
    try {
      await addAddress(addrForm)
      setShowAddrModal(false)
      setAddrForm({ tenNguoiNhan: '', soDienThoai: '', tinhThanhPho: '', quanHuyen: '', phuongXa: '', provinceId: null, districtId: null, wardCode: '', chiTietDiaChi: '', laMacDinh: false })
      setAddrProvinceId(0); setAddrDistrictId(0); setAddrWardCode(''); setAddrDistricts([]); setAddrWards([])
      const addrData = await getAddresses()
      setAddresses(addrData)
      const added = addrData.find((a) => a.laMacDinh) || addrData[addrData.length - 1]
      if (added) selectAddress(added)
    } catch {} finally { setAddrLoading(false) }
  }

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponMsg('')
    try {
      const res = await api.post('/coupons/validate', { maCode: couponCode.trim(), tongTien: rawTotal })
      setCoupon(res.data)
      setCouponMsg('')
    } catch (err) {
      setCoupon(null)
      setCouponMsg(err.response?.data?.message || 'Mã giảm giá không hợp lệ')
    } finally {
      setCouponLoading(false)
    }
  }

  const rawTotal = cart.reduce((s, i) => s + ((i.donGia || 0) * (i.soLuong || 1)), 0)
  const discount = coupon?.soTienGiam || 0
  const shippingFee = ghnFee !== null ? Number(ghnFee) : 0
  const finalTotal = Math.max(0, rawTotal - discount + shippingFee)

  const goToStep = (s) => {
    if (s === 'payment' || s === 'review') {
      if (!form.tenNguoiNhan || !form.sdtNguoiNhan || !form.diaChiGiaoHang) return
    }
    setStep(s)
  }

  const handlePlaceOrder = async () => {
    if (!form.tenNguoiNhan || !form.sdtNguoiNhan || !form.diaChiGiaoHang) { return }
    if (cart.length === 0) { return }
    setPlacing(true)
    try {
      const weight = cart.reduce((s, i) => s + ((i.soLuong || 1) * 500), 0)
      const orderPayload = {
        tenNguoiNhan: form.tenNguoiNhan,
        sdtNguoiNhan: form.sdtNguoiNhan,
        diaChiGiaoHang: form.diaChiGiaoHang,
        ghiChu: form.ghiChu,
        phuongThucThanhToan: form.phuongThucThanhToan,
        maCode: couponCode.trim() || undefined,
        phiVanChuyen: shippingFee,
        toDistrictId: selectedDistrictId || undefined,
        toWardCode: selectedWardCode || undefined,
        weight: Math.max(weight, 500),
      }
      if (selectedItems) {
        orderPayload.maBienTheList = selectedItems.map(i => i.maBienThe)
      }

      const result = await placeOrder(orderPayload)

      const method = form.phuongThucThanhToan
      if (method === 1) {
        navigate(`/orders/${result.maDonHang}`)
      } else if (method === 2) {
        const paymentRes = await createVnPayPayment(result.maDonHang)
        window.location.href = paymentRes.paymentUrl
      } else if (method === 3) {
        const paymentRes = await createMomoPayment(result.maDonHang)
        window.location.href = paymentRes.paymentUrl
      } else if (method === 4) {
        const paymentRes = await createZaloPayPayment(result.maDonHang)
        window.location.href = paymentRes.paymentUrl
      } else if (method === 6) {
        const qrRes = await createVietQrPayment(result.maDonHang)
        setVietQrData(qrRes)
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Đặt hàng thất bại')
    } finally {
      setPlacing(false)
    }
  }

  const handleConfirmQr = async () => {
    if (!vietQrData) return
    setConfirmingQr(true)
    try {
      await confirmVietQrPayment(vietQrData.paymentId)
      setVietQrData(null)
      navigate(`/orders/${vietQrData.orderId}`)
    } catch (err) {
      alert('Xác nhận thanh toán thất bại')
    } finally {
      setConfirmingQr(false)
    }
  }

  if (loading) return <LoadingSpinner className="py-20" />

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Thanh toán</h1>
        <p className="text-gray-500">Giỏ hàng trống</p>
        <button onClick={() => navigate('/')} className="mt-4 text-blue-700 font-semibold hover:underline">Tiếp tục mua sắm</button>
      </div>
    )
  }

  return (
    <><div className="max-w-6xl mx-auto px-4 py-8">
      <button onClick={() => navigate('/cart')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4" /> Quay lại giỏ hàng
      </button>
      <h1 className="text-2xl font-bold mb-6">Thanh toán</h1>

      <CheckoutStepper currentStep={step} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">

          {step === 'delivery' && (
            <div className="border-l-4 border-blue-600 bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><MapPin className="h-5 w-5 text-blue-700" /> Thông tin giao hàng</h2>

              {addresses.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {addresses.map((a) => (
                    <div key={a.maDiaChi}
                      onClick={() => selectAddress(a)}
                      className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200
                        ${form.maDiaChi === a.maDiaChi ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="flex items-start gap-2">
                        <input type="radio" name="address" checked={form.maDiaChi === a.maDiaChi} readOnly className="mt-1 accent-blue-700" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{a.tenNguoiNhan} — {a.soDienThoai}</p>
                          <p className="text-sm text-gray-500 truncate">{a.chiTietDiaChi}{a.tinhThanhPho ? `, ${a.tinhThanhPho}` : ''}</p>
                          {a.laMacDinh && <span className="text-[10px] text-blue-600 font-semibold bg-blue-100 px-2 py-0.5 rounded-full mt-1 inline-block">Mặc định</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={() => setShowAddrModal(true)} className="w-full border-2 border-dashed border-gray-300 rounded-xl py-3 px-4 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition flex items-center justify-center gap-2 mb-4">
                <Plus className="h-4 w-4" /> Thêm địa chỉ mới
              </button>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input value={form.tenNguoiNhan} onChange={(e) => setForm((f) => ({ ...f, tenNguoiNhan: e.target.value }))} placeholder="Tên người nhận" className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input value={form.sdtNguoiNhan} onChange={(e) => setForm((f) => ({ ...f, sdtNguoiNhan: e.target.value }))} placeholder="Số điện thoại" className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <select value={selectedProvinceId} onChange={(e) => { const id = Number(e.target.value); setSelectedProvinceId(id); setSelectedDistrictId(0); setSelectedWardCode(''); setWards([]); setGhnFee(null); setGhnError(false); const name = e.target.options[e.target.selectedIndex]?.text || ''; setForm((f) => ({ ...f, tinhThanhPho: name })) }}
                  className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value={0}>-- Chọn Tỉnh/Thành phố --</option>
                  {provinces.map((p) => <option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <select value={selectedDistrictId} onChange={(e) => { setSelectedDistrictId(Number(e.target.value)); setSelectedWardCode(''); setWards([]); setGhnFee(null); const name = e.target.options[e.target.selectedIndex]?.text || ''; setForm((f) => ({ ...f, quanHuyen: name })) }}
                    disabled={!selectedProvinceId} className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value={0}>-- Chọn Quận/Huyện --</option>
                    {districts.map((d) => <option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</option>)}
                  </select>
                  <select value={selectedWardCode} onChange={(e) => { setSelectedWardCode(e.target.value); const name = e.target.options[e.target.selectedIndex]?.text || ''; setForm((f) => ({ ...f, phuongXa: name })) }}
                    disabled={!selectedDistrictId} className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- Chọn Phường/Xã --</option>
                    {wards.map((w) => <option key={w.WardCode} value={w.WardCode}>{w.WardName}</option>)}
                  </select>
                </div>
                <input value={form.diaChiGiaoHang} onChange={(e) => setForm((f) => ({ ...f, diaChiGiaoHang: e.target.value }))} placeholder="Địa chỉ chi tiết (số nhà, đường)" className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <textarea value={form.ghiChu} onChange={(e) => setForm((f) => ({ ...f, ghiChu: e.target.value }))} placeholder="Ghi chú (không bắt buộc)" rows={2} className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />

                <button onClick={() => goToStep('payment')} disabled={!form.tenNguoiNhan || !form.sdtNguoiNhan || !form.diaChiGiaoHang}
                  className="w-full bg-blue-700 text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  Tiếp tục <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 'payment' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><CreditCard className="h-5 w-5 text-blue-700" /> Phương thức thanh toán</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PAYMENT_CARDS.map((pm) => {
                  const Icon = pm.icon
                  return (
                    <div key={pm.value}
                      onClick={() => setForm((f) => ({ ...f, phuongThucThanhToan: pm.value }))}
                      className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200
                        ${form.phuongThucThanhToan === pm.value ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="flex items-start gap-3">
                        <input type="radio" name="payment" checked={form.phuongThucThanhToan === pm.value} readOnly className="mt-1 accent-blue-700 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{pm.label}</p>
                            {pm.badge && <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{pm.badge}</span>}
                          </div>
                          <p className="text-xs text-gray-400">{pm.desc}</p>
                        </div>
                        <Icon className={`h-6 w-6 shrink-0 ${form.phuongThucThanhToan === pm.value ? 'text-blue-700' : 'text-gray-300'}`} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => goToStep('delivery')} className="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition">Quay lại</button>
                <button onClick={() => goToStep('review')} className="flex-1 bg-blue-700 text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition">Tiếp tục</button>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><MapPin className="h-5 w-5 text-blue-700" /> Thông tin giao hàng</h2>
              <div className="text-sm space-y-1 mb-4 p-3 bg-gray-50 rounded-lg">
                <p><span className="text-gray-500">Người nhận:</span> {form.tenNguoiNhan} — {form.sdtNguoiNhan}</p>
                <p><span className="text-gray-500">Địa chỉ:</span> {form.diaChiGiaoHang}</p>
                {form.ghiChu && <p><span className="text-gray-500">Ghi chú:</span> {form.ghiChu}</p>}
              </div>

              <h2 className="font-semibold mb-4 flex items-center gap-2"><CreditCard className="h-5 w-5 text-blue-700" /> Phương thức thanh toán</h2>
              <div className="text-sm p-3 bg-gray-50 rounded-lg mb-4">
                <p>{PAYMENT_CARDS.find(p => p.value === form.phuongThucThanhToan)?.label}</p>
              </div>

              <div className="border-t pt-4 mb-4">
                <h2 className="font-semibold mb-4 flex items-center gap-2"><Tag className="h-5 w-5 text-blue-700" /> Mã giảm giá</h2>
                <div className="flex gap-2">
                  <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} disabled={!!coupon}
                    placeholder="Nhập mã giảm giá"
                    className={`border rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${coupon ? 'border-green-400 bg-green-50' : ''}`} />
                  {!coupon ? (
                    <button onClick={handleValidateCoupon} disabled={couponLoading || !couponCode.trim()}
                      className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-50">
                      {couponLoading ? <Loader className="h-4 w-4 animate-spin" /> : 'Áp dụng'}
                    </button>
                  ) : null}
                </div>
                {coupon && (
                  <div className="mt-2 inline-flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full text-sm animate-bounce-in">
                    <span className="text-green-700 font-medium">{couponCode.toUpperCase()} — Giảm {VND(discount)}</span>
                    <button onClick={() => { setCoupon(null); setCouponCode(''); setCouponMsg('') }} className="text-green-600 hover:text-green-800">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                {couponMsg && <p className="text-red-500 text-xs mt-1">{couponMsg}</p>}
              </div>

              {ghnError && <p className="text-red-500 text-xs text-center">Không thể tính phí vận chuyển. Vui lòng kiểm tra lại địa chỉ hoặc thử lại sau.</p>}
              <div className="flex gap-3">
                <button onClick={() => goToStep('payment')} className="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition">Quay lại</button>
                <button onClick={handlePlaceOrder} disabled={placing || ghnError}
                  className="flex-1 bg-blue-700 text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {placing ? <><Loader className="h-5 w-5 animate-spin" /> Đang xử lý...</> : 'Đặt hàng ngay'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-4">
            <h2 className="font-semibold mb-4">Tóm tắt đơn hàng {selectedItems ? `(${cart.length})` : ''}</h2>
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
              {cart.map((i) => (
                <div key={i.maBienThe} className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                    <SafeImg src={i.urlAnh} alt="" className="w-full h-full object-cover object-center" fallback="https://placehold.co/100x100/e2e8f0/475569?text=Polo" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{i.tenSanPham}</p>
                    <p className="text-xs text-gray-500">x{i.soLuong}</p>
                  </div>
                  <p className="text-sm font-semibold">{VND(i.donGia * i.soLuong)}</p>
                </div>
              ))}
            </div>
            <hr className="border-t" />
            <div className="pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính</span>
                <span>{VND(rawTotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span>
                  <span>-{VND(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển</span>
                <span>{ghnLoading ? <Loader className="h-4 w-4 animate-spin inline" /> : ghnError ? <span className="text-red-500 text-xs">Lỗi</span> : ghnFee !== null ? VND(shippingFee) : '---'}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Tổng cộng</span>
                <span className="text-blue-700">{VND(finalTotal)}</span>
              </div>
            </div>
            {step === 'review' && (
              <button onClick={handlePlaceOrder} disabled={placing || ghnError}
                className="mt-4 w-full bg-blue-700 text-white font-semibold py-4 rounded-xl hover:bg-blue-800 disabled:opacity-50 transition flex items-center justify-center gap-2 text-lg">
                {placing ? <><Loader className="h-5 w-5 animate-spin" /> Đang xử lý...</> : ghnError ? 'Lỗi phí vận chuyển' : 'Đặt hàng ngay'}
              </button>
            )}
            <p className="text-xs text-gray-400 text-center mt-3">🔒 Thanh toán an toàn & bảo mật</p>
          </div>
        </div>
      </div>
    </div>

      {vietQrData && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={() => { clearInterval(qrPollRef.current); clearInterval(qrTimerRef.current); setVietQrData(null) }}>
        <div className="bg-white rounded-3xl max-w-md w-full mx-4 p-6 animate-scale-in text-center"
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Quét mã QR để thanh toán</h3>
            <button onClick={() => { clearInterval(qrPollRef.current); clearInterval(qrTimerRef.current); setVietQrData(null) }} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="bg-white rounded-xl p-4 border-2 border-blue-100 mb-4 inline-block">
            <img src={vietQrData.qrUrl} alt="VietQR" className="w-64 h-64 mx-auto" />
          </div>

          <div className="flex justify-center gap-4 mb-4 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-700">{Math.floor(qrTimer / 60)}:{String(qrTimer % 60).padStart(2, '0')}</p>
              <p className="text-xs text-gray-400">Thời gian còn lại</p>
            </div>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
            <div className="bg-blue-700 h-2 rounded-full transition-all duration-1000" style={{ width: `${(qrTimer / 900) * 100}%` }} />
          </div>

          <div className="text-left space-y-2 text-sm mb-4">
            <p><span className="text-gray-500">Ngân hàng:</span> <span className="font-medium">{vietQrData.bankName}</span></p>
            <p><span className="text-gray-500">Số tài khoản:</span> <span className="font-medium">{vietQrData.accountNumber}</span></p>
            <p><span className="text-gray-500">Chủ tài khoản:</span> <span className="font-medium">{vietQrData.accountName}</span></p>
            <p><span className="text-gray-500">Số tiền:</span> <span className="font-medium text-blue-700">{VND(vietQrData.amount)}</span></p>
          </div>

          <p className="text-xs text-gray-400 mb-4">Sử dụng ứng dụng ngân hàng để quét mã QR và thanh toán</p>

          {qrTimer === 0 ? (
            <button onClick={() => { clearInterval(qrPollRef.current); clearInterval(qrTimerRef.current); setVietQrData(null); setVietQrData({ ...vietQrData }) }}
              className="w-full bg-amber-500 text-white font-semibold py-3 rounded-xl hover:bg-amber-600 flex items-center justify-center gap-2">
              Tạo lại mã QR
            </button>
          ) : (
            <button onClick={handleConfirmQr} disabled={confirmingQr}
              className="w-full bg-blue-700 text-white font-semibold py-3 rounded-xl hover:bg-blue-800 disabled:opacity-50 flex items-center justify-center gap-2">
              {confirmingQr ? <Loader className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
              {confirmingQr ? 'Đang xử lý...' : 'Tôi đã thanh toán'}
            </button>
          )}
      </div>
    </div>
    )}

      {showAddrModal && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={() => setShowAddrModal(false)}>
        <div className="bg-white rounded-3xl max-w-lg w-full mx-4 p-6 animate-scale-in max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Thêm địa chỉ mới</h3>
            <button onClick={() => setShowAddrModal(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleAddAddress} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input value={addrForm.tenNguoiNhan} onChange={(e) => setAddrForm({ ...addrForm, tenNguoiNhan: e.target.value })} placeholder="Tên người nhận" required
                className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={addrForm.soDienThoai} onChange={(e) => setAddrForm({ ...addrForm, soDienThoai: e.target.value })} placeholder="Số điện thoại" required
                className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <select value={addrProvinceId} onChange={(e) => { const id = Number(e.target.value); setAddrProvinceId(id); const name = e.target.options[e.target.selectedIndex]?.text || ''; setAddrForm({ ...addrForm, tinhThanhPho: name, provinceId: id || null }) }}
              className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value={0}>-- Chọn Tỉnh/Thành phố --</option>
              {provinces.map((p) => <option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <select value={addrDistrictId} onChange={(e) => { const id = Number(e.target.value); setAddrDistrictId(id); const name = e.target.options[e.target.selectedIndex]?.text || ''; setAddrForm({ ...addrForm, quanHuyen: name, districtId: id || null }) }}
                disabled={!addrProvinceId} className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value={0}>-- Chọn Quận/Huyện --</option>
                {addrDistricts.map((d) => <option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</option>)}
              </select>
              <select value={addrWardCode} onChange={(e) => { setAddrWardCode(e.target.value); const name = e.target.options[e.target.selectedIndex]?.text || ''; setAddrForm({ ...addrForm, phuongXa: name, wardCode: e.target.value || '' }) }}
                disabled={!addrDistrictId} className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">-- Chọn Phường/Xã --</option>
                {addrWards.map((w) => <option key={w.WardCode} value={w.WardCode}>{w.WardName}</option>)}
              </select>
            </div>
            <input value={addrForm.chiTietDiaChi} onChange={(e) => setAddrForm({ ...addrForm, chiTietDiaChi: e.target.value })} placeholder="Địa chỉ chi tiết (số nhà, đường)" required
              className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={addrForm.laMacDinh} onChange={(e) => setAddrForm({ ...addrForm, laMacDinh: e.target.checked })} className="accent-blue-700" />
              Đặt làm mặc định
            </label>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowAddrModal(false)}
                className="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition text-sm">
                Hủy
              </button>
              <button type="submit" disabled={addrLoading}
                className="flex-1 bg-blue-700 text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                {addrLoading ? <><Loader className="h-4 w-4 animate-spin" /> Đang lưu...</> : 'Thêm địa chỉ'}
              </button>
            </div>
          </form>
        </div>
      </div>
      )}
  </>)
}
