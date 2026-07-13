# Meeting Notes - ZestStore

**Lịch họp:** Thứ 2 - Thứ 4 - Thứ 6 hàng tuần  
**Thời gian:** 19:00 - 19:45  
**Địa điểm:** Google Meet / Offline tại lớp

---

## Mục lục

- [Tháng 6 - Tuần 1 (01/06 - 05/06)](#tháng-6---tuần-1-0106---0506)
- [Tháng 6 - Tuần 2 (08/06 - 12/06)](#tháng-6---tuần-2-0806---1206)
- [Tháng 6 - Tuần 3 (15/06 - 19/06)](#tháng-6---tuần-3-1506---1906)
- [Tháng 6 - Tuần 4 (22/06 - 26/06)](#tháng-6---tuần-4-2206---2606)
- [Tháng 6-7 - Tuần 5 (29/06 - 03/07)](#tháng-6-7---tuần-5-2906---0307)
- [Tháng 7 - Tuần 6 (06/07 - 10/07)](#tháng-7---tuần-6-0607---1007)

---

## Tháng 6 - Tuần 1 (01/06 - 05/06)

### Buổi 1 - Thứ 2, 01/06/2026

**Nội dung:**
- Khởi động dự án, phân tích yêu cầu
- Thống nhất công nghệ: React + Vite + Tailwind CSS (FE) / Spring Boot + SQL Server (BE)
- Phân chia nhóm: FE, BE, Database
- Lên kế hoạch sprint 1: Auth + Products cơ bản

**Công việc:**
| Người | Task | Deadline |
|---|---|---|
| Cả nhóm | Cài đặt môi trường dev | 02/06 |
| BE Team | Tạo project Spring Boot + JPA entities | 03/06 |
| FE Team | Tạo project Vite + Tailwind + Routing | 03/06 |
| DB Team | Thiết kế database schema (PoloShopDB) | 04/06 |

### Buổi 2 - Thứ 4, 03/06/2026

**Nội dung:**
- Review database schema hoàn chỉnh (29 tables)
- Thống nhất API endpoints cho module Auth
- Phân công: Đăng nhập/Đăng ký (FE + BE)
- Xử lý JWT token + Spring Security config

**Kết quả:**
- Schema đã approve: `nguoi_dung`, `vai_tro`, `san_pham`, `bien_the_san_pham`,...
- API design: `POST /api/auth/login`, `POST /api/auth/register`
- JWT secret key đã được tạo

### Buổi 3 - Thứ 6, 05/06/2026

**Nội dung:**
- Demo đăng nhập/đăng ký cơ bản
- Cart + Wishlist context (React Context API)
- Phân công module Products: CRUD + upload ảnh

**Vấn đề:**
- Chưa xử lý refresh token
- CORS config cần điều chỉnh cho Vite proxy

---

## Tháng 6 - Tuần 2 (08/06 - 12/06)

### Buổi 4 - Thứ 2, 08/06/2026

**Nội dung:**
- Review CRUD sản phẩm + upload ảnh
- Hoàn thành biến thể sản phẩm (size, màu sắc)
- Bắt đầu module Giỏ hàng

**Kết quả:**
- Products API hoàn thành: CRUD + variants + images
- Cart API: thêm/sửa/xóa mục giỏ hàng

### Buổi 5 - Thứ 4, 10/06/2026

**Nội dung:**
- Hoàn thành module Giỏ hàng (FE + BE)
- Bắt đầu module Đặt hàng (Orders)
- Thiết kế luồng: Cart → Checkout → Order → Payment

**Quyết định:**
- Luồng đặt hàng: Điền thông tin → Chọn ship GHN → Chọn thanh toán → Xác nhận
- Thanh toán: COD, VNPay, MoMo, ZaloPay, VietQR

### Buổi 6 - Thứ 6, 12/06/2026

**Nội dung:**
- Checkout form (FE)
- Tích hợp GHN tính phí ship
- Áp dụng mã giảm giá

**Vấn đề:**
- API GHN cần token sandbox
- Cần mock data để test

---

## Tháng 6 - Tuần 3 (15/06 - 19/06)

### Buổi 7 - Thứ 2, 15/06/2026

**Nội dung:**
- Hoàn thành checkout flow
- Bắt đầu tích hợp thanh toán VNPay
- Xử lý payment callback + IPN

**Kết quả:**
- Checkout hoàn chỉnh: form + ship + coupon
- VNPay: tạo link thanh toán + xử lý return

### Buổi 8 - Thứ 4, 17/06/2026

**Nội dung:**
- Tích hợp MoMo + ZaloPay
- Xử lý payment timeout (tự động hủy đơn sau 2h)
- Tạo hóa đơn điện tử

**Kết quả:**
- Cả 3 cổng thanh toán đã tích hợp (sandbox)
- Hoàn thành `ThanhToanService.completePayment()`

### Buổi 9 - Thứ 6, 19/06/2026

**Nội dung:**
- Review toàn bộ payment flow
- Hoàn thành module Orders (hủy/trả hàng/xác nhận)
- Bắt đầu Admin Dashboard

**Vấn đề:**
- Payment callback đôi khi chậm
- Cần thêm retry payment

---

## Tháng 6 - Tuần 4 (22/06 - 26/06)

### Buổi 10 - Thứ 2, 22/06/2026

**Nội dung:**
- Admin Dashboard: thống kê doanh thu (ngày/tháng/năm)
- Biểu đồ Recharts
- Top sản phẩm bán chạy

**Kết quả:**
- Dashboard hoàn thành: stats cards + charts + recent orders

### Buổi 11 - Thứ 4, 24/06/2026

**Nội dung:**
- Quản lý đơn hàng (admin): list + filter + detail
- Cập nhật trạng thái đơn hàng
- Quản lý sản phẩm + danh mục (admin)

**Kết quả:**
- Admin order management hoàn chỉnh
- Admin product management: CRUD + variants + toggle

### Buổi 12 - Thứ 6, 26/06/2026

**Nội dung:**
- Quản lý người dùng (admin): customers + employees
- Quản lý mã giảm giá (coupon)
- Quản lý đánh giá (reviews)

**Kết quả:**
- Admin users: search, filter, lock/unlock
- Coupon: CRUD + toggle status

---

## Tháng 6-7 - Tuần 5 (29/06 - 03/07)

### Buổi 13 - Thứ 2, 29/06/2026

**Nội dung:**
- Bắt đầu module POS (Point of Sale)
- Thiết kế giao diện bán tại quầy
- PosCartService + PosCartItem

**Kết quả:**
- POS layout cơ bản
- Thêm sản phẩm vào giỏ POS bằng SKU

### Buổi 14 - Thứ 4, 01/07/2026

**Nội dung:**
- Hoàn thiện POS: thanh toán + ZaloPay tại quầy
- Quét mã vạch (Quagga/jsqr)
- Chọn khách hàng cho đơn POS

**Kết quả:**
- POS hoàn chỉnh: tạo đơn + thanh toán tiền mặt/ZaloPay
- Tích hợp máy quét webcam

### Buổi 15 - Thứ 6, 03/07/2026

**Nội dung:**
- Module Chat: hỗ trợ trực tuyến user ↔ admin
- Wishlist
- Real-time SSE cho cập nhật đơn hàng
- Export Excel + gửi email báo cáo

**Kết quả:**
- Chat support: gửi tin nhắn, admin reply
- SSE stream hoạt động
- Excel export + email scheduler

---

## Tháng 7 - Tuần 6 (06/07 - 10/07)

### Buổi 16 - Thứ 2, 06/07/2026

**Nội dung:**
- Review toàn bộ dự án, kiểm tra các lỗi còn tồn đọng
- Fix bug: tạo bảng `voucher_nguoi_dung` bị thiếu
- Fix bug: POS coupon validate sai field name

**Kết quả:**
- Tạo bảng `voucher_nguoi_dung` trong SQL Server
- Sửa field `giaTriDon` → `tongTien` trong `AdminPOS.jsx`

### Buổi 17 - Thứ 4, 08/07/2026

**Nội dung:**
- Fix bug: auto-confirm đơn hàng khi thanh toán thành công
- Nâng cấp AdminUsers: stats cards, sort, pagination employees, bulk actions
- Cải tiến AdminOrderDetail: di chuyển nút cập nhật + lịch sử lên gần stepper

**Kết quả:**
- Xóa auto-confirm trong `ThanhToanService.completePayment()`
- AdminUsers: thêm 4 tính năng mới
- AdminOrderDetail: UI cải tiến

### Buổi 18 - Thứ 6, 10/07/2026

**Nội dung:**
- Kiểm tra tổng thể các module
- Chuẩn bị tài liệu báo cáo + slide thuyết trình
- Tạo Trello board quản lý dự án Agile
- Luyện tập demo các chức năng chính

**Kết quả:**
- Board Trello: https://trello.com/b/qoDkMvne (141 cards)
- Danh sách câu hỏi review (40 câu)
- Sẵn sàng cho buổi bảo vệ

---

## Thống kê tổng

| KPI | Giá trị |
|---|---|
| Tổng số buổi họp | 18 buổi |
| Thời gian | 01/06 - 10/07/2026 (6 tuần) |
| Modules hoàn thành | 20+ modules |
| Bug đã fix | 4+ bugs |
| Cards Trello | 141 cards |
