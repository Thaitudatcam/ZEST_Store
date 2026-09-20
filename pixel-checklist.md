# POS Visual Acceptance Checklist

Dùng để verify giao diện POS theo bộ nhận diện ZestStore.

## Sidebar
- [ ] Dark background (`bg-noir-900`)
- [ ] ZestStore logo + "Quản trị" subtitle
- [ ] **"Bán hàng"** là direct link (không nesting children)
- [ ] Gold active indicator khi ở POS page
- [ ] Font: Be Vietnam Pro (body), Playfair Display (logo)

## POS Header
- [ ] Title: **"Bán hàng"** (bold, 24px)
- [ ] "Người bán: **Admin**" (14px, stone color)
- [ ] "+ Tạo đơn hàng" button (gold bg, white text, rounded-xl)

## Empty State (no orders)
- [ ] Cart icon + "Chưa có đơn hàng nào được mở. Vui lòng nhấn **'Tạo đơn hàng'** để bắt đầu."
- [ ] Centered, clean background

## Order Tabs
- [ ] Tab-style: "Đơn 1", "Đơn 2"...
- [ ] Active tab: gold bg, white text
- [ ] Close button (X) on each tab khi >1 order
- [ ] Button disabled khi ≥10 orders

## Product Table Section
- [ ] Header: **"Sản phẩm giỏ hàng"**
- [ ] Button: **"Quét QR sản phẩm"** (dashed border)
- [ ] Button: **"+ Thêm sản phẩm"** (gold bg)
- [ ] Empty table: "Giỏ hàng trống! Nhấn **'Thêm sản phẩm'** hoặc **'Quét QR'** để chọn đồ."
- [ ] Table columns: STT, Sản phẩm, Đơn giá, Số lượng, Thành tiền, Hành động
- [ ] Product row: thumbnail + name + color/size + CTSP code
- [ ] Qty stepper: `- [qty] +`
- [ ] Subtotal row: "Tạm tính: Xđ"

## Thông tin khách hàng (Bottom Left)
- [ ] Title: **"Thông tin khách hàng"**
- [ ] Link: "Chọn khách hàng"
- [ ] Empty: "Đơn đang được đặt dưới dạng 'Khách lẻ' (Mua ẩn danh)"
- [ ] Selected: name + phone + "Bỏ chọn"

## Thông tin thanh toán (Bottom Right)
- [ ] Title: **"Thông tin thanh toán"**
- [ ] Toggle: **"Tại quầy"** / **"Giao hàng"**
- [ ] Coupon input: placeholder "Nhập mã (Enter để áp dụng)"
- [ ] "Giá trị" label + discount amount
- [ ] Points toggle (nếu customer có điểm)
- [ ] "Tiền hàng: Xđ"
- [ ] "Giảm giá: -Xđ" (nếu có coupon)
- [ ] "Tổng số tiền: **Xđ**" (gold, large font)
- [ ] Button: **"XÁC NHẬN THANH TOÁN"** (gold bg, full width)

## PaymentModal
- [ ] Width: max-w-[480px]
- [ ] Tabs: **"Tiền mặt"** / **"Chuyển khoản"** (gold underline active)
- [ ] Quick amounts: 100.000đ, 200.000đ, 500.000đ, 1.000.000đ, 2.000.000đ, 5.000.000đ, **Trả đúng**
- [ ] Currency input: VND format, inputMode="numeric"
- [ ] "Tiền thừa: Xđ" (green ≥0, red <0)
- [ ] "XÁC NHẬN THANH TOÁN" disabled khi < total
- [ ] Keyboard: Esc close, Enter confirm

## AddProductModal
- [ ] Width: max-w-[820px]
- [ ] Title: **"Thêm sản phẩm vào giỏ hàng"**
- [ ] Search: placeholder "Tìm theo tên sản phẩm, mã vạch..."
- [ ] Filters: "Chọn màu sắc" / "Chọn kích cỡ" dropdowns
- [ ] 2-column card grid
- [ ] Card: thumbnail + name + color/size + CTSP + kho + price + "Thêm vào giỏ" button
- [ ] "Đóng lại" footer button
- [ ] Stepper khi sản phẩm đã trong giỏ

## Delivery Form (khi Giao hàng)
- [ ] Họ tên, SĐT, Địa chỉ (required fields *)
- [ ] Tỉnh/TP → Quận/Huyện → Phường/Xã (cascading selects)
- [ ] Phương thức: "Giao hàng nhanh" / "Giao hàng tiết kiệm"
- [ ] "Miễn phí vận chuyển" checkbox (đơn ≥ 2.000.000đ)
- [ ] "Phí vận chuyển: Xđ" (hoặc "Miễn phí")
- [ ] Debounce 300ms khi thay đổi province/district

## Toast
- [ ] Position: bottom-right
- [ ] Success: green (emerald-deep)
- [ ] Error: red (bordeaux)
- [ ] Auto-dismiss: 3000ms

## 10-Order Limit
- [ ] FE: Button disabled + toast khi ≥10
- [ ] BE: HTTP 429 response khi ≥10 đơn POS hôm nay
