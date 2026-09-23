import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown, Loader, Ticket, X } from 'lucide-react'
import { getAvailableCoupons, getBestOffer, validateCoupon } from '../api/coupons'
import { VND } from './ProductCard'

const offerLabel = (coupon) => {
  const value = Number(coupon.giaTriGiam || 0)
  if (Number(coupon.kieuGiamGia) === 3) return value === 0 ? 'Miễn phí vận chuyển' : `Giảm ${VND(value)} phí vận chuyển`
  return Number(coupon.kieuGiamGia) === 1 ? `Giảm ${value}% tiền hàng` : `Giảm ${VND(value)} tiền hàng`
}

export default function CheckoutCoupons({ cart, subtotal, discountCoupon, freeshipVoucher, onChange, onPendingChange, disabled = false }) {
  const inputId = useId()
  const listId = useId()
  const [code, setCode] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [reload, setReload] = useState(0)
  const [applying, setApplying] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [autoSelectedCode, setAutoSelectedCode] = useState('')
  const requestId = useRef(0)
  const pending = useRef(false)
  const autoAttemptedFor = useRef('')
  const busy = disabled || !!applying

  const productIds = [...new Set(cart.map(item => item.maSanPham).filter(Boolean))]
  const cartKey = cart.map(item => `${item.maBienThe}:${item.soLuong}:${item.donGia}`).join('|')
  const validationPayload = (maCode) => ({
    maCode,
    tongTien: subtotal,
    maSanPhamIds: productIds,
    items: cart.filter(item => item.maSanPham).map(item => ({
      maSanPham: item.maSanPham,
      thanhTien: Number(item.donGia || 0) * Number(item.soLuong || 1),
    })),
  })

  const selectCoupon = (coupon, automatic = false) => {
    const isShipping = Number(coupon.kieuGiamGia) === 3
    const otherCoupon = isShipping ? discountCoupon : freeshipVoucher
    const listedCoupon = coupons.find(item => item.maCode === coupon.maCode)
    const appliedCoupon = { ...coupon, exclusive: coupon.exclusive ?? listedCoupon?.exclusive ?? false }
    if (otherCoupon && (appliedCoupon.exclusive || otherCoupon.exclusive)) {
      setError(`Mã ${appliedCoupon.maCode} không thể dùng cùng ${otherCoupon.maCode}. Vui lòng bỏ mã đang dùng trước.`)
      return false
    }
    onChange(isShipping
      ? { discountCoupon, freeshipVoucher: appliedCoupon }
      : { discountCoupon: appliedCoupon, freeshipVoucher })
    setAutoSelectedCode(automatic ? coupon.maCode : '')
    setCode('')
    setMessage(automatic
      ? `Đã tự động chọn mã tốt nhất ${coupon.maCode}. Bạn vẫn có thể chọn mã khác.`
      : `Đã chọn mã ${coupon.maCode}.`)
    return true
  }

  const unavailableReason = (coupon) => {
    if (coupon.trangThaiThucTe != null && Number(coupon.trangThaiThucTe) !== 2) return coupon.trangThaiThucTeText || 'Mã chưa khả dụng'
    if (Number(coupon.giaTriDonToiThieu || 0) > subtotal) return `Mua thêm ${VND(Number(coupon.giaTriDonToiThieu) - subtotal)} để sử dụng`
    return ''
  }
  const usableCount = coupons.filter(coupon => !unavailableReason(coupon)).length

  useEffect(() => {
    // Ignore validation responses for a previous cart or an unmounted checkout.
    requestId.current += 1
    pending.current = false
    setApplying('')
    setError('')
    setMessage('')
    setAutoSelectedCode('')
    autoAttemptedFor.current = ''
    onPendingChange(false)
    return () => { requestId.current += 1 }
  }, [cart, onPendingChange])

  useEffect(() => {
    let current = true
    setLoading(true)
    setLoadError(false)
    setCoupons([])
    getAvailableCoupons(subtotal, productIds)
      .then(result => { if (current) setCoupons(Array.isArray(result) ? result : []) })
      .catch(() => { if (current) setLoadError(true) })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [cart, subtotal, reload])

  useEffect(() => {
    if (loading || loadError || disabled || usableCount === 0 || pending.current) return
    if (discountCoupon || freeshipVoucher) return
    const attemptKey = `${cartKey}|${subtotal}`
    if (autoAttemptedFor.current === attemptKey) return
    autoAttemptedFor.current = attemptKey

    let current = true
    pending.current = true
    const currentRequest = ++requestId.current
    setApplying('Mã tốt nhất')
    onPendingChange(true)
    setError('')
    setMessage('')

    getBestOffer(subtotal, productIds)
      .then(best => {
        if (!current || currentRequest !== requestId.current || !best?.found || !best.maCode) return null
        return validateCoupon(validationPayload(best.maCode))
      })
      .then(coupon => {
        if (!coupon || !current || currentRequest !== requestId.current) return
        selectCoupon(coupon, true)
      })
      .catch(() => {
        // Automatic selection is an enhancement; manual selection stays usable.
      })
      .finally(() => {
        if (current && currentRequest === requestId.current) {
          pending.current = false
          setApplying('')
          onPendingChange(false)
        }
      })

    return () => { current = false }
  // A new cart/subtotal gets one automatic attempt. Manual changes must not retrigger it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartKey, subtotal, loading, loadError, disabled, usableCount])

  const apply = async (requestedCode) => {
    const trimmedCode = requestedCode.trim()
    if (!trimmedCode || disabled || pending.current) return
    pending.current = true
    const currentRequest = ++requestId.current
    setApplying(trimmedCode)
    onPendingChange(true)
    setError('')
    setMessage('')
    try {
      const coupon = await validateCoupon({
        ...validationPayload(trimmedCode),
      })
      if (currentRequest !== requestId.current) return
      selectCoupon(coupon)
    } catch (err) {
      if (currentRequest === requestId.current) {
        setError(err.response?.data?.message || 'Chưa áp dụng được mã giảm giá. Vui lòng thử lại.')
      }
    } finally {
      if (currentRequest === requestId.current) {
        pending.current = false
        setApplying('')
        onPendingChange(false)
      }
    }
  }

  const remove = (coupon) => {
    onChange(Number(coupon.kieuGiamGia) === 3
      ? { discountCoupon, freeshipVoucher: null }
      : { discountCoupon: null, freeshipVoucher })
    if (autoSelectedCode === coupon.maCode) setAutoSelectedCode('')
    setError('')
    setMessage(`Đã bỏ mã ${coupon.maCode}.`)
  }

  return (
    <section aria-label="Mã giảm giá" className="min-w-0 border-y border-stone/10 py-4 space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Ticket className="h-4 w-4 text-gold shrink-0" aria-hidden="true" /> Mã giảm giá
      </h3>
      <form onSubmit={event => { event.preventDefault(); apply(code) }} className="flex gap-2">
        <label htmlFor={inputId} className="sr-only">Nhập mã giảm giá</label>
        <input id={inputId} value={code} onChange={event => setCode(event.target.value)}
          disabled={busy} maxLength={50} autoComplete="off" placeholder="Nhập mã giảm giá"
          className="min-w-0 flex-1 rounded-lg border border-stone/20 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 disabled:opacity-50" />
        <button type="submit" disabled={busy || !code.trim()}
          className="shrink-0 rounded-lg bg-gold/10 px-3 py-2.5 text-sm font-semibold text-ink hover:bg-gold/20 transition disabled:opacity-40">
          Chọn mã
        </button>
      </form>
      <button type="button" onClick={() => setExpanded(value => !value)} aria-expanded={expanded} aria-controls={listId}
        className="flex w-full items-center justify-between gap-2 text-left text-sm font-medium text-gold hover:text-gold-hover">
        <span>Chọn mã giảm giá{!loading && !loadError && usableCount > 0 ? ` (${usableCount})` : ''}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {expanded && (
        <div id={listId} className="rounded-xl border border-stone/15 bg-ivory/40 p-3">
          {loading ? <p role="status" className="flex items-center gap-2 text-xs text-stone"><Loader className="h-4 w-4 animate-spin" /> Đang tải mã giảm giá...</p>
            : loadError ? <div className="text-xs text-bordeaux" role="alert">Chưa tải được danh sách mã.
              <button type="button" onClick={() => setReload(value => value + 1)} className="ml-2 font-semibold underline">Thử lại</button>
            </div>
              : coupons.length === 0 ? <p className="text-xs leading-relaxed text-stone">Chưa có mã phù hợp với đơn hàng. Bạn vẫn có thể nhập mã được nhận ở trên.</p>
                : <ul className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {coupons.map(coupon => {
                    const selected = [discountCoupon?.maCode, freeshipVoucher?.maCode].includes(coupon.maCode)
                    const reason = unavailableReason(coupon)
                    return (
                      <li key={coupon.maCode} className={`rounded-lg border bg-white p-3 ${selected ? 'border-gold/50' : 'border-stone/10'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="break-words text-sm font-semibold text-ink">{coupon.maCode}</p>
                            <p className="mt-1 text-xs font-medium text-gold">{offerLabel(coupon)}</p>
                          </div>
                          <button type="button" aria-label={`Chọn mã ${coupon.maCode}`} onClick={() => apply(coupon.maCode)}
                            disabled={busy || selected || !!reason}
                            className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-md border border-gold/30 px-2.5 text-xs font-semibold text-ink hover:bg-gold/10 disabled:opacity-50">
                            {selected ? <><Check className="h-3 w-3" /> Đã chọn</> : 'Chọn mã'}
                          </button>
                        </div>
                        <p className="mt-2 text-xs text-stone">{Number(coupon.giaTriDonToiThieu) > 0 ? `Đơn từ ${VND(coupon.giaTriDonToiThieu)}` : 'Không yêu cầu đơn tối thiểu'}</p>
                        {coupon.soLuongConLai != null && <p className="mt-1 text-xs text-emerald-deep">Còn {coupon.soLuongConLai} lượt của bạn</p>}
                        {coupon.ngayKetThuc && <p className="mt-1 text-xs text-stone">Hạn dùng: {new Date(coupon.ngayKetThuc).toLocaleDateString('vi-VN')}</p>}
                        {coupon.isPersonal && <p className="mt-1 text-xs text-emerald-deep">Ưu đãi dành riêng cho bạn</p>}
                        {coupon.exclusive && <p className="mt-1 text-xs text-stone">Không dùng cùng mã khác</p>}
                        {reason && <p className="mt-1 text-xs text-bordeaux">{reason}</p>}
                      </li>
                    )
                  })}
                </ul>}
        </div>
      )}
      {[discountCoupon, freeshipVoucher].filter(Boolean).map(coupon => (
        <div key={coupon.maCode} className="flex items-center justify-between gap-2 rounded-lg border border-gold/20 bg-gold/5 px-3 py-2.5">
          <div className="min-w-0">
            <p className="flex items-start gap-1.5 text-sm font-semibold text-ink"><Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" /><span className="break-words">{coupon.maCode}</span></p>
            <p className="mt-1 text-xs text-stone">{Number(coupon.kieuGiamGia) === 3 ? offerLabel(coupon) : `Đã giảm ${VND(coupon.soTienGiam)}`}</p>
            {autoSelectedCode === coupon.maCode && <p className="mt-1 text-xs font-medium text-gold">Tự động chọn mã tốt nhất</p>}
          </div>
          <button type="button" aria-label={`Bỏ mã ${coupon.maCode}`} disabled={busy} onClick={() => remove(coupon)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone hover:bg-gold/10 hover:text-ink disabled:opacity-40">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      {applying && <p role="status" className="flex items-center gap-2 text-xs text-stone"><Loader className="h-3.5 w-3.5 animate-spin" /> Đang kiểm tra mã {applying}...</p>}
      {error && <p role="alert" className="text-xs leading-relaxed text-bordeaux">{error}</p>}
      {message && <p role="status" className="text-xs text-emerald-deep">{message}</p>}
      <p className="text-xs leading-relaxed text-stone">Chọn 1 mã giảm tiền hàng và 1 mã vận chuyển nếu được phép kết hợp.</p>
    </section>
  )
}
