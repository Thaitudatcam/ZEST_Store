import { useParams, Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

const policies = {
  'doi-tra': {
    title: 'Chính sách đổi trả',
    content: [
      { h: '1. Điều kiện đổi trả', p: 'Sản phẩm còn nguyên tem mác, chưa qua sử dụng, giặt ủi. Thời gian đổi trả trong vòng 7 ngày kể từ ngày nhận hàng. Sản phẩm lỗi do nhà sản xuất sẽ được hỗ trợ đổi mới hoàn toàn.' },
      { h: '2. Quy trình đổi trả', p: 'Liên hệ hotline 1900 1234 hoặc email support@zeststore.vn để được hướng dẫn. Gửi sản phẩm kèm hóa đơn về địa chỉ: 123 Nguyễn Huệ, Q.1, TP.HCM. Chúng tôi sẽ xử lý trong vòng 3-5 ngày làm việc.' },
      { h: '3. Phí đổi trả', p: 'Miễn phí đổi trả nếu sản phẩm bị lỗi từ nhà sản xuất. Trường hợp đổi size/màu do khách hàng thay đổi nhu cầu: tính phí 30.000đ/sản phẩm.' },
      { h: '4. Hoàn tiền', p: 'Hoàn tiền qua chuyển khoản ngân hàng trong vòng 5-7 ngày làm việc sau khi nhận được hàng trả lại. Hoàn tiền qua ví MoMo/VNPay trong 24-48 giờ.' },
    ],
  },
  'bao-mat': {
    title: 'Chính sách bảo mật',
    content: [
      { h: '1. Mục đích thu thập thông tin', p: 'Chúng tôi thu thập thông tin cá nhân (họ tên, email, số điện thoại, địa chỉ) nhằm phục vụ việc đặt hàng, giao hàng và chăm sóc khách hàng.' },
      { h: '2. Phạm vi sử dụng thông tin', p: 'Thông tin chỉ được sử dụng nội bộ tại ZestStore, không chia sẻ cho bên thứ ba nếu không có sự đồng ý của khách hàng (trừ trường hợp pháp luật yêu cầu).' },
      { h: '3. Thời gian lưu trữ', p: 'Thông tin khách hàng được lưu trữ vĩnh viễn hoặc cho đến khi khách hàng yêu cầu xóa. Khách hàng có thể yêu cầu xóa thông tin qua email support@zeststore.vn.' },
      { h: '4. Bảo mật thanh toán', p: 'Mọi giao dịch thanh toán đều được mã hóa và bảo vệ qua cổng thanh toán an toàn. ZestStore không lưu trữ thông tin thẻ ngân hàng của khách hàng.' },
    ],
  },
  'van-chuyen': {
    title: 'Chính sách vận chuyển',
    content: [
      { h: '1. Phạm vi giao hàng', p: 'Giao hàng trên toàn quốc. Khu vực nội thành TP.HCM: giao trong 1-2 ngày. Khu vực tỉnh/thành khác: giao trong 3-5 ngày.' },
      { h: '2. Phí vận chuyển', p: 'Miễn phí giao hàng cho đơn từ 300.000đ. Đơn dưới 300.000đ: phí 25.000đ (nội thành), 35.000đ (ngoại thành và tỉnh).' },
      { h: '3. Thời gian xử lý đơn hàng', p: 'Đơn hàng được xử lý trong vòng 24h (không tính Chủ nhật và ngày lễ). Thời gian giao hàng được tính từ khi đơn hàng rời kho.' },
      { h: '4. Kiểm tra khi nhận hàng', p: 'Khách hàng có quyền kiểm tra sản phẩm trước khi thanh toán. Vui lòng quay video quá trình mở hàng để được hỗ trợ nếu có vấn đề phát sinh.' },
    ],
  },
  'huong-dan-mua-hang': {
    title: 'Hướng dẫn mua hàng',
    content: [
      { h: '1. Đặt hàng online', p: 'Bước 1: Truy cập ZestStore.vn, chọn sản phẩm yêu thích. Bước 2: Chọn màu sắc, kích cỡ, số lượng. Bước 3: Nhấn "Thêm vào giỏ" và tiến hành thanh toán. Bước 4: Điền thông tin giao hàng và chọn phương thức thanh toán.' },
      { h: '2. Thanh toán', p: 'Chúng tôi hỗ trợ thanh toán khi nhận hàng (COD), chuyển khoản ngân hàng, ví MoMo và VNPay. Đối với COD, vui lòng chuẩn bị đủ tiền mặt khi nhận hàng.' },
      { h: '3. Tạo tài khoản', p: 'Đăng ký tài khoản để theo dõi đơn hàng, lưu danh sách yêu thích và nhận ưu đãi độc quyền. Đăng ký nhanh qua email hoặc số điện thoại.' },
      { h: '4. Chăm sóc khách hàng', p: 'Hotline: 1900 1234 (8:00 - 21:00). Email: support@zeststore.vn. Chat trực tiếp trên website hoặc fanpage Facebook.' },
    ],
  },
}

export default function PolicyPage() {
  const { slug } = useParams()
  const policy = policies[slug]

  if (!policy) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Không tìm thấy trang</h1>
        <Link to="/" className="text-blue-700 hover:underline">Quay lại trang chủ</Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-blue-700">Trang chủ</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-800 font-semibold">{policy.title}</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">{policy.title}</h1>

      <div className="space-y-6">
        {policy.content.map((section, idx) => (
          <div key={idx} className="bg-white border rounded-xl p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-2">{section.h}</h2>
            <p className="text-gray-600 leading-relaxed text-sm">{section.p}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
