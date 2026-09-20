# ZestStore POS System

Hệ thống bán hàng tại quầy (POS) cho thương hiệu ZestStore.

## Quick Start

### Frontend (FE)

```bash
cd frontend
npm install
npm run dev
```

Chạy tại `http://localhost:5173`. Frontend luôn gọi backend thật qua proxy `/api`,
vì vậy cần khởi động Spring Boot trước khi kiểm thử các luồng có dữ liệu.

### Backend (BE) - Spring Boot

```bash
# Yêu cầu: Java 17+, SQL Server
cd .
mvn spring-boot:run
```

Backend chạy tại `http://localhost:8080`. FE proxy `/api` → `localhost:8080`.

## Test Flows

### Tạo đơn hàng
1. Mở `/admin/pos`
2. Nhấn **"+ Tạo đơn hàng"** → đơn mới xuất hiện
3. Nhấn **"+ Thêm sản phẩm"** → mở modal chọn sản phẩm
4. Chọn sản phẩm → nhấn **"Thêm vào giỏ"**
5. Toast hiện "Đã thêm X sản phẩm vào giỏ hàng"

### Thanh toán tiền mặt
1. Chọn khách hàng (tùy chọn)
2. Nhập mã giảm giá → nhấn **"Áp dụng"**
3. Nhấn **"Thanh toán"** → mở PaymentModal
4. Chọn tab **"Tiền mặt"**
5. Nhấn nút quick amount hoặc nhập số tiền
6. Nhấn **"XÁC NHẬN THANH TOÁN"**

### Giao hàng
1. Bật toggle **"Giao hàng"** trong Thông tin thanh toán
2. Nhập thông tin giao hàng (địa chỉ, SĐT, phương thức)
3. Phí vận chuyển tự động tính (debounce 300ms)
4. Đơn từ 2.000.000đ → miễn phí vận chuyển

### Giới hạn 10 đơn hàng
- FE: Tạo ≥10 đơn → nút disabled + toast lỗi
- BE: POST `/api/admin/pos/orders` → trả 429 nếu ≥10 đơn hôm nay

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite 6, TailwindCSS v4 |
| Icons | Lucide React |
| Mock | MSW (Mock Service Worker) |
| Backend | Spring Boot 3, SQL Server |
| Auth | Spring Security JWT |

## Project Structure

```
frontend/src/
├── components/admin/pos/
│   ├── apiClient.js          # POS API client
│   ├── PaymentModal.jsx      # Tabs Tiền mặt/Chuyển khoản
│   ├── CustomerPickerModal.jsx
│   ├── AddProductModal.jsx
│   ├── ProductCard.jsx       # Card + modal mode
│   └── POSToast.jsx
├── mocks/
│   ├── browser.js            # MSW worker setup
│   ├── handlers.js           # API mock handlers
│   └── data.js               # Sample data
├── pages/admin/
│   ├── AdminPOS.jsx          # Main POS page
│   └── AdminLayout.jsx       # Sidebar
└── index.css                 # CSS variables + Tailwind v4
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products/admin/variant-list` | Danh sách variant |
| GET | `/api/categories/active` | Danh mục активные |
| GET | `/api/colors` | Màu sắc |
| GET | `/api/sizes` | Kích cỡ |
| POST | `/api/admin/pos/orders` | Tạo đơn POS |
| POST | `/api/admin/pos/validate-coupon` | Validate mã giảm giá |
| POST | `/api/admin/pos/vietqr/preview` | Tạo QR VietQR |
| GET | `/api/vi-zeststore/diem/:id` | Điểm khách hàng |
| GET | `/api/diem-quy-tac` | Quy tắc đổi điểm |
| GET | `/api/shipping/calc` | Tính phí vận chuyển |
| GET | `/api/shipping/provinces` | Danh sách tỉnh/thành |
