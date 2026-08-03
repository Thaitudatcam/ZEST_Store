import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getCart } from '../api/cart'
import { getAddresses, addAddress } from '../api/users'
import { placeOrder } from '../api/orders'
import { getSoDu, getSoDuDiem, getLichSuDiem, getDiemQuyTac } from '../api/vi'
import { createVnPayPayment, createMomoPayment, createZaloPayPayment, createVietQrPayment, confirmVietQrPayment } from '../api/payment'
import { getProvinces, getDistricts, getWards, getServices, calculateShippingFee } from '../api/ghn'
import { getUserVouchers } from '../api/userVoucher'
import { getAvailableCoupons } from '../api/coupons'
import LoadingSpinner from '../components/LoadingSpinner'
import { useToast } from '../context/ToastContext'
import { VND } from '../components/ProductCard'
import ConfirmDialog from '../components/ConfirmDialog'
import { MapPin, CreditCard, Tag, ArrowLeft, Loader, Check, X, QrCode, Truck, Banknote, Smartphone, Landmark, ChevronRight, Plus, Wallet, Coins, RefreshCw, History } from 'lucide-react'
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
  { value: 7, label: 'Ví ZestStore', desc: 'Thanh toán bằng số dư ví', icon: Wallet, badge: null },
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
                ${isDone ? 'bg-gold text-noir' : isCurrent ? 'ring-2 ring-blue-700 bg-gold/20 text-gold' : 'bg-ivory-100 text-stone'}`}>
                {isDone ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={`text-sm font-medium hidden sm:inline ${isCurrent ? 'text-gold' : isDone ? 'text-gold' : 'text-stone'}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-12 sm:w-20 h-0.5 mx-2 ${i < stepIndex ? 'bg-gold' : 'bg-ivory-100'}`} />
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

  const toast = useToast()
  const [cart, setCart] = useState(selectedItems || [])
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(!selectedItems)
  const [placing, setPlacing] = useState(false)
  const [soDuVi, setSoDuVi] = useState(0)
  const [vietQrData, setVietQrData] = useState(null)
  const [dungDiem, setDungDiem] = useState(false)
  const [soDiemHienCo, setSoDiemHienCo] = useState(0)
  const [diemQuyTac, setDiemQuyTac] = useState(null)
  const [showDiemHistory, setShowDiemHistory] = useState(false)
  const [diemHistoryData, setDiemHistoryData] = useState([])
  const [diemHistoryLoading, setDiemHistoryLoading] = useState(false)
  const [confirmingQr, setConfirmingQr] = useState(false)
  const [discountCoupon, setDiscountCoupon] = useState(null)
  const [discountMsg, setDiscountMsg] = useState('')
  const [discountLoading, setDiscountLoading] = useState(false)
  const [discountCode, setDiscountCode] = useState('')
  const [discountVouchersOpen, setDiscountVouchersOpen] = useState(false)
  const [freeshipVoucher, setFreeshipVoucher] = useState(null)
  const [freeshipMsg, setFreeshipMsg] = useState('')
  const [userVouchers, setUserVouchers] = useState([])
  const [availableDiscount, setAvailableDiscount] = useState([])
  const [vouchersOpen, setVouchersOpen] = useState(false)
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
  const [confirmOrder, setConfirmOrder] = useState(false)
  const [confirmAddr, setConfirmAddr] = useState(false)

  const refreshDiem = () => {
    getSoDuDiem().then(d => setSoDiemHienCo(d.soDiem || 0)).catch(() => {})
    getDiemQuyTac().then(setDiemQuyTac).catch(() => {})
  }

  const loadDiemHistory = async () => {
    setDiemHistoryLoading(true)
    try {
      const res = await getLichSuDiem(0, 10)
      setDiemHistoryData(Array.isArray(res.content) ? res.content : [])
      setShowDiemHistory(true)
    } catch {} finally { setDiemHistoryLoading(false) }
  }

  useEffect(() => {
    getSoDu().then(d => setSoDuVi(d.soDu || 0)).catch(() => {})
    refreshDiem()
    const provPromise = getProvinces().catch(() => [])
    Promise.all([!selectedItems ? getCart() : Promise.resolve([]), getAddresses()])
      .then(([cartData, addrData]) => {
        if (!selectedItems) setCart(cartData)
        setAddresses(addrData)
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
        }
        provPromise.then((provData) => {
          const provs = provData || []
          setProvinces(provs)
          if (def) cascadeAddress(def.tinhThanhPho, def.quanHuyen, provs, def.phuongXa, def)
        })
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
        let wardData = []
        try { wardData = await getWards(matchedDist); setWards(wardData || []) } catch {}
        if (wardName && wardData?.length > 0) {
          const matchedWard = matchWard(wardName, wardData)
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

  const handleAddAddress = async () => {
    setConfirmAddr(false)
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

  useEffect(() => {
    if (!cart.length) { setDiscountCoupon(null); setDiscountMsg(''); setDiscountCode(''); setFreeshipVoucher(null); setFreeshipMsg(''); return }
  }, [cart.length])

  useEffect(() => {
    if (!cart.length) { setAvailableDiscount([]); return }
    let cancelled = false
    const total = cart.reduce((s, i) => s + ((i.donGia || 0) * (i.soLuong || 1)), 0)
    const productIds = [...new Set(cart.map(i => i.maSanPham).filter(Boolean))]
    const timer = setTimeout(() => {
      getAvailableCoupons(total, productIds)
        .then(res => { if (!cancelled) setAvailableDiscount(res || []) })
        .catch(() => { if (!cancelled) setAvailableDiscount([]) })
    }, 400)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [cart])

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return
    setDiscountCoupon(null)
    setDiscountMsg('')
    setDiscountLoading(true)
    try {
      const res = await api.post('/coupons/validate', { maCode: discountCode.trim(), tongTien: rawTotal })
      setDiscountCoupon(res.data)
    } catch (err) {
      setDiscountMsg(err.response?.data?.message || 'Mã giảm giá không hợp lệ')
    } finally {
      setDiscountLoading(false)
    }
  }

  const handleSelectDiscountVoucher = async (v) => {
    setDiscountCoupon(null)
    setDiscountMsg('')
    setDiscountCode(v.maCode)
    try {
      const res = await api.post('/coupons/validate', { maCode: v.maCode, tongTien: rawTotal })
      setDiscountCoupon(res.data)
    } catch (err) {
      setDiscountMsg(err.response?.data?.message || 'Mã giảm giá không hợp lệ')
    }
  }

  const handleSelectFreeship = async (v) => {
    setFreeshipVoucher(null)
    setFreeshipMsg('')
    try {
      const res = await api.post('/coupons/validate', { maCode: v.maCode, tongTien: rawTotal })
      setFreeshipVoucher(res.data)
      setVouchersOpen(false)
    } catch (err) {
      setFreeshipMsg(err.response?.data?.message || 'Mã freeship không hợp lệ')
    }
  }

  useEffect(() => {
    getUserVouchers().then(setUserVouchers).catch(() => {})
  }, [])

  const rawTotal = cart.reduce((s, i) => s + ((i.donGia || 0) * (i.soLuong || 1)), 0)
  const shippingFee = ghnFee !== null ? Number(ghnFee) : 0
  const discount = discountCoupon?.soTienGiam || 0
  const freeshipDiscount = freeshipVoucher?.kieuGiamGia === 3
    ? (freeshipVoucher.giaTriGiam === 0 ? shippingFee : Math.min(freeshipVoucher.giaTriGiam, shippingFee))
    : 0
  const effectiveShippingFee = shippingFee - freeshipDiscount

  const tiLeDoi = diemQuyTac?.tiLeDoi ?? 1000
  const giamToiDaPhanTram = diemQuyTac?.giamToiDaPhanTram ?? 50
  const diemToiThieu = diemQuyTac?.diemToiThieu ?? 10
  const giaTriHangSauCoupon = Math.max(0, rawTotal - discount)
  const maxDiemTheoQuyTac = Math.floor(giaTriHangSauCoupon * giamToiDaPhanTram / 100 / tiLeDoi)
  const maxDiemSuDung = Math.max(0, Math.min(soDiemHienCo, maxDiemTheoQuyTac))
  const diemDungDuoc = soDiemHienCo > 0 && maxDiemSuDung >= diemToiThieu
  const diemSuDung = dungDiem && diemDungDuoc ? maxDiemSuDung : 0
  const tienGiamDiem = diemSuDung * tiLeDoi
  const finalTotal = Math.max(0, rawTotal - discount + effectiveShippingFee - tienGiamDiem)

  const goToStep = (s) => {
    if (s === 'payment' || s === 'review') {
      if (!form.tenNguoiNhan || !form.sdtNguoiNhan || !form.diaChiGiaoHang) return
      if (!selectedDistrictId || !selectedWardCode) { toast.error('Vui lòng chọn Tỉnh/Thành phố, Quận/Huyện và Phường/Xã'); return }
      if (ghnFee === null) { toast.error('Vui lòng chờ tính phí vận chuyển'); return }
    }
    setStep(s)
  }

  const requestPlace = () => {
    if (!form.tenNguoiNhan || !form.sdtNguoiNhan || !form.diaChiGiaoHang) { toast.error('Vui lòng điền đầy đủ thông tin giao hàng'); return }
    if (cart.length === 0) { return }
    if (!selectedDistrictId || !selectedWardCode) { toast.error('Vui lòng chọn đầy đủ địa chỉ giao hàng'); return }
    if (ghnFee === null) { toast.error('Vui lòng chờ tính phí vận chuyển'); return }
    if (diemSuDung > 0 && diemSuDung < diemToiThieu) { toast.error(`Tối thiểu ${diemToiThieu} điểm để sử dụng`); return }
    setConfirmOrder(true)
  }

  const handlePlaceOrder = async () => {
    setConfirmOrder(false)
    setPlacing(true)
    try {
      const weight = cart.reduce((s, i) => s + ((i.soLuong || 1) * 500), 0)
      const orderPayload = {
        tenNguoiNhan: form.tenNguoiNhan,
        sdtNguoiNhan: form.sdtNguoiNhan,
        diaChiGiaoHang: form.diaChiGiaoHang,
        ghiChu: form.ghiChu,
        phuongThucThanhToan: form.phuongThucThanhToan,
        maCode: discountCoupon?.maCode || undefined,
        maCodeFreeship: freeshipVoucher?.maCode || undefined,
        phiVanChuyen: shippingFee,
        toDistrictId: selectedDistrictId || undefined,
        toWardCode: selectedWardCode || undefined,
        weight: Math.max(weight, 500),
        soDiemSuDung: diemSuDung > 0 ? diemSuDung : undefined,
      }
      if (selectedItems) {
        orderPayload.maBienTheList = selectedItems.map(i => i.maBienThe)
      }

      const result = await placeOrder(orderPayload)

      const method = form.phuongThucThanhToan
      if (method === 1 || method === 7) {
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
        <p className="text-stone">Giỏ hàng trống</p>
        <button onClick={() => navigate('/')} className="mt-4 text-gold font-semibold hover:underline">Tiếp tục mua sắm</button>
      </div>
    )
  }

  return (
    <><div className="max-w-6xl mx-auto px-4 py-8">
      <button onClick={() => navigate('/cart')} className="flex items-center gap-1 text-sm text-stone hover:text-ink-soft mb-4">
        <ArrowLeft className="h-4 w-4" /> Quay lại giỏ hàng
      </button>
      <h1 className="text-2xl font-bold mb-6">Thanh toán</h1>

      <CheckoutStepper currentStep={step} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">

          {step === 'delivery' && (
            <div className="border-l-4 border-gold bg-ivory rounded-xl shadow-sm p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><MapPin className="h-5 w-5 text-gold" /> Thông tin giao hàng</h2>

              {addresses.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {addresses.map((a) => (
                    <div key={a.maDiaChi}
                      onClick={() => selectAddress(a)}
                      className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200
                        ${form.maDiaChi === a.maDiaChi ? 'border-gold ring-2 ring-blue-200 bg-gold/10/50' : 'border-stone/20 hover:border-stone/30'}`}>
                      <div className="flex items-start gap-2">
                        <input type="radio" name="address" checked={form.maDiaChi === a.maDiaChi} readOnly className="mt-1 accent-blue-700" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{a.tenNguoiNhan} — {a.soDienThoai}</p>
                          <p className="text-sm text-stone truncate">{a.chiTietDiaChi}{a.tinhThanhPho ? `, ${a.tinhThanhPho}` : ''}</p>
                          {a.laMacDinh && <span className="text-[10px] text-gold font-semibold bg-gold/20 px-2 py-0.5 rounded-full mt-1 inline-block">Mặc định</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={() => setShowAddrModal(true)} className="w-full border-2 border-dashed border-stone/30 rounded-xl py-3 px-4 text-sm text-stone hover:border-gold hover:text-gold transition flex items-center justify-center gap-2 mb-4">
                <Plus className="h-4 w-4" /> Thêm địa chỉ mới
              </button>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input value={form.tenNguoiNhan} onChange={(e) => setForm((f) => ({ ...f, tenNguoiNhan: e.target.value }))} placeholder="Tên người nhận" className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-gold" />
                  <input value={form.sdtNguoiNhan} onChange={(e) => setForm((f) => ({ ...f, sdtNguoiNhan: e.target.value }))} placeholder="Số điện thoại" className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-gold" />
                </div>
                <select value={selectedProvinceId} onChange={(e) => { const id = Number(e.target.value); setSelectedProvinceId(id); setSelectedDistrictId(0); setSelectedWardCode(''); setWards([]); setGhnFee(null); setGhnError(false); const name = e.target.options[e.target.selectedIndex]?.text || ''; setForm((f) => ({ ...f, tinhThanhPho: name })) }}
                  className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-gold">
                  <option value={0}>-- Chọn Tỉnh/Thành phố --</option>
                  {provinces.map((p) => <option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <select value={selectedDistrictId} onChange={(e) => { setSelectedDistrictId(Number(e.target.value)); setSelectedWardCode(''); setWards([]); setGhnFee(null); const name = e.target.options[e.target.selectedIndex]?.text || ''; setForm((f) => ({ ...f, quanHuyen: name })) }}
                    disabled={!selectedProvinceId} className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-gold">
                    <option value={0}>-- Chọn Quận/Huyện --</option>
                    {districts.map((d) => <option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</option>)}
                  </select>
                  <select value={selectedWardCode} onChange={(e) => { setSelectedWardCode(e.target.value); const name = e.target.options[e.target.selectedIndex]?.text || ''; setForm((f) => ({ ...f, phuongXa: name })) }}
                    disabled={!selectedDistrictId} className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-gold">
                    <option value="">-- Chọn Phường/Xã --</option>
                    {wards.map((w) => <option key={w.WardCode} value={w.WardCode}>{w.WardName}</option>)}
                  </select>
                </div>
                <input value={form.diaChiGiaoHang} onChange={(e) => setForm((f) => ({ ...f, diaChiGiaoHang: e.target.value }))} placeholder="Địa chỉ chi tiết (số nhà, đường)" className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-gold" />
                <textarea value={form.ghiChu} onChange={(e) => setForm((f) => ({ ...f, ghiChu: e.target.value }))} placeholder="Ghi chú (không bắt buộc)" rows={2} className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-gold" />

                <button onClick={() => goToStep('payment')} disabled={!form.tenNguoiNhan || !form.sdtNguoiNhan || !form.diaChiGiaoHang}
                  className="w-full bg-gold text-noir py-3 rounded-xl font-semibold hover:bg-gold-hover transition disabled:opacity-50 flex items-center justify-center gap-2">
                  Tiếp tục <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 'payment' && (
            <div className="bg-ivory rounded-xl shadow-sm p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><CreditCard className="h-5 w-5 text-gold" /> Phương thức thanh toán</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PAYMENT_CARDS.map((pm) => {
                  const Icon = pm.icon
                  return (
                    <div key={pm.value}
                      onClick={() => setForm((f) => ({ ...f, phuongThucThanhToan: pm.value }))}
                      className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200
                        ${form.phuongThucThanhToan === pm.value ? 'border-gold ring-2 ring-blue-200 bg-gold/10/50' : 'border-stone/20 hover:border-stone/30'}`}>
                      <div className="flex items-start gap-3">
                        <input type="radio" name="payment" checked={form.phuongThucThanhToan === pm.value} readOnly className="mt-1 accent-blue-700 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{pm.label}</p>
                            {pm.badge && <span className="text-[10px] font-semibold bg-gold/20 text-gold px-2 py-0.5 rounded-full">{pm.badge}</span>}
                          </div>
                          <p className="text-xs text-stone">{pm.value === 7 ? `Số dư: ${VND(soDuVi)}` : pm.desc}</p>
                        </div>
                        <Icon className={`h-6 w-6 shrink-0 ${form.phuongThucThanhToan === pm.value ? 'text-gold' : 'text-stone'}`} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => goToStep('delivery')} className="flex-1 border-2 border-stone/20 text-ink-soft py-3 rounded-xl font-semibold hover:bg-ivory-100 transition">Quay lại</button>
                <button onClick={() => goToStep('review')} className="flex-1 bg-gold text-noir py-3 rounded-xl font-semibold hover:bg-gold-hover transition">Tiếp tục</button>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="bg-ivory rounded-xl shadow-sm p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><MapPin className="h-5 w-5 text-gold" /> Thông tin giao hàng</h2>
              <div className="text-sm space-y-1 mb-4 p-3 bg-ivory-100 rounded-lg">
                <p><span className="text-stone">Người nhận:</span> {form.tenNguoiNhan} — {form.sdtNguoiNhan}</p>
                <p><span className="text-stone">Địa chỉ:</span> {form.diaChiGiaoHang}</p>
                {form.ghiChu && <p><span className="text-stone">Ghi chú:</span> {form.ghiChu}</p>}
              </div>

              <h2 className="font-semibold mb-4 flex items-center gap-2"><CreditCard className="h-5 w-5 text-gold" /> Phương thức thanh toán</h2>
              <div className="text-sm p-3 bg-ivory-100 rounded-lg mb-4">
                <p>{PAYMENT_CARDS.find(p => p.value === form.phuongThucThanhToan)?.label}</p>
                {form.phuongThucThanhToan === 7 && soDuVi < finalTotal && (
                  <p className="text-xs text-bordeaux mt-1">⚠ Số dư ví không đủ ({VND(soDuVi)}) để thanh toán ({VND(finalTotal)})</p>
                )}
              </div>

              <div className="border-t pt-4 mb-4 space-y-4">
                <div>
                  <h2 className="font-semibold mb-2 flex items-center gap-2 text-sm"><Tag className="h-4 w-4 text-gold" /> Mã giảm giá (Coupon)</h2>
                  <p className="text-xs text-stone mb-2">Nhập mã giảm giá công khai</p>
                  {discountCoupon ? (
                    <div className="inline-flex items-center gap-2 bg-emerald-deep/10 border border-emerald-deep/20 px-3 py-1.5 rounded-full text-sm">
                      <span className="text-emerald-deep font-medium">{discountCoupon.maCode} — Giảm {VND(discount)}</span>
                      <button onClick={() => { setDiscountCoupon(null); setDiscountMsg(''); setDiscountCode('') }} className="text-emerald-deep hover:text-emerald-deep">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <input value={discountCode} onChange={e => setDiscountCode(e.target.value)}
                          placeholder="Nhập mã..."
                          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
                        <button onClick={handleApplyDiscount} disabled={discountLoading || !discountCode.trim()}
                          className="px-3 py-2 bg-gold text-noir text-sm font-medium rounded-lg hover:bg-gold-hover transition disabled:opacity-50">
                          {discountLoading ? '...' : 'Áp dụng'}
                        </button>
                      </div>
                      {availableDiscount.filter(v => v.kieuGiamGia !== 3).length > 0 && (
                        <div className="relative mt-2">
                          <button onClick={() => setDiscountVouchersOpen(!discountVouchersOpen)} type="button"
                            className="w-full flex items-center justify-between border rounded-lg px-3 py-2 text-sm bg-ivory hover:border-gold transition">
                            <span className="text-stone">Chọn mã giảm giá...</span>
                            <ChevronRight className={`h-4 w-4 text-stone transition-transform ${discountVouchersOpen ? 'rotate-90' : ''}`} />
                          </button>
                          {discountVouchersOpen && (
                            <div className="absolute z-10 mt-1 w-full bg-ivory border rounded-lg shadow-lg max-h-56 overflow-y-auto">
                              {availableDiscount.filter(v => v.kieuGiamGia !== 3 && !v.isPersonal).length > 0 && (
                                <>
                                  <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-stone">Mã công khai</div>
                                  {availableDiscount.filter(v => v.kieuGiamGia !== 3 && !v.isPersonal).map(v => (
                                    <button key={v.maCode} onClick={() => { handleSelectDiscountVoucher(v); setDiscountVouchersOpen(false) }}
                                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-gold/10 border-b last:border-b-0 transition flex items-center justify-between">
                                      <span className="font-medium">{v.maCode}</span>
                                      <span className="text-emerald-deep text-xs font-medium">
                                        {v.kieuGiamGia === 1 ? `Giảm ${v.giaTriGiam}%` : `Giảm ${VND(v.giaTriGiam)}`}
                                      </span>
                                    </button>
                                  ))}
                                </>
                              )}
                              {availableDiscount.filter(v => v.kieuGiamGia !== 3 && v.isPersonal).length > 0 && (
                                <>
                                  <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-royal">Ví của bạn</div>
                                  {availableDiscount.filter(v => v.kieuGiamGia !== 3 && v.isPersonal).map(v => (
                                    <button key={v.maCode} onClick={() => { handleSelectDiscountVoucher(v); setDiscountVouchersOpen(false) }}
                                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-gold/10 border-b last:border-b-0 transition flex items-center justify-between">
                                      <span className="font-medium">{v.maCode}</span>
                                      <span className="text-emerald-deep text-xs font-medium">
                                        {v.kieuGiamGia === 1 ? `Giảm ${v.giaTriGiam}%` : `Giảm ${VND(v.giaTriGiam)}`}
                                      </span>
                                    </button>
                                  ))}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  {discountMsg && <p className="text-bordeaux text-xs mt-1">{discountMsg}</p>}
                </div>
                <div className="border-t pt-3">
                  <h2 className="font-semibold mb-2 flex items-center gap-2 text-sm"><Truck className="h-4 w-4 text-emerald-deep" /> Miễn phí vận chuyển (Voucher)</h2>
                  <p className="text-xs text-stone mb-2">Chọn voucher cá nhân của bạn</p>
                  {freeshipVoucher ? (
                    <div className="inline-flex items-center gap-2 bg-emerald-deep/10 border border-emerald-deep/20 px-3 py-1.5 rounded-full text-sm">
                      <span className="text-emerald-deep font-medium">{freeshipVoucher.maCode} — Miễn phí vận chuyển</span>
                      <button onClick={() => { setFreeshipVoucher(null); setFreeshipMsg('') }} className="text-emerald-deep hover:text-emerald-deep">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <button onClick={() => setVouchersOpen(!vouchersOpen)} type="button"
                        className="w-full flex items-center justify-between border rounded-lg px-3 py-2 text-sm bg-ivory hover:border-gold transition">
                        <span className="text-stone">Chọn voucher freeship...</span>
                        <ChevronRight className={`h-4 w-4 text-stone transition-transform ${vouchersOpen ? 'rotate-90' : ''}`} />
                      </button>
                      {vouchersOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-ivory border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {userVouchers.length === 0 ? (
                            <p className="text-center text-stone py-4 text-sm">Không có voucher khả dụng</p>
                          ) : (
                            userVouchers.filter(v => v.kieuGiamGia === 3).map(v => (
                              <button key={v.maVoucherNguoiDung} onClick={() => handleSelectFreeship(v)}
                                className="w-full text-left px-3 py-2.5 text-sm hover:bg-gold/10 border-b last:border-b-0 transition">
                                <span className="font-medium">{v.maCode}</span>
                                {v.ngayHetHan && <span className="text-xs text-stone ml-2">HSD: {new Date(v.ngayHetHan).toLocaleDateString('vi-VN')}</span>}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {freeshipMsg && <p className="text-bordeaux text-xs mt-1">{freeshipMsg}</p>}
                </div>
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-semibold flex items-center gap-2 text-sm"><Coins className="h-4 w-4 text-gold" /> Điểm tích lũy</h2>
                    <div className="flex items-center gap-1">
                      <button onClick={refreshDiem} className="p-1.5 text-stone hover:text-gold hover:bg-gold/10 rounded-lg transition" title="Cập nhật số dư">
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={loadDiemHistory} className="p-1.5 text-stone hover:text-gold hover:bg-gold/10 rounded-lg transition" title="Lịch sử giao dịch">
                        <History className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {soDiemHienCo > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-stone">
                        <span>Số dư: <strong className="text-gold-hover">{soDiemHienCo.toLocaleString()} điểm</strong></span>
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
                  ) : (
                    <p className="text-xs text-stone">Bạn chưa có điểm tích lũy. <a href="/tich-diem" className="text-gold underline">Xem chi tiết</a></p>
                  )}
                </div>
              </div>

              {ghnError && <p className="text-bordeaux text-xs text-center">Không thể tính phí vận chuyển. Vui lòng kiểm tra lại địa chỉ hoặc thử lại sau.</p>}
              <div className="flex gap-3">
                <button onClick={() => goToStep('payment')} className="flex-1 border-2 border-stone/20 text-ink-soft py-3 rounded-xl font-semibold hover:bg-ivory-100 transition">Quay lại</button>
                <button onClick={requestPlace} disabled={placing || ghnError}
                  className="flex-1 bg-gold text-noir py-3 rounded-xl font-semibold hover:bg-gold-hover transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {placing ? <><Loader className="h-5 w-5 animate-spin" /> Đang xử lý...</> : 'Đặt hàng ngay'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="bg-ivory rounded-xl shadow-sm border p-6 sticky top-4">
            <h2 className="font-semibold mb-4">Tóm tắt đơn hàng {selectedItems ? `(${cart.length})` : ''}</h2>
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
              {cart.map((i) => (
                <div key={i.maBienThe} className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-ivory-100 rounded-lg overflow-hidden shrink-0">
                    <SafeImg src={i.urlAnh} alt="" className="w-full h-full object-cover object-center" fallback="https://placehold.co/100x100/e2e8f0/475569?text=Polo" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{i.tenSanPham}</p>
                    <p className="text-xs text-stone">x{i.soLuong}</p>
                  </div>
                  <p className="text-sm font-semibold">{VND(i.donGia * i.soLuong)}</p>
                </div>
              ))}
            </div>
            <hr className="border-t" />
            <div className="pt-3 space-y-2 text-sm">
              {discount > 0 && (
                <div className="flex justify-between text-emerald-deep">
                  <span>Giảm giá</span>
                  <span>-{VND(discount)}</span>
                </div>
              )}
              {freeshipDiscount > 0 && (
                <div className="flex justify-between text-emerald-deep">
                  <span>Miễn phí vận chuyển</span>
                  <span>-{VND(freeshipDiscount)}</span>
                </div>
              )}
              {tienGiamDiem > 0 && (
                <div className="flex justify-between text-gold">
                  <span>Giảm điểm</span>
                  <span>-{VND(tienGiamDiem)}</span>
                </div>
              )}
              <div className="flex justify-between text-stone">
                <span>Phí vận chuyển</span>
                <span>{ghnLoading ? <Loader className="h-4 w-4 animate-spin inline" /> : ghnError ? <span className="text-bordeaux text-xs">Lỗi</span> : ghnFee !== null ? VND(effectiveShippingFee) : '---'}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Tổng cộng</span>
                <span className="text-gold">{VND(finalTotal)}</span>
              </div>
            </div>
            <p className="text-xs text-stone text-center mt-3">🔒 Thanh toán an toàn & bảo mật</p>
          </div>
        </div>
      </div>
    </div>

      {vietQrData && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={() => { clearInterval(qrPollRef.current); clearInterval(qrTimerRef.current); setVietQrData(null) }}>
        <div className="bg-ivory rounded-3xl max-w-md w-full mx-4 p-6 animate-scale-in text-center"
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Quét mã QR để thanh toán</h3>
            <button onClick={() => { clearInterval(qrPollRef.current); clearInterval(qrTimerRef.current); setVietQrData(null) }} className="text-stone hover:text-stone">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="bg-ivory rounded-xl p-4 border-2 border-gold/10 mb-4 inline-block">
            <img src={vietQrData.qrUrl} alt="VietQR" className="w-64 h-64 mx-auto" />
          </div>

          <div className="flex justify-center gap-4 mb-4 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-gold">{Math.floor(qrTimer / 60)}:{String(qrTimer % 60).padStart(2, '0')}</p>
              <p className="text-xs text-stone">Thời gian còn lại</p>
            </div>
          </div>

          <div className="w-full bg-ivory-100 rounded-full h-2 mb-4">
            <div className="bg-gold h-2 rounded-full transition-all duration-1000" style={{ width: `${(qrTimer / 900) * 100}%` }} />
          </div>

          <div className="text-left space-y-2 text-sm mb-4">
            <p><span className="text-stone">Ngân hàng:</span> <span className="font-medium">{vietQrData.bankName}</span></p>
            <p><span className="text-stone">Số tài khoản:</span> <span className="font-medium">{vietQrData.accountNumber}</span></p>
            <p><span className="text-stone">Chủ tài khoản:</span> <span className="font-medium">{vietQrData.accountName}</span></p>
            <p><span className="text-stone">Số tiền:</span> <span className="font-medium text-gold">{VND(vietQrData.amount)}</span></p>
          </div>

          <p className="text-xs text-stone mb-4">Sử dụng ứng dụng ngân hàng để quét mã QR và thanh toán</p>

          {qrTimer === 0 ? (
            <button onClick={() => { clearInterval(qrPollRef.current); clearInterval(qrTimerRef.current); setVietQrData(null); setVietQrData({ ...vietQrData }) }}
              className="w-full bg-gold/100 text-white font-semibold py-3 rounded-xl hover:bg-gold flex items-center justify-center gap-2">
              Tạo lại mã QR
            </button>
          ) : (
            <button onClick={handleConfirmQr} disabled={confirmingQr}
              className="w-full bg-gold text-noir font-semibold py-3 rounded-xl hover:bg-gold-hover disabled:opacity-50 flex items-center justify-center gap-2">
              {confirmingQr ? <Loader className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
              {confirmingQr ? 'Đang xử lý...' : 'Tôi đã thanh toán'}
            </button>
          )}
      </div>
    </div>
      )}

      {showDiemHistory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowDiemHistory(false)}>
          <div className="bg-ivory rounded-2xl max-w-lg w-full mx-4 animate-scale-in max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b shrink-0">
              <h3 className="font-bold flex items-center gap-2"><History className="h-5 w-5 text-gold" /> Lịch sử giao dịch điểm</h3>
              <button onClick={() => setShowDiemHistory(false)} className="text-stone hover:text-stone">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {diemHistoryLoading ? (
                <div className="flex items-center justify-center py-8"><Loader className="h-6 w-6 animate-spin text-gold" /></div>
              ) : diemHistoryData.length === 0 ? (
                <p className="text-center text-stone py-8 text-sm">Chưa có giao dịch nào</p>
              ) : (
                diemHistoryData.map(gd => {
                  const isTich = gd.loaiGiaoDich === 1
                  const isDung = gd.loaiGiaoDich === 2
                  const isHetHan = gd.loaiGiaoDich === 3
                  return (
                    <div key={gd.maGiaoDich} className={`border rounded-lg px-3 py-2.5 ${isTich ? 'bg-emerald-deep/10 border-emerald-deep/20' : isDung ? 'bg-gold/10 border-gold/20' : 'bg-bordeaux/10 border-bordeaux/20'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{isTich ? 'Tích lũy' : isDung ? 'Đã dùng' : 'Hết hạn'}</span>
                        <span className={`font-semibold text-sm ${isTich ? 'text-emerald-deep' : 'text-bordeaux'}`}>
                          {isTich ? '+' : '-'}{gd.soDiem?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-stone mt-0.5">
                        <span>{new Date(gd.thoiGian).toLocaleString('vi-VN')}</span>
                        <span>Số dư: {gd.soDuSau?.toLocaleString()}</span>
                      </div>
                      {gd.donHang?.maDonHang && (
                        <p className="text-xs text-stone mt-0.5">Đơn hàng #{gd.donHang.maDonHang}</p>
                      )}
                    </div>
                  )
                })
              )}
            </div>
            <div className="border-t p-4 shrink-0">
              <a href="/tich-diem" className="block w-full text-center text-sm text-gold font-medium hover:underline">Xem tất cả lịch sử →</a>
            </div>
          </div>
        </div>
      )}

      {showAddrModal && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={() => setShowAddrModal(false)}>
        <div className="bg-ivory rounded-3xl max-w-lg w-full mx-4 p-6 animate-scale-in max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Thêm địa chỉ mới</h3>
            <button onClick={() => setShowAddrModal(false)} className="text-stone hover:text-stone">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); setConfirmAddr(true) }} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input value={addrForm.tenNguoiNhan} onChange={(e) => setAddrForm({ ...addrForm, tenNguoiNhan: e.target.value })} placeholder="Tên người nhận" required
                className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-gold" />
              <input value={addrForm.soDienThoai} onChange={(e) => setAddrForm({ ...addrForm, soDienThoai: e.target.value })} placeholder="Số điện thoại" required
                className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-gold" />
            </div>
            <select value={addrProvinceId} onChange={(e) => { const id = Number(e.target.value); setAddrProvinceId(id); const name = e.target.options[e.target.selectedIndex]?.text || ''; setAddrForm({ ...addrForm, tinhThanhPho: name, provinceId: id || null }) }}
              className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-gold">
              <option value={0}>-- Chọn Tỉnh/Thành phố --</option>
              {provinces.map((p) => <option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <select value={addrDistrictId} onChange={(e) => { const id = Number(e.target.value); setAddrDistrictId(id); const name = e.target.options[e.target.selectedIndex]?.text || ''; setAddrForm({ ...addrForm, quanHuyen: name, districtId: id || null }) }}
                disabled={!addrProvinceId} className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-gold">
                <option value={0}>-- Chọn Quận/Huyện --</option>
                {addrDistricts.map((d) => <option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</option>)}
              </select>
              <select value={addrWardCode} onChange={(e) => { setAddrWardCode(e.target.value); const name = e.target.options[e.target.selectedIndex]?.text || ''; setAddrForm({ ...addrForm, phuongXa: name, wardCode: e.target.value || '' }) }}
                disabled={!addrDistrictId} className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-gold">
                <option value="">-- Chọn Phường/Xã --</option>
                {addrWards.map((w) => <option key={w.WardCode} value={w.WardCode}>{w.WardName}</option>)}
              </select>
            </div>
            <input value={addrForm.chiTietDiaChi} onChange={(e) => setAddrForm({ ...addrForm, chiTietDiaChi: e.target.value })} placeholder="Địa chỉ chi tiết (số nhà, đường)" required
              className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-gold" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={addrForm.laMacDinh} onChange={(e) => setAddrForm({ ...addrForm, laMacDinh: e.target.checked })} className="accent-blue-700" />
              Đặt làm mặc định
            </label>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowAddrModal(false)}
                className="flex-1 border-2 border-stone/20 text-ink-soft py-3 rounded-xl font-semibold hover:bg-ivory-100 transition text-sm">
                Hủy
              </button>
              <button type="submit" disabled={addrLoading}
                className="flex-1 bg-gold text-noir py-3 rounded-xl font-semibold hover:bg-gold-hover transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                {addrLoading ? <><Loader className="h-4 w-4 animate-spin" /> Đang lưu...</> : 'Thêm địa chỉ'}
              </button>
            </div>
          </form>
        </div>
      </div>
      )}


      <ConfirmDialog
        open={confirmOrder}
        title="Xác nhận đặt hàng"
        message="Bạn chắc chắn muốn đặt đơn hàng này?"
        confirmText="Đặt hàng"
        variant="gold"
        loading={placing}
        onConfirm={handlePlaceOrder}
        onCancel={() => setConfirmOrder(false)}
      />
      <ConfirmDialog
        open={confirmAddr}
        title="Thêm địa chỉ"
        message={`Bạn chắc chắn muốn thêm địa chỉ "${addrForm.chiTietDiaChi || ''}"?`}
        confirmText="Thêm"
        variant="gold"
        loading={addrLoading}
        onConfirm={handleAddAddress}
        onCancel={() => setConfirmAddr(false)}
      />
  </>)
}
