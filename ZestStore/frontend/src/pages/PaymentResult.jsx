import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { getOrderDetail } from '../api/orders'
import LoadingSpinner from '../components/LoadingSpinner'
import { CheckCircle, XCircle, Loader } from 'lucide-react'

export default function PaymentResult() {
  const [searchParams] = useSearchParams()
  const [done, setDone] = useState(false)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const pollRef = useRef(null)

  const successParam = searchParams.get('success')
  const orderId = searchParams.get('orderId')

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

    const poll = async () => {
      try {
        const data = await getOrderDetail(orderId)
        const payments = data.payments || []
        const payment = payments[0]
        if (payment) {
          if (payment.trangThaiThanhToan === 2) {
            setSuccess(true)
            setDone(true)
            setLoading(false)
            return
          }
          if (payment.trangThaiThanhToan === 3) {
            setSuccess(false)
            setDone(true)
            setLoading(false)
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
        <Loader className="h-16 w-16 mx-auto text-blue-500 animate-spin mb-4" />
        <h1 className="text-xl font-bold mb-2">Đang xử lý thanh toán...</h1>
        <p className="text-gray-500">Vui lòng chờ trong giây lát</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      {success ? (
        <CheckCircle className="h-20 w-20 mx-auto text-green-500 mb-4" />
      ) : (
        <XCircle className="h-20 w-20 mx-auto text-red-500 mb-4" />
      )}
      <h1 className="text-2xl font-bold mb-2">
        {success ? 'Thanh toán thành công' : 'Thanh toán thất bại'}
      </h1>
      <p className="text-gray-500 mb-6">
        {success
          ? 'Cảm ơn bạn! Đơn hàng đã được xác nhận.'
          : 'Đã có lỗi xảy ra trong quá trình thanh toán.'}
      </p>
      {orderId && (
        <Link
          to={`/orders/${orderId}`}
          className="text-blue-700 font-semibold hover:underline inline-block"
        >
          Xem chi tiết đơn hàng
        </Link>
      )}
      <div className="mt-4">
        <Link to="/" className="text-gray-500 hover:underline text-sm">
          Tiếp tục mua sắm
        </Link>
      </div>
    </div>
  )
}
