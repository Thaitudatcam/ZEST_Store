import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { getOrderDetail } from '../api/orders'
import LoadingSpinner from '../components/LoadingSpinner'
import { CheckCircle, XCircle, Loader, Clock } from 'lucide-react'

const POLL_TIMEOUT = 15000

const getPaymentStatus = (payments = []) => {
  // An order may contain an older failed attempt before the current one.
  // Prefer a conclusive paid/reconciliation state, then a still-pending attempt.
  if (payments.some((payment) => payment.trangThaiThanhToan === 4)) return 4
  if (payments.some((payment) => payment.trangThaiThanhToan === 2)) return 2
  if (payments.some((payment) => payment.trangThaiThanhToan === 1)) return 1
  if (payments.some((payment) => payment.trangThaiThanhToan === 3)) return 3
  return null
}

export default function PaymentResult() {
  const [searchParams] = useSearchParams()
  const [done, setDone] = useState(false)
  const [success, setSuccess] = useState(false)
  const [pending, setPending] = useState(false)
  const [reconciliation, setReconciliation] = useState(false)
  const [loading, setLoading] = useState(true)
  const [manualCheckLoading, setManualCheckLoading] = useState(false)
  const pollRef = useRef(null)
  const stopPolling = useRef(() => {})

  const orderId = searchParams.get('orderId')
  const amountReview = searchParams.get('review') === 'amount'

  const checkOrderStatus = async () => {
    if (!orderId) return
    setManualCheckLoading(true)
    try {
      const data = await getOrderDetail(orderId, { timeout: 10000 })
      const paymentStatus = getPaymentStatus(data.payments)
      if (paymentStatus !== null) {
        if ([2, 3, 4].includes(paymentStatus)) stopPolling.current()
        if (paymentStatus === 2) {
          setPending(false); setSuccess(true); setDone(true); setLoading(false)
          return true
        }
        if (paymentStatus === 3) {
          setPending(false); setSuccess(false); setDone(true); setLoading(false)
          return true
        }
        if (paymentStatus === 4) {
          setPending(false); setReconciliation(true); setDone(true); setLoading(false)
          return true
        }
      }
    } catch {} finally { setManualCheckLoading(false) }
    return false
  }

  useEffect(() => {
    setSuccess(false); setPending(false); setReconciliation(false); setLoading(true)
    if (!orderId) {
      setDone(true)
      setLoading(false)
      return
    }

    const startedAt = Date.now()
    let active = true
    const controller = new AbortController()
    // Independent deadline: an unresolved HTTP request must not trap the UI.
    const deadline = setTimeout(() => {
      if (!active) return
      active = false
      controller.abort()
      clearTimeout(pollRef.current)
      setPending(true); setDone(true); setLoading(false)
    }, POLL_TIMEOUT)
    stopPolling.current = () => {
      active = false
      controller.abort()
      clearTimeout(deadline)
      clearTimeout(pollRef.current)
    }

    const poll = async () => {
      if (Date.now() - startedAt > POLL_TIMEOUT) {
        // A delayed gateway callback is not the same as a failed payment.
        setPending(true)
        setDone(true)
        setLoading(false)
        return
      }

      try {
        const data = await getOrderDetail(orderId, { timeout: 10000, signal: controller.signal })
        if (!active) return
        const paymentStatus = getPaymentStatus(data.payments)
        if (paymentStatus !== null) {
          if (paymentStatus === 2) {
            clearTimeout(deadline)
            setPending(false); setSuccess(true); setDone(true); setLoading(false)
            return
          }
          if (paymentStatus === 3) {
            clearTimeout(deadline)
            setPending(false); setSuccess(false); setDone(true); setLoading(false)
            return
          }
          if (paymentStatus === 4) {
            clearTimeout(deadline)
            setPending(false); setReconciliation(true); setDone(true); setLoading(false)
            return
          }
        }
      } catch {}
      if (active) pollRef.current = setTimeout(poll, 2000)
    }
    poll()

    return () => {
      active = false
      controller.abort()
      clearTimeout(deadline)
      if (pollRef.current) clearTimeout(pollRef.current)
    }
  }, [orderId])

  if (amountReview) {
    return <div className="max-w-md mx-auto px-4 py-16 text-center">
      <Clock className="h-16 w-16 mx-auto text-gold mb-4" />
      <h1 className="text-2xl font-bold mb-3">Cần kiểm tra số tiền thanh toán</h1>
      <p className="text-stone mb-6">Kết quả từ cổng thanh toán chưa khớp với đơn hàng. Nếu đã bị trừ tiền, vui lòng không thanh toán lại và liên hệ cửa hàng để đối soát.</p>
      <Link to={orderId ? `/orders/${orderId}` : '/orders'} className="text-gold underline">Xem đơn hàng</Link>
    </div>
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <Loader className="h-16 w-16 mx-auto text-gold animate-spin mb-4" />
        <h1 className="text-xl font-bold mb-2">Đang xử lý thanh toán...</h1>
        <p className="text-stone mb-6">Vui lòng chờ trong giây lát</p>
        <p className="text-xs text-stone mb-4">Nếu bạn đã thanh toán xong, hãy nhấn "Kiểm tra"</p>
        <button onClick={checkOrderStatus} disabled={manualCheckLoading}
          className="inline-flex items-center gap-2 bg-gold text-noir px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gold-hover transition disabled:opacity-50">
          {manualCheckLoading ? <Loader className="h-4 w-4 animate-spin" /> : null}
          Kiểm tra
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      {pending ? (
        <Loader className="h-20 w-20 mx-auto text-gold animate-spin mb-4" />
      ) : reconciliation ? (
        <Clock className="h-20 w-20 mx-auto text-amber-600 mb-4" />
      ) : success ? (
        <CheckCircle className="h-20 w-20 mx-auto text-emerald-deep mb-4" />
      ) : (
        <XCircle className="h-20 w-20 mx-auto text-bordeaux mb-4" />
      )}
      <h1 className="text-2xl font-bold mb-2">
        {pending ? 'Đang chờ xác nhận thanh toán' : reconciliation ? 'Thanh toán đang được đối soát' : success ? 'Thanh toán thành công' : 'Thanh toán thất bại'}
      </h1>
      <p className="text-stone mb-6">
        {pending
          ? 'Chưa xác minh được kết quả thanh toán. Nếu đã bị trừ tiền, không thanh toán lại; hãy kiểm tra đơn hàng hoặc liên hệ cửa hàng.'
          : reconciliation
          ? 'Cổng thanh toán đã thu tiền sau khi đơn đóng. Cửa hàng sẽ kiểm tra và hoàn tiền cho bạn.'
          : success
          ? 'Cảm ơn bạn! Đơn hàng đã được xác nhận.'
          : 'Đã có lỗi xảy ra trong quá trình thanh toán.'}
      </p>
      {pending && orderId && (
        <button onClick={checkOrderStatus} disabled={manualCheckLoading}
          className="inline-flex items-center gap-2 bg-gold text-noir px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gold-hover transition disabled:opacity-50">
          {manualCheckLoading ? <Loader className="h-4 w-4 animate-spin" /> : null}
          Kiểm tra lại
        </button>
      )}
      {orderId && (
        <Link
          to={`/orders/${orderId}`}
          className="text-gold font-semibold hover:underline inline-block"
        >
          Xem chi tiết đơn hàng
        </Link>
      )}
      <div className="mt-4">
        <Link to="/" className="text-stone hover:underline text-sm">
          Tiếp tục mua sắm
        </Link>
      </div>
    </div>
  )
}
