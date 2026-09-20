import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Check, MapPin } from 'lucide-react'
import { VND } from '../components/ProductCard'

export default function OrderSuccess() {
  const location = useLocation()
  const navigate = useNavigate()
  const order = location.state?.order

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-stone mb-4">Không tìm thấy thông tin đơn hàng.</p>
        <Link to="/" className="text-[var(--primary-color)] font-semibold hover:underline">Về trang chủ</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          {/* Success Icon */}
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Check className="h-7 w-7 text-emerald-600" strokeWidth={3} />
          </div>

          <h1 className="text-xl font-bold text-[var(--primary-color)] mb-3">ĐẶT HÀNG THÀNH CÔNG!</h1>
          <p className="text-sm text-stone mb-1">
            Cảm ơn <span className="font-semibold text-ink">{order.tenNguoiNhan || 'Quý khách'}</span> đã tin tưởng mua sắm tại ZestStore.
          </p>
          <p className="text-sm text-stone mb-6">
            Mã đơn hàng của bạn là: <span className="font-bold text-ink">{order.maDonHangCode || order.maDonHang}</span>
          </p>

          {/* Order Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-left mb-6">
            <h2 className="font-bold text-sm text-ink mb-3">THÔNG TIN GIAO HÀNG</h2>
            <div className="text-sm space-y-1.5">
              <p className="text-stone">
                <span className="font-semibold text-ink">Họ và tên:</span>{' '}
                <span className="text-ink">{order.tenNguoiNhan}</span>
              </p>
              <p className="text-stone">
                <span className="font-semibold text-ink">Số điện thoại:</span>{' '}
                <span className="text-ink">{order.sdtNguoiNhan}</span>
              </p>
              <p className="text-stone">
                <span className="font-semibold text-ink">Địa chỉ nhận hàng:</span>{' '}
                <span className="text-ink">{order.diaChiGiaoHang}</span>
              </p>
              <p className="text-stone">
                <span className="font-semibold text-ink">Phương thức:</span>{' '}
                <span className="text-ink">{order.phuongThucThanhToan === 1 ? 'Thanh toán khi nhận hàng (COD)' : 'Thanh toán online'}</span>
              </p>
              <p className="text-stone">
                <span className="font-semibold text-ink">Tổng thanh toán:</span>{' '}
                <span className="text-[var(--primary-color)] font-bold">{VND(order.tongTien || order.tongThanhToan || 0)}</span>
              </p>
            </div>
          </div>

          {/* Continue Shopping */}
          <button
            onClick={() => navigate('/')}
            className="bg-[var(--primary-color)] text-white px-8 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition"
          >
            TIẾP TỤC MUA SẮM
          </button>
        </div>
      </div>
    </div>
  )
}
