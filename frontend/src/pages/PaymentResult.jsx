import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { getOrderDetail } from '../api/orders'
import LoadingSpinner from '../components/LoadingSpinner'
import { CheckCircle, XCircle, Loader } from 'lucide-react'

const POLL_TIMEOUT = 15000

export default function PaymentResult() {
  const [searchParams] = useSearchParams()
  const [done, setDone] = useState(false)
  const [success, setSuccess] = useState(false)
  const [pending, setPending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [manualCheckLoading, setManualCheckLoading] = useState(false)
  const pollRef = useRef(null)

  const successParam = searchParams.get('success')
  const orderId = searchParams.get('orderId')

  const checkOrderStatus = async () => {
    if (!orderId) return
    setManualCheckLoading(true)
    try {
      const data = await getOrderDetail(orderId)
      const payment = (data.payments || [])[0]
      if (payment) {
        if (payment.trangThaiThanhToan === 2) {
          setPending(false); setSuccess(true); setDone(true); setLoading(false)
          return true
        }
        if (payment.trangThaiThanhToan === 3) {
          setPending(false); setSuccess(false); setDone(true); setLoading(false)
          return true
        }
      }
    } catch {}
    setManualCheckLoading(false)
    return false
  }

  useEffect(() => {
    if (successParam === 'true' || successParam === 'false') {
      setSuccess(successParam === 'true')
      setDone(true)
      setLoading(false)
      return
    }

    if (!orderId) {
      setDone(true)
      setLoading(false)
      return
    }

    const startedAt = Date.now()

    const poll = async () => {
      if (Date.now() - startedAt > POLL_TIMEOUT) {
        // A delayed gateway callback is not the same as a failed payment.
        setPending(true)
        setDone(true)
        setLoading(false)
        return
      }

      try {
        const data = await getOrderDetail(orderId)
        const payment = (data.payments || [])[0]
        if (payment) {
          if (payment.trangThaiThanhToan === 2) {
            setPending(false); setSuccess(true); setDone(true); setLoading(false)
            return
          }
          if (payment.trangThaiThanhToan === 3) {
            setPending(false); setSuccess(false); setDone(true); setLoading(false)
            return
          }
        }
      } catch {}
      pollRef.current = setTimeout(poll, 2000)
    }
    poll()

    return () => {
      if (pollRef.current) clearTimeout(pollRef.current)
    }
  }, [successParam, orderId])

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
      ) : success ? (
        <CheckCircle className="h-20 w-20 mx-auto text-emerald-deep mb-4" />
      ) : (
        <XCircle className="h-20 w-20 mx-auto text-bordeaux mb-4" />
      )}
      <h1 className="text-2xl font-bold mb-2">
        {pending ? 'Đang chờ xác nhận thanh toán' : success ? 'Thanh toán thành công' : 'Thanh toán thất bại'}
      </h1>
      <p className="text-stone mb-6">
        {pending
          ? 'Cổng thanh toán chưa trả kết quả. Đơn hàng vẫn được giữ, bạn có thể kiểm tra lại sau ít phút.'
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
