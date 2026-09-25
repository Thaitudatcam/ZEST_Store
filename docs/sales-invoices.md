# Hóa đơn bán hàng nội bộ

Đơn hàng (`don_hang`) quản lý giao hàng và thanh toán. Hóa đơn (`sales_invoice`,
`sales_invoice_line`) là chứng từ riêng, không phải hóa đơn điện tử thuế.

- POS nhận hàng tại quầy: tự lập trong cùng giao dịch hoàn tất thanh toán.
- Online và POS giao hàng: tự lập khi đơn chuyển sang hoàn thành (6), đã thu đủ tiền.
- Khách xác nhận nhận hàng: hệ thống lập hóa đơn, không ghi khách là người lập.
- Mỗi đơn có tối đa một hóa đơn. Khóa đơn và ràng buộc unique `order_id` chống lập trùng.
- Mã HD theo ID hóa đơn, có thể có khoảng trống khi giao dịch rollback.
- In lại lấy nội dung đã lưu, không đọc tên/giá sản phẩm hiện tại.
- Số lần in là số lần yêu cầu in, không chứng minh máy in đã in thành công.
- Admin hủy chứng từ phải nhập lý do; lưu người hủy, thời điểm, giữ nguyên chứng từ.
  Không tự hoàn tiền, trả kho hoặc hủy đơn. Không phát hành lại cho cùng đơn đã có hóa đơn hủy.
- Đơn cũ đã hoàn thành: mở chi tiết đơn và chọn Lập hóa đơn. Dùng ngày lập thực tế.
  Nếu đơn cũ thiếu snapshot sản phẩm, dữ liệu mô tả hiện có được chụp tại lúc lập;
  không thể khôi phục mô tả lịch sử chưa từng lưu. Đơn thiếu thanh toán đủ bị từ chối.

## Triển khai

1. Sao lưu database trước khi nâng cấp schema.
2. Có script SQL Server `src/main/resources/migration/V20260925_01__sales_invoices.sql`.
   Đây là script chạy thủ công; dự án chưa cấu hình Flyway để tự chạy thư mục này.
   Script chỉ thêm hai bảng mới, không xóa hay chuyển dữ liệu cũ.
3. Local đang dùng `spring.jpa.hibernate.ddl-auto=update`, nên khởi động lại backend
   cũng sẽ tạo các bảng entity mới. Môi trường dùng `validate`/`none` cần chạy SQL trước.
4. Build/reload frontend. Vào Quản lý đơn hàng → Hóa đơn.

## Kiểm thử nghiệp vụ thủ công sau khởi động

- Hoàn tất một POS; kiểm tra có một HD liên kết đúng DH, tổng tiền và phương thức thu tiền.
- Đơn online trả trước chưa hoàn thành chưa có HD; hoàn thành mới có HD.
- Lặp yêu cầu lập/in: giữ nguyên mã HD; chỉ số lần yêu cầu in tăng.
- Sửa tên sản phẩm sau khi lập: bản in HD không đổi.
- Nhân viên không được hủy; admin hủy có lý do và bản in hiện ĐÃ HỦY.
- Kiểm tra đơn cũ: không tự tạo hóa đơn hoặc thay đổi dữ liệu lịch sử.
