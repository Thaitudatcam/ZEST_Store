import { useParams, Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

const policies = {
  'doi-tra': {
    title: 'Chính sách đổi trả',
    content: [
      { h: '1. Điều kiện đổi trả', p: 'Sản phẩm còn nguyên tem mác, chưa qua sử dụng, giặt ủi. Thời gian đổi trả trong vòng 7 ngày kể từ ngày nhận hàng. Sản phẩm lỗi do nhà sản xuất sẽ được hỗ trợ đổi mới hoàn toàn.' },
      { h: '2. Quy trình đổi trả', p: 'Liên hệ hotline 1900 1234 hoặc email support@zeststore.vn để được hướng dẫn. Gửi sản phẩm kèm hóa đơn về địa chỉ: 123 Nguyễn Huệ, Q.1, TP.HCM. Chúng tôi sẽ xử lý trong vòng 3-5 ngày làm việc.' },
      { h: '3. Phí đổi trả', p: 'Miễn phí đổi trả nếu sản phẩm bị lỗi từ nhà sản xuất. Trường hợp đổi size/màu do khách hàng thay đổi nhu cầu: tính phí 30.000đ/sản phẩm.' },
      { h: '4. Hoàn tiền', p: 'Hoàn tiền qua chuyển khoản ngân hàng trong vòng 5-7 ngày làm việc sau khi nhận được hàng trả lại. Hoàn tiền qua VNPay/ZaloPay/VietQR trong 24-48 giờ.' },
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
      { h: '2. Thanh toán', p: 'Chúng tôi hỗ trợ thanh toán khi nhận hàng (COD), chuyển khoản ngân hàng, VNPay, ZaloPay và VietQR. Đối với COD, vui lòng chuẩn bị đủ tiền mặt khi nhận hàng.' },
      { h: '3. Tạo tài khoản', p: 'Đăng ký tài khoản để theo dõi đơn hàng, lưu danh sách yêu thích và nhận ưu đãi độc quyền. Đăng ký nhanh qua email hoặc số điện thoại.' },
      { h: '4. Chăm sóc khách hàng', p: 'Hotline: 1900 1234 (8:00 - 21:00). Email: support@zeststore.vn. Chat trực tiếp trên website hoặc fanpage Facebook.' },
    ],
  },
  'dieu-khoan-dich-vu': {
    title: 'Điều khoản dịch vụ',
    content: [
      { h: '1. Phạm vi áp dụng', p: 'Điều khoản dịch vụ này áp dụng cho toàn bộ khách hàng sử dụng website, ứng dụng và các dịch vụ của ZestStore. Bằng việc truy cập hoặc sử dụng dịch vụ, bạn xác nhận đã đọc, hiểu và đồng ý với toàn bộ các điều khoản dưới đây.' },
      { h: '2. Tài khoản khách hàng', p: 'Khi tạo tài khoản, bạn phải cung cấp thông tin chính xác, đầy đủ và chịu trách nhiệm bảo mật thông tin đăng nhập của mình. Bạn đồng ý thông báo ngay cho ZestStore khi phát hiện tài khoản bị truy cập trái phép.' },
      { h: '3. Giá cả và thanh toán', p: 'Giá sản phẩm hiển thị trên website đã gồm thuế và được tính theo thời điểm đặt hàng. ZestStore có quyền thay đổi giá, chương trình khuyến mãi mà không cần thông báo trước. Mọi giao dịch phải được thanh toán đầy đủ trước khi đơn hàng được xử lý.' },
      { h: '4. Giao hàng và đổi trả', p: 'Đơn hàng được giao theo chính sách vận chuyển của ZestStore. Khách hàng có quyền đổi trả sản phẩm theo chính sách đổi trả được công bố trên website trong vòng 7 ngày kể từ ngày nhận hàng.' },
      { h: '5. Sở hữu trí tuệ', p: 'Toàn bộ nội dung trên website bao gồm hình ảnh, logo, mô tả sản phẩm và thiết kế giao diện thuộc quyền sở hữu của ZestStore. Không được sao chép, sử dụng lại dưới mọi hình thức khi chưa có sự đồng ý bằng văn bản.' },
      { h: '6. Giới hạn trách nhiệm', p: 'ZestStore không chịu trách nhiệm về những thiệt hại gián tiếp phát sinh từ việc sử dụng dịch vụ ngoài tầm kiểm soát của chúng tôi như lỗi mạng, sự cố từ nhà vận chuyển hoặc hành vi của bên thứ ba.' },
      { h: '7. Sửa đổi điều khoản', p: 'ZestStore có quyền sửa đổi, bổ sung điều khoản dịch vụ bất cứ lúc nào. Phiên bản mới sẽ được cập nhật trên website và có hiệu lực kể từ ngày công bố. Việc bạn tiếp tục sử dụng dịch vụ đồng nghĩa với việc chấp nhận các thay đổi.' },
    ],
  },
  'chinh-sach-su-dung': {
    title: 'Chính sách sử dụng',
    content: [
      { h: '1. Tạo và bảo mật tài khoản', p: 'Tài khoản chỉ được tạo sau khi khách hàng đồng ý với điều khoản dịch vụ và chính sách sử dụng. Khách hàng phải giữ bí mật mật khẩu, không cho người khác mượn tài khoản và tự chịu trách nhiệm về mọi hoạt động diễn ra trên tài khoản của mình.' },
      { h: '2. Sử dụng hợp lý', p: 'Khách hàng được phép sử dụng website để mua sắm, tra cứu thông tin sản phẩm và sử dụng các tính năng hợp pháp khác. Không được sử dụng dịch vụ cho mục đích thương mại hóa, gian lận hoặc phá hoại hệ thống.' },
      { h: '3. Hành vi bị cấm', p: 'Nghiêm cấm các hành vi: đăng ký nhiều tài khoản ảo, lạm dụng chương trình khuyến mãi, phát tán mã độc, tấn công hoặc can thiệp vào hệ thống, xúc phạm hoặc quấy rối người dùng khác, sử dụng thông tin sai lệch gây ảnh hưởng đến hoạt động của website.' },
      { h: '4. Nội dung và đánh giá', p: 'Khi viết đánh giá sản phẩm, khách hàng phải đảm bảo nội dung trung thực, không chứa thông tin bịa đặt, quảng cáo trá hình, ngôn từ tục tĩu hoặc xâm phạm quyền của bên thứ ba. ZestStore có quyền gỡ bỏ các nội dung vi phạm.' },
      { h: '5. Xử lý vi phạm', p: 'ZestStore có quyền cảnh báo, tạm khóa hoặc chấm dứt tài khoản vi phạm chính sách mà không cần báo trước, đồng thời có thể từ chối xử lý các đơn hàng phát sinh từ hành vi gian lận.' },
      { h: '6. Chấm dứt sử dụng', p: 'Khách hàng có thể yêu cầu xóa tài khoản bất cứ lúc nào qua email support@zeststore.vn. Việc xóa tài khoản sẽ ngừng toàn bộ quyền sử dụng dịch vụ nhưng không ảnh hưởng đến các giao dịch đã hoàn tất trước đó.' },
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
        <Link to="/" className="text-gold hover:underline">Quay lại trang chủ</Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-1 text-sm text-stone mb-6">
        <Link to="/" className="hover:text-gold">Trang chủ</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-ink font-semibold">{policy.title}</span>
      </nav>

      <h1 className="text-2xl font-bold text-ink mb-8">{policy.title}</h1>

      <div className="space-y-6">
        {policy.content.map((section, idx) => (
          <div key={idx} className="bg-ivory border rounded-xl p-6">
            <h2 className="text-lg font-bold text-ink mb-2">{section.h}</h2>
            <p className="text-stone leading-relaxed text-sm">{section.p}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
