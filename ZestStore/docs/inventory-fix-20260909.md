# Sửa tồn kho online và POS — 09/09/2026

## Quy tắc mới

`ton_kho` là tồn vật lý. Khả dụng = tồn vật lý − lượng giữ cho đơn online − lượng giữ POS còn hạn.

- Online tạo đơn: giữ hàng trong cùng transaction tạo đơn. Ví: giữ rồi xuất ngay cùng transaction trừ ví. COD: giữ khi tạo, xuất khi xác nhận. Cổng thanh toán: xuất khi callback thành công.
- POS: giữ hàng khi thêm giỏ; chỉ bán bằng tiền mặt hoặc VietQR đã được nhân viên xác nhận. Tạo đơn cần giữ hàng còn hiệu lực và `checkoutKey`; cùng khóa trả lại cùng đơn.
- Mỗi đơn lưu `stock_state`: `NONE`, `RESERVED`, `DEDUCTED`, `RELEASED`. Hủy hàng đang giữ không cộng tồn vật lý. Hủy/trả hàng đã xuất chỉ cộng một lần.
- Backend kiểm soát chuyển trạng thái. Không đổi trực tiếp sang trả hàng; dùng API duyệt yêu cầu trả hàng.
- Đơn và thanh toán được khóa trước khi xử lý; biến thể khóa theo thứ tự ID. Biến thể đã tải từ giỏ được refresh sau khi lấy khóa để tránh tính trên bản cũ.
- Callback giữ nguyên mã tham chiếu của cửa hàng, lưu mã cổng vào `gateway_transaction_id`. Thanh toán đến muộn sau hủy được hoàn vào ví đúng một lần với `refunded`.
- COD không dùng thời hạn thanh toán online. Từng thanh toán quá hạn được xử lý trong transaction riêng; nạp ví không có đơn vẫn xử lý được.
- POS gia hạn giữ hàng mỗi phút khi trang đang hiển thị. Giữ hàng hết hạn sau 30 phút không được tự hồi sinh; phải thêm lại hàng. Không xóa dòng hết hạn trong job để tránh xóa nhầm dòng vừa gia hạn; lượng hết hạn bị loại khỏi tính khả dụng.
- Chỉnh tồn từ form yêu cầu `version` đã đọc; không được giảm dưới số lượng đang giữ. Xóa/ẩn biến thể có giữ hàng bị từ chối.

## Triển khai và dữ liệu cũ

Chạy `src/main/resources/migration/V20260909_01__inventory_lifecycle.sql` trên SQL Server khi ứng dụng đã dừng, trước khi chạy backend mới. Đây là script thủ công; dự án hiện không tự chạy thư mục migration. Script chỉ thêm cột/index, không tự sửa số tồn hoặc số dư.

Tất cả đơn cũ được đánh dấu `LEGACY`, vì lịch sử cũ không đủ chứng minh đã trừ/hoàn bao nhiêu lần. Phải đối chiếu đơn, phiếu xuất/nhận hàng, thanh toán và kiểm kê thực tế trước khi gán `NONE`, `DEDUCTED` hoặc `RELEASED`. Các thao tác cần quyết định xuất/hoàn kho trên đơn chưa đối soát sẽ bị chặn. Không dùng một câu UPDATE theo trạng thái đơn để đoán sửa toàn bộ dữ liệu.

Với đơn cũ đã hoàn tiền, cần đối chiếu giao dịch ví và đánh dấu `thanh_toan.refunded` tương ứng trước khi cho phép callback mới. Đối soát không được tự suy luận từ trạng thái thất bại vì mã cũ dùng cùng trạng thái cho thất bại và hoàn tiền.

Frontend/backend phải cập nhật cùng phiên bản: POS cần `checkoutKey`; cập nhật tồn biến thể cần `version`.

## Xác minh

Bộ test `InventoryServiceTest`, `OrderInventoryTest`, `PaymentInventoryTest`, `PosInventoryTest`, `ReturnInventoryTest`, `InventoryAdjustmentTest` chạy với repository mock, không truy cập DB thật. Chạy `mvn -Dtest=InventoryServiceTest,OrderInventoryTest,PaymentInventoryTest,PosInventoryTest,ReturnInventoryTest,InventoryAdjustmentTest test` và `npm run build` trong frontend.

Kết quả kiểm tra ngày 09/09/2026: backend biên dịch thành công; 27 test thành công, 0 lỗi; frontend production build thành công. Còn cảnh báo CSS import/thư viện bundle lớn đã có trước bản sửa. Chưa chạy migration hoặc kiểm thử tích hợp SQL Server.

Trước vận hành cần kiểm thử tích hợp trên SQL Server thử nghiệm: đồng thời online/POS mua sản phẩm cuối; hai callback giống nhau; admin xác nhận và khách hủy đồng thời; hai nhân viên duyệt cùng yêu cầu trả; refresh form cũ sau khi bán; callback sau hết hạn; gia hạn giỏ POS trong khi quầy khác mua. Unit test không chứng minh hành vi khóa của SQL Server.

Giữ hàng có thời hạn không bảo đảm một giao dịch chuyển khoản thủ công mất kết nối lâu hơn 30 phút sẽ còn hàng; nhân viên cần kiểm tra giữ hàng/kết nối trước khi thu tiền. Bản sửa này không thêm tích hợp đối soát ngân hàng tự động.
