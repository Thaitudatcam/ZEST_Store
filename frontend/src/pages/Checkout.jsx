import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getCart } from '../api/cart'
import { getAddresses, addAddress } from '../api/users'
import { placeOrder } from '../api/orders'

import { createVnPayPayment, createMomoPayment, createZaloPayPayment, createVietQrPayment, confirmVietQrPayment } from '../api/payment'
import { getServices, calculateShippingFee } from '../api/ghn'
import { getProvinces, getDistricts, getWards } from '../api/address'
import { getUserVouchers } from '../api/userVoucher'
import { getAvailableCoupons } from '../api/coupons'
import LoadingSpinner from '../components/LoadingSpinner'
import { useToast } from '../context/ToastContext'
import { VND } from '../components/ProductCard'
import ConfirmDialog from '../components/ConfirmDialog'
import { MapPin, CreditCard, Tag, ArrowLeft, Loader, Check, X, QrCode, Truck, Banknote, Smartphone, Landmark, ChevronRight, Plus, ShieldCheck, RefreshCcw, Lock } from 'lucide-react'
import api from '../api/axios'
import SafeImg from '../components/SafeImg'
import SearchableSelect from '../components/SearchableSelect'

const PAYMENT_OPTIONS = [
  { value: 1, label: 'Thanh toán khi nhận hàng (COD)', icon: Truck },
  { value: 2, label: 'Thẻ ATM/Visa/Master/JCB/Gi Pay qua VNPay QR', icon: CreditCard },
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

export default function Checkout() {
  const navigate = useNavigate()
  const location = useLocation()
  const selectedItems = location.state?.selectedItems

  const toast = useToast()
  const [cart, setCart] = useState(selectedItems || [])
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(!selectedItems)
  const [placing, setPlacing] = useState(false)
  const [vietQrData, setVietQrData] = useState(null)
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
  // provinces đã đủ 63 tỉnh (api/address tự chuyển sang dataset local khi GHN mock)
  const provinceOptions = provinces
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

  useEffect(() => {
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

    // Chỉ đi nhánh ID khi ID còn tồn tại trong danh sách hiện tại
    // (địa chỉ cũ lưu ID GHN sẽ rơi xuống khớp theo tên bên dưới)
    const provList = provs || provinces
    const idKnown = address?.provinceId
      && provList.some((p) => String(p.ProvinceID) === String(address.provinceId))
    if (idKnown) {
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

    provs = provList
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
        // Dataset local dùng mã chữ ("001") — ép số cho backend, mock bỏ qua ID
        toDistrictId: Number(selectedDistrictId),
        toWardCode: selectedWardCode,
        weight: Math.max(weight, 500),
        provinceName: form.tinhThanhPho,
      }).then((res) => {
        // Backend /ghn/fee trả {data:{total}} (mock 30000 khi chưa cấu hình token),
        // còn /calculate trả {fee} — đọc cả 2 dạng để không kẹt ở "chờ tính phí"
        const fee = res?.fee ?? res?.data?.total ?? null
        if (res?.error || fee == null) {
          setGhnFee(null)
          setGhnError(true)
        } else {
          setGhnFee(fee)
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
  const suggestedCoupons = (availableDiscount || [])
    .filter(v => v.kieuGiamGia !== 3 && (!discountCoupon || v.maCode !== discountCoupon.maCode))
  const suggestedDiscount = suggestedCoupons.length
    ? suggestedCoupons.reduce((a, b) => (Number(b.soTienGiam || 0) > Number(a.soTienGiam || 0) ? b : a))
    : null
  const discount = discountCoupon?.soTienGiam || 0
  const freeshipDiscount = freeshipVoucher?.kieuGiamGia === 3
    ? (freeshipVoucher.giaTriGiam === 0 ? shippingFee : Math.min(freeshipVoucher.giaTriGiam, shippingFee))
    : 0
  const effectiveShippingFee = shippingFee - freeshipDiscount

  const finalTotal = Math.max(0, rawTotal - discount + effectiveShippingFee)

  const validatePhone = (phone) => /^[0-9]{10,11}$/.test(phone)

  const requestPlace = () => {
    if (!form.tenNguoiNhan || !form.sdtNguoiNhan || !form.diaChiGiaoHang) { toast.error('Vui lòng điền đầy đủ thông tin giao hàng'); return }
    if (!validatePhone(form.sdtNguoiNhan)) { toast.error('Số điện thoại phải có 10-11 chữ số'); return }
    if (cart.length === 0) { return }
    if (!selectedDistrictId || !selectedWardCode) { toast.error('Vui lòng chọn Tỉnh/Quận/Phường trong danh sách để tính phí ship'); return }
    if (ghnFee === null) { toast.error('Chưa tính được phí vận chuyển, kiểm tra lại Tỉnh/Quận/Phường đã chọn'); return }
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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">

          <div className="bg-white border border-stone/10 rounded-xl p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2 text-base"><MapPin className="h-5 w-5 text-gold" /> ĐỊA CHỈ GIAO HÀNG</h2>

            {addresses.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Địa chỉ của bạn</p>
                <div className="space-y-2">
                  {addresses.map((a) => (
                    <div key={a.maDiaChi}
                      onClick={() => selectAddress(a)}
                      className={`relative p-3 border-2 rounded-xl cursor-pointer transition-all duration-200
                        ${form.maDiaChi === a.maDiaChi ? 'border-gold bg-gold/5' : 'border-stone/15 hover:border-stone/30'}`}>
                      <div className="flex items-start gap-2">
                        <input type="radio" name="address" checked={form.maDiaChi === a.maDiaChi} readOnly className="mt-1 accent-[var(--primary-color)]" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{a.tenNguoiNhan} — {a.soDienThoai}</p>
                          <p className="text-sm text-stone truncate">{a.chiTietDiaChi}{a.tinhThanhPho ? `, ${a.tinhThanhPho}` : ''}</p>
                          {a.laMacDinh && <span className="text-[10px] font-semibold bg-gold/20 text-gold px-2 py-0.5 rounded-full mt-1 inline-block">MẶC ĐỊNH</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => setShowAddrModal(true)} className="w-full border-2 border-dashed border-stone/20 rounded-xl py-2.5 px-4 text-sm text-stone hover:border-gold hover:text-gold transition flex items-center justify-center gap-2 mb-5">
              <Plus className="h-4 w-4" /> Nhập địa chỉ khác
            </button>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <SearchableSelect
                  value={selectedProvinceId}
                  options={provinceOptions}
                  idKey="ProvinceID" labelKey="ProvinceName"
                  placeholder="Tỉnh/Thành phố" searchPlaceholder="Gõ để tìm tỉnh/thành..."
                  onChange={(id, name) => { setSelectedProvinceId(id === '' ? 0 : id); setSelectedDistrictId(''); setSelectedWardCode(''); setWards([]); setGhnFee(null); setGhnError(false); setForm((f) => ({ ...f, tinhThanhPho: name })) }}
                />
                <SearchableSelect
                  value={selectedDistrictId}
                  options={districts.map((d) => ({ DistrictID: d.DistrictID, DistrictName: d.DistrictName }))}
                  idKey="DistrictID" labelKey="DistrictName"
                  placeholder="Quận/Huyện" searchPlaceholder="Gõ để tìm quận/huyện..."
                  disabled={!selectedProvinceId}
                  onChange={(id, name) => { setSelectedDistrictId(id); setSelectedWardCode(''); setWards([]); setGhnFee(null); setForm((f) => ({ ...f, quanHuyen: name })) }}
                />
                <SearchableSelect
                  value={selectedWardCode}
                  options={wards.map((w) => ({ WardCode: w.WardCode, WardName: w.WardName }))}
                  idKey="WardCode" labelKey="WardName"
                  placeholder="Phường/Xã" searchPlaceholder="Gõ để tìm phường/xã..."
                  disabled={!selectedDistrictId}
                  onChange={(code, name) => { setSelectedWardCode(code); setForm((f) => ({ ...f, phuongXa: name })) }}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-stone uppercase tracking-wide mb-1 block">Địa chỉ</label>
                <input value={form.diaChiGiaoHang} onChange={(e) => setForm((f) => ({ ...f, diaChiGiaoHang: e.target.value }))} placeholder="Số nhà, đường..."
                  className="border border-stone/20 rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold" />
              </div>
              <div>
                <label className="text-xs font-medium text-stone uppercase tracking-wide mb-1 block">Ghi chú</label>
                <textarea value={form.ghiChu} onChange={(e) => setForm((f) => ({ ...f, ghiChu: e.target.value }))} placeholder="Nhập ghi chú của bạn (nếu có)" rows={2}
                  className="border border-stone/20 rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold resize-none" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-stone/10 rounded-xl p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2 text-base"><CreditCard className="h-5 w-5 text-gold" /> PHƯƠNG THỨC THANH TOÁN</h2>
            <div className="space-y-3">
              {PAYMENT_OPTIONS.map((pm) => (
                <label key={pm.value}
                  className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all duration-200
                    ${form.phuongThucThanhToan === pm.value ? 'border-gold bg-gold/5' : 'border-stone/15 hover:border-stone/30'}`}>
                  <input type="radio" name="payment" checked={form.phuongThucThanhToan === pm.value}
                    onChange={() => setForm((f) => ({ ...f, phuongThucThanhToan: pm.value }))}
                    className="accent-[var(--primary-color)] shrink-0" />
                  <span className="text-sm font-medium">{pm.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white border border-stone/10 rounded-xl p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2 text-base">GIỎ HÀNG <span className="text-sm font-normal text-stone">({cart.length} sản phẩm)</span></h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone/10">
                    <th className="text-left font-semibold pb-3 pr-4">Tên Hàng</th>
                    <th className="text-left font-semibold pb-3 px-4">Giá</th>
                    <th className="text-center font-semibold pb-3 px-4">Số Lượng</th>
                    <th className="text-right font-semibold pb-3 pl-4">Tổng Tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.maBienThe} className="border-b border-stone/5 last:border-0">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 bg-stone/5 rounded-lg overflow-hidden shrink-0">
                            <SafeImg src={item.urlAnh} alt="" className="w-full h-full object-cover object-center" fallback="https://placehold.co/100x100/e2e8f0/475569?text=Polo" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gold">{item.tenSanPham}</p>
                            <p className="text-xs text-stone">Mã SP: {item.maSanPhamCode || item.sku || '---'}</p>
                            {(item.tenKichCo || item.tenMauSac) && (
                              <p className="text-xs text-stone">
                                {item.tenKichCo && `Kích thước: ${item.tenKichCo}`}
                                {item.tenKichCo && item.tenMauSac && ' · '}
                                {item.tenMauSac && `Màu Sắc: ${item.tenMauSac}`}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-gold">{VND(item.donGia)}</span>
                        {item.giaGoc && item.giaGoc > item.donGia && (
                          <span className="block text-xs text-stone line-through">{VND(item.giaGoc)}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">{item.soLuong || 1}</td>
                      <td className="py-3 pl-4 text-right font-semibold whitespace-nowrap">{VND(item.donGia * (item.soLuong || 1))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white border border-stone/10 rounded-xl p-6 sticky top-4 space-y-5">
            <h2 className="font-semibold text-base">Tóm tắt đơn hàng</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-stone">Tạm tính</span>
                <span className="font-medium">{VND(rawTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone">Phí vận chuyển</span>
                <span>{ghnLoading ? <Loader className="h-4 w-4 animate-spin inline" /> : ghnError ? <span className="text-bordeaux text-xs">Lỗi</span> : ghnFee !== null ? VND(effectiveShippingFee) : '---'}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-deep">
                  <span>Mã giảm giá</span>
                  <span>-{VND(discount)}</span>
                </div>
              )}
              {freeshipDiscount > 0 && (
                <div className="flex justify-between text-emerald-deep">
                  <span>Miễn phí vận chuyển</span>
                  <span>-{VND(freeshipDiscount)}</span>
                </div>
              )}
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between font-bold text-lg">
                <span>Tổng thanh toán</span>
                <span className="text-gold">{VND(finalTotal)}</span>
              </div>
            </div>

            <div className="bg-gold/5 border border-gold/15 rounded-xl p-4 text-xs text-stone space-y-1.5">
              <p className="font-medium text-sm text-ink-soft flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-gold" /> An toàn mua sắm chính hãng tại <span className="text-gold font-semibold">ZestStore.vn</span></p>
              <p>Được kiểm tra hàng trước khi thanh toán & hoàn tiền</p>
              <p>Được đổi hàng trong 15 ngày theo chính sách (*)</p>
            </div>

            <button onClick={requestPlace} disabled={placing || ghnError || cart.length === 0}
              className="w-full bg-gold text-noir py-3.5 rounded-xl font-bold text-base hover:bg-gold-hover transition disabled:opacity-50 flex items-center justify-center gap-2">
              {placing ? <><Loader className="h-5 w-5 animate-spin" /> Đang xử lý...</> : 'ĐẶT HÀNG'}
            </button>

            <p className="text-xs text-stone text-center">⚠️ Đơn hàng không thể thay đổi. ZestStore sẽ không gọi điện xác nhận</p>
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
            <SearchableSelect
              value={addrProvinceId}
              options={provinceOptions}
              idKey="ProvinceID" labelKey="ProvinceName"
              placeholder="-- Chọn Tỉnh/Thành phố --" searchPlaceholder="Gõ để tìm tỉnh/thành..."
              onChange={(id, name) => { setAddrProvinceId(id === '' ? 0 : id); setAddrForm({ ...addrForm, tinhThanhPho: name, provinceId: id === '' ? null : id }) }}
            />
            <div className="grid grid-cols-2 gap-3">
              <SearchableSelect
                value={addrDistrictId}
                options={addrDistricts.map((d) => ({ DistrictID: d.DistrictID, DistrictName: d.DistrictName }))}
                idKey="DistrictID" labelKey="DistrictName"
                placeholder="-- Chọn Quận/Huyện --" searchPlaceholder="Gõ để tìm quận/huyện..."
                disabled={!addrProvinceId}
                onChange={(id, name) => { setAddrDistrictId(id); setAddrForm({ ...addrForm, quanHuyen: name, districtId: id === '' ? null : id }) }}
              />
              <SearchableSelect
                value={addrWardCode}
                options={addrWards.map((w) => ({ WardCode: w.WardCode, WardName: w.WardName }))}
                idKey="WardCode" labelKey="WardName"
                placeholder="-- Chọn Phường/Xã --" searchPlaceholder="Gõ để tìm phường/xã..."
                disabled={!addrDistrictId}
                onChange={(code, name) => { setAddrWardCode(code); setAddrForm({ ...addrForm, phuongXa: name, wardCode: code || '' }) }}
              />
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
