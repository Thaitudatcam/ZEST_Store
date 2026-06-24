import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCart } from '../api/cart'
import { getAddresses } from '../api/users'
import { placeOrder } from '../api/orders'
import { createVnPayPayment, createMomoPayment, createZaloPayPayment } from '../api/payment'
import LoadingSpinner from '../components/LoadingSpinner'
import { VND } from '../components/ProductCard'
import { MapPin, CreditCard, Tag, ArrowLeft, Loader, Search, ChevronDown, X } from 'lucide-react'
import api from '../api/axios'
import SafeImg from '../components/SafeImg'

const PAYMENT_METHODS = [
  { value: 1, label: 'Thanh toán khi nhận hàng (COD)', desc: 'Trả tiền khi nhận hàng' },
  { value: 2, label: 'VNPay', desc: 'Thanh toán qua cổng VNPay' },
  { value: 3, label: 'Ví MoMo', desc: 'Thanh toán qua ví MoMo' },
  { value: 4, label: 'ZaloPay', desc: 'Thanh toán qua ZaloPay' },
]

export default function Checkout() {
  const navigate = useNavigate()
  const [cart, setCart] = useState([])
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [couponMsg, setCouponMsg] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponModal, setCouponModal] = useState(false)
  const [availCoupons, setAvailCoupons] = useState([])
  const [availLoading, setAvailLoading] = useState(false)
  const [form, setForm] = useState({
    maDiaChi: '',
    tenNguoiNhan: '',
    sdtNguoiNhan: '',
    diaChiGiaoHang: '',
    ghiChu: '',
    phuongThucThanhToan: 1,
  })

  useEffect(() => {
    Promise.all([getCart(), getAddresses()])
      .then(([cartData, addrData]) => {
        setCart(cartData)
        setAddresses(addrData)
        const def = addrData.find((a) => a.laMacDinh) || addrData[0]
        if (def) {
          setForm((f) => ({
            ...f,
            maDiaChi: def.maDiaChi,
            tenNguoiNhan: def.tenNguoiNhan,
            sdtNguoiNhan: def.soDienThoai,
            diaChiGiaoHang: def.chiTietDiaChi,
          }))
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const selectAddress = (a) => {
    setForm((f) => ({
      ...f,
      maDiaChi: a.maDiaChi,
      tenNguoiNhan: a.tenNguoiNhan,
      sdtNguoiNhan: a.soDienThoai,
      diaChiGiaoHang: a.chiTietDiaChi,
    }))
  }

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponMsg('')
    try {
      const res = await api.post('/coupons/validate', { maCode: couponCode.trim(), giaTriDon: rawTotal })
      setCoupon(res.data)
      setCouponMsg('')
    } catch (err) {
      setCoupon(null)
      setCouponMsg(err.response?.data?.message || 'Mã giảm giá không hợp lệ')
    } finally {
      setCouponLoading(false)
    }
  }

  const handleOpenCouponModal = async () => {
    setCouponModal(true)
    setAvailLoading(true)
    try {
      const data = await api.get('/coupons/available', { params: { tongTien: rawTotal } }).then(r => r.data)
      setAvailCoupons(data)
    } catch {
      setAvailCoupons([])
    } finally {
      setAvailLoading(false)
    }
  }

  const selectAvailCoupon = async (c) => {
    setCouponCode(c.maCode)
    setCouponModal(false)
    setCoupon(null)
    setCouponMsg('')
    try {
      setCouponLoading(true)
      const res = await api.post('/coupons/validate', { maCode: c.maCode, giaTriDon: rawTotal })
      setCoupon(res.data)
    } catch (err) {
      setCouponMsg(err.response?.data?.message || 'Mã giảm giá không hợp lệ')
    } finally {
      setCouponLoading(false)
    }
  }

  const rawTotal = cart.reduce((s, i) => s + ((i.donGia || 0) * (i.soLuong || 1)), 0)
  const discount = coupon?.soTienGiam || 0
  const shippingFee = rawTotal >= 500000 ? 0 : 30000
  const finalTotal = Math.max(0, rawTotal - discount + shippingFee)

  const handlePlaceOrder = async () => {
    if (!form.tenNguoiNhan || !form.sdtNguoiNhan || !form.diaChiGiaoHang) {
      alert('Vui lòng nhập đầy đủ thông tin giao hàng')
      return
    }
    if (cart.length === 0) {
      alert('Giỏ hàng trống')
      return
    }
    setPlacing(true)
    try {
      const result = await placeOrder({
        tenNguoiNhan: form.tenNguoiNhan,
        sdtNguoiNhan: form.sdtNguoiNhan,
        diaChiGiaoHang: form.diaChiGiaoHang,
        ghiChu: form.ghiChu,
        phuongThucThanhToan: form.phuongThucThanhToan,
        maCode: couponCode.trim() || undefined,
        phiVanChuyen: shippingFee,
      })

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
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Đặt hàng thất bại')
    } finally {
      setPlacing(false)
    }
  }

  if (loading) return <LoadingSpinner className="py-20" />

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Thanh toán</h1>
        <p className="text-gray-500">Giỏ hàng trống</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => navigate('/cart')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4" /> Quay lại giỏ hàng
      </button>
      <h1 className="text-2xl font-bold mb-6">Thanh toán</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">

          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><MapPin className="h-5 w-5 text-blue-700" /> Thông tin giao hàng</h2>
            {addresses.length > 0 && (
              <div className="space-y-2 mb-4">
                {addresses.map((a) => (
                  <label key={a.maDiaChi} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer ${form.maDiaChi === a.maDiaChi ? 'border-blue-500 bg-blue-50' : ''}`}>
                    <input type="radio" name="address" checked={form.maDiaChi === a.maDiaChi} onChange={() => selectAddress(a)} className="mt-1" />
                    <div>
                      <p className="font-medium text-sm">{a.tenNguoiNhan} — {a.soDienThoai}</p>
                      <p className="text-sm text-gray-500">{a.chiTietDiaChi}</p>
                      {a.laMacDinh && <span className="text-xs text-blue-600 font-semibold">Mặc định</span>}
                    </div>
                  </label>
                ))}
              </div>
            )}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input value={form.tenNguoiNhan} onChange={(e) => setForm((f) => ({ ...f, tenNguoiNhan: e.target.value }))} placeholder="Tên người nhận" className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input value={form.sdtNguoiNhan} onChange={(e) => setForm((f) => ({ ...f, sdtNguoiNhan: e.target.value }))} placeholder="Số điện thoại" className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <input value={form.diaChiGiaoHang} onChange={(e) => setForm((f) => ({ ...f, diaChiGiaoHang: e.target.value }))} placeholder="Địa chỉ giao hàng" className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <textarea value={form.ghiChu} onChange={(e) => setForm((f) => ({ ...f, ghiChu: e.target.value }))} placeholder="Ghi chú (không bắt buộc)" rows={2} className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><CreditCard className="h-5 w-5 text-blue-700" /> Phương thức thanh toán</h2>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((pm) => (
                <label key={pm.value} className={`flex items-start gap-3 p-3 border rounded-lg ${pm.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${form.phuongThucThanhToan === pm.value ? 'border-blue-500 bg-blue-50' : ''}`}>
                  <input type="radio" name="payment" value={pm.value} checked={form.phuongThucThanhToan === pm.value} disabled={pm.disabled} onChange={(e) => setForm((f) => ({ ...f, phuongThucThanhToan: Number(e.target.value) }))} className="mt-1" />
                  <div>
                    <p className="font-medium text-sm">{pm.label}</p>
                    <p className="text-xs text-gray-400">{pm.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><Tag className="h-5 w-5 text-blue-700" /> Mã giảm giá</h2>
            <div className="flex gap-2">
              <input value={couponCode} onChange={(e) => { setCouponCode(e.target.value); setCoupon(null); setCouponMsg('') }} placeholder="Nhập mã giảm giá" className="border rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={handleValidateCoupon} disabled={couponLoading || !couponCode.trim()} className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-50">
                {couponLoading ? <Loader className="h-4 w-4 animate-spin" /> : 'Áp dụng'}
              </button>
              <button onClick={handleOpenCouponModal} type="button" className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 border transition flex items-center gap-1">
                <Search className="h-4 w-4" /> Chọn
              </button>
            </div>
            {coupon && (
              <div className="flex items-center justify-between mt-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <span className="text-sm text-green-700 font-medium">{coupon.maCode} — Giảm {VND(coupon.soTienGiam)}</span>
                <button onClick={() => { setCoupon(null); setCouponCode(''); setCouponMsg('') }} className="text-green-500 hover:text-green-700"><X className="h-4 w-4" /></button>
              </div>
            )}
            {couponMsg && <p className="text-red-500 text-sm mt-2">{couponMsg}</p>}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border p-6 sticky top-4">
            <h2 className="font-semibold mb-4">Đơn hàng</h2>
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
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
            <div className="border-t pt-3 space-y-2 text-sm">
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
                <span>{shippingFee === 0 ? 'Miễn phí' : VND(shippingFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Tổng cộng</span>
                <span className="text-blue-700">{VND(finalTotal)}</span>
              </div>
            </div>
            <button onClick={handlePlaceOrder} disabled={placing} className="mt-4 w-full bg-blue-700 text-white font-semibold py-3 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition flex items-center justify-center gap-2">
              {placing ? <><Loader className="h-5 w-5 animate-spin" /> Đang xử lý...</> : 'Đặt hàng'}
            </button>
          </div>
        </div>

        {couponModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in p-4"
            onClick={() => setCouponModal(false)}>
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[70vh] flex flex-col animate-scale-in"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-bold text-lg">Chọn mã giảm giá</h3>
                <button onClick={() => setCouponModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
              </div>
              <div className="overflow-y-auto p-4 space-y-2">
                {availLoading ? (
                  <div className="flex justify-center py-8"><div className="h-6 w-6 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" /></div>
                ) : availCoupons.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">Không có mã giảm giá nào phù hợp</p>
                ) : (
                  availCoupons.map(c => (
                    <button key={c.maPhieuGiamGia} onClick={() => selectAvailCoupon(c)}
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
      </div>
    </div>
  )
}