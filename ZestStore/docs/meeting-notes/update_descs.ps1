$apiKey = "2180df7767196eb8c107689c37a0c4b3"
$token  = "ATTA0abd26ad716d09843d407e3945d981cf9608b87e5dabee18c7cf2c53a95fb8e9F7869DF6"
$boardId = "6a5250f12eac1dad8f7c4ebc"
$meetingListId = "6a52549dc8a7c2f1c89c7cad"

# Fetch all cards
$allCards = Invoke-RestMethod -Uri "https://api.trello.com/1/boards/$boardId/cards?key=$apiKey&token=$token&fields=id,name,idList"
$cards = $allCards | Where-Object { $_.idList -ne $meetingListId }

$descs = @{}

# === CÀI ĐẶT ===
$descs["6a5251ac08aa05880de3e094"] = "Cấu hình Spring Boot project với JPA/Hibernate, kết nối SQL Server, application.properties. Tạo các entity cơ bản và repository."
$descs["6a5251ad01e391ba601859f9"] = "Tạo React project với Vite + Tailwind CSS 4. Cấu hình routing (react-router-dom), module CSS, và các dependencies cần thiết."
$descs["6a5251ae0a72fee0bb6a7995"] = "Cấu hình CORS trên backend cho phép frontend truy cập. Thiết lập Vite proxy để gọi API backend qua port 3000."
$descs["6a5251af8c3ec5a5dff701c5"] = "Tạo các bảng SQL Server (nguoi_dung, vai_tro, san_pham, bien_the_san_pham, don_hang...). Insert dữ liệu mẫu (seed data) để phát triển và test."

# === XÁC THỰC ===
$descs["6a52510a548e8e5ac5d22c23"] = "Trang đăng nhập (email + password), đăng ký tài khoản mới. Gọi API backend, lưu JWT token, chuyển hướng sau đăng nhập."
$descs["6a5251b1888d61f91edaab7c"] = "Tạo access token (thời hạn ngắn) và refresh token (thời hạn dài) khi đăng nhập. Xử lý refresh token khi access token hết hạn."
$descs["6a5251b27337034c895d8836"] = "Cấu hình SecurityFilterChain, JwtAuthenticationFilter, UserDetailsService. Xác thực request qua JWT token."
$descs["6a5251b34690a02a36c182b2"] = "Axios interceptor tự động đính kèm Bearer token vào header. Xử lý 401 → gọi refresh token → redirect về login nếu refresh thất bại."
$descs["6a5251b4d519e4c391cf795f"] = "ProtectedRoute component chặn user chưa đăng nhập. AdminRoute kiểm tra vai trò admin/staff trước khi render."
$descs["6a5251b53b35c0117fe6e51e"] = "Gửi access token qua HttpOnly cookie + Bearer header. Cấu hình Spring Security đọc cookie và xác thực."
$descs["6a5251b5a244f14267c65cf6"] = "Form đăng ký với validation (email, mật khẩu 8 ký tự, xác nhận mật khẩu). Gọi API đăng ký + tự động đăng nhập."
$descs["6a5251b60a8723086868a885"] = "Trang đổi mật khẩu: nhập mật khẩu cũ + mật khẩu mới. Validation và gọi API backend."

# === NGƯỜI DÙNG ===
$descs["6a52510bff9715e53389663c"] = "Trang hồ sơ cá nhân: hiển thị và chỉnh sửa thông tin (họ tên, email, SĐT, avatar). Upload avatar."
$descs["6a52510c0110c579a05cc732"] = "Quản lý danh sách địa chỉ giao hàng: thêm mới, sửa, xóa, đặt làm mặc định. Form nhập tỉnh/huyện/xã từ API GHN."

# === SẢN PHẨM ===
$descs["6a52510f95b245383b35b9e1"] = "Tạo, xem, sửa, xóa sản phẩm. Form nhập thông tin sản phẩm (tên, mô tả, giá, danh mục). Upload ảnh chính."
$descs["6a52511078f0b9fc78ecc484"] = "Quản lý biến thể sản phẩm (phân loại theo size, màu sắc, dung tích). Mỗi variant có SKU, giá riêng, tồn kho riêng."
$descs["6a525111c19d7ae51c1a443c"] = "Quản lý danh mục sản phẩm phân cấp (cha - con). Hiển thị dạng cây. Lọc sản phẩm theo danh mục."
$descs["6a525112df0f7d88eafb0da7"] = "Tìm kiếm sản phẩm theo tên. Lọc theo danh mục, khoảng giá, thương hiệu, màu sắc. Sort theo giá/ngày tạo/bán chạy."
$descs["6a525112503b2a1de3dcd485"] = "Trang chi tiết sản phẩm: hiển thị ảnh, chọn variant, số lượng. Hiển thị đánh giá sao + bình luận của người mua."
$descs["6a52511388f7456dbfba37ac"] = "Upload ảnh cho sản phẩm (chính + phụ). Xử lý resize, validate định dạng/dung lượng. Lưu trên server."
$descs["6a5251b859642077d8030a94"] = "Dùng @Version annotation để optimistic locking trên bảng bien_the_san_pham. Xử lý OptimisticLockException khi bán hàng."
$descs["6a5251b9c929abdbdada3c75"] = "Tự động sinh slug từ tên sản phẩm (không dấu, thay khoảng trắng bằng dấu gạch). Đảm bảo unique slug."
$descs["6a5251bad519e4c391cf8e80"] = "Upload nhiều ảnh cho từng variant sản phẩm. Tạo bảng anh_bien_the (thứ tự, URL). Cho phép kéo thả sắp xếp."
$descs["6a5251bbe67f6f3f52affca7"] = "Soft delete sản phẩm: đánh dấu deleted_at thay vì xóa vĩnh viễn. Ẩn khỏi danh sách người dùng, admin có thể khôi phục."
$descs["6a5251bcb24b5394896aed9f"] = "Toggle ẩn/hiện sản phẩm trên trang người dùng. Cho phép admin ẩn sản phẩm tạm thời mà không cần xóa."
$descs["6a5251bdbe580d9035f4ddbc"] = "Filter sản phẩm theo khoảng giá (min - max). Kết hợp với lọc danh mục và các thuộc tính khác."
$descs["6a5251be65d9dfbd1b1f2422"] = "Gợi ý tìm kiếm khi gõ (autocomplete). Hiển thị dropdown gợi ý sản phẩm theo từ khóa, sử dụng API tìm kiếm nhanh."
$descs["6a5251bfb5c23c52c22ea072"] = "Cho phép admin tạo hàng loạt biến thể cho sản phẩm (vd: tất cả tổ hợp size x màu) bằng một form."

# === GIỎ HÀNG ===
$descs["6a525114ed5220c97a19c2c1"] = "Quản lý giỏ hàng: thêm sản phẩm (chọn variant + số lượng), xóa, cập nhật số lượng. Hiển thị tổng tiền."
$descs["6a5251bf9493589e068ac7f7"] = "Tạo React Context (useContext + useReducer) quản lý trạng thái giỏ hàng toàn cục. Hỗ trợ thêm/xóa/cập nhật."
$descs["6a5251c0412eb8322c0d601b"] = "Chọn variant (size/màu) và số lượng → thêm vào giỏ hàng. Kiểm tra tồn kho trước khi thêm."
$descs["6a5251c1070234ae657f9d85"] = "Tăng/giảm số lượng sản phẩm trong giỏ. Xóa sản phẩm. Tính lại tổng tiền real-time."
$descs["6a5251c25d96d35478a5635a"] = "Đồng bộ giỏ hàng local (localStorage) với backend API khi user đăng nhập. Xử lý merge giỏ hàng."

# === THANH TOÁN (CHECKOUT) ===
$descs["6a5251c29188c048e9203b69"] = "Form nhập thông tin: họ tên, SĐT, địa chỉ giao hàng. Chọn địa chỉ có sẵn hoặc nhập mới."
$descs["6a5251c30bf5cc89860ef96b"] = "Gọi API GHN tính phí ship dựa trên tỉnh/huyện/xã người nhận. Hiển thị phí ship trước khi đặt hàng."
$descs["6a5251c46a978265e4bd01fb"] = "Form nhập mã giảm giá. Gọi API validate coupon. Hiển thị số tiền giảm và tổng thanh toán sau giảm."
$descs["6a5251c4343aba252b16be75"] = "Hiển thị danh sách phương thức thanh toán (COD, VNPay, MoMo, ZaloPay, VietQR). Cho phép chọn 1 phương thức."
$descs["6a5251c59a1cc6b2b3710e76"] = "Hiển thị danh sách sản phẩm trong giỏ, cho phép tick chọn sản phẩm muốn mua, tính tổng tiền theo sản phẩm đã chọn."

# === ĐƠN HÀNG ===
$descs["6a52511533c4a3c2db451d80"] = "Sau khi checkout → tạo đơn hàng mới. Chuyển đến trang chi tiết đơn hàng với mã đơn và hướng dẫn thanh toán (nếu chưa thanh toán)."
$descs["6a5251159a1cc6b2b370c6df"] = "Trang admin: danh sách đơn hàng với bộ lọc (trạng thái, ngày, loại đơn). Xem chi tiết từng đơn."
$descs["6a525117b4485c5f2f39992c"] = "API + UI cho admin cập nhật trạng thái đơn hàng (Chờ xác nhận, Đang xử lý, Đang giao, Hoàn thành, Đã hủy)."
$descs["6a525118bcd0cbce1f3af78d"] = "Hiển thị timeline lịch sử thay đổi trạng thái đơn. Dùng SSE để cập nhật real-time khi trạng thái thay đổi."
$descs["6a525118296a8cf22a9f999a"] = "User hủy đơn (khi chưa giao). Admin xử lý trả hàng + hoàn tiền. Hoàn lại tồn kho khi hủy."
$descs["6a5251c6412cfe57728c289c"] = "Logic đặt hàng: validate tồn kho, tạo đơn hàng + chi tiết, cập nhật tồn kho, xóa giỏ hàng, trả về mã đơn."
$descs["6a5251c7ede3cbdd70ac1eb9"] = "Component stepper hiển thị các trạng thái đơn hàng dạng các bước (timeline). Highlight bước hiện tại."
$descs["6a5251c8dfb370ff68f4989a"] = "API cho phép admin chuyển trạng thái đơn hàng. Validate luồng trạng thái hợp lệ."
$descs["6a5251c933c4a3c2db46dfc2"] = "Xử lý hủy đơn: kiểm tra trạng thái cho phép hủy, hoàn lại tồn kho các sản phẩm trong đơn."
$descs["6a5251cb527dab3294b74907"] = "Cho phép user xác nhận đã nhận hàng thành công. Cập nhật trạng thái đơn thành 'Hoàn thành'."
$descs["6a5251cce2e4930d3e245302"] = "User gửi yêu cầu trả hàng. Admin xem và duyệt/từ chối. Xử lý hoàn tiền nếu duyệt."
$descs["6a5251cc7a735ebadb402f1d"] = "Bộ lọc đơn hàng admin: phân biệt đơn online và đơn POS. Lọc theo trạng thái, ngày, khách hàng."

# === THANH TOÁN (PAYMENT) ===
$descs["6a5251190b71ab206bcfdd33"] = "Tích hợp VNPay: tạo link thanh toán với thông tin đơn hàng. Xử lý IPN callback và return URL sau thanh toán."
$descs["6a52511aa07e71c46499e38a"] = "Tích hợp MoMo: tạo link thanh toán qua MoMo. Xử lý IPN callback xác nhận thanh toán."
$descs["6a52511bb6aeec4c8fbee347"] = "Tích hợp ZaloPay: tạo order, xử lý callback. Hỗ trợ ZaloPay tại quầy (POS) và online."
$descs["6a52511c095919cb24fe33a9"] = "Tích hợp VietQR: tạo mã QR tĩnh/động. Hiển thị QR trên trang thanh toán cho user quét."
$descs["6a52511c7f611eb03c586d8a"] = "Tạo hóa đơn điện tử (PDF) sau khi đặt hàng thành công. Lưu snapshot thông tin sản phẩm tại thời điểm mua."
$descs["6a5251cd8941f605af85f178"] = "Endpoint tạo link VNPay. Endpoint nhận IPN từ VNPay gửi về. Xác thực chữ ký, cập nhật trạng thái thanh toán."
$descs["6a5251ce14482e250e595196"] = "Endpoint tạo link MoMo + HMAC signature. Xử lý IPN callback, xác thực chữ ký, hoàn tất thanh toán."
$descs["6a5251ce8e8f22ef84e1f8f9"] = "Gọi ZaloPay API tạo order. Xử lý callback POST từ ZaloPay. Xác thực dữ liệu và cập nhật trạng thái."
$descs["6a5251d0020918a3e1aa840e"] = "Sinh mã QR VietQR chứa thông tin tài khoản ngân hàng + số tiền + nội dung chuyển khoản."
$descs["6a5251d0992f43e8192e5976"] = "Xử lý return URL khi user quay lại từ cổng thanh toán. Kiểm tra trạng thái giao dịch, hiển thị kết quả."
$descs["6a5251d24c773d5bcd5b4329"] = "Retry payment: tạo lại link thanh toán mới khi giao dịch trước thất bại. Đảm bảo không tính phí 2 lần."
$descs["6a5251d2e7baeaad0fe26581"] = "Job định kỳ kiểm tra đơn hàng quá 2h chưa thanh toán. Tự động hủy đơn và hoàn lại tồn kho."
$descs["6a5251d32deebb015ad01e8c"] = "Service xử lý hoàn tất thanh toán: cập nhật trạng thái thanh toán, ghi nhận giao dịch, gửi thông báo."

# === HÓA ĐƠN ===
$descs["6a5251d4f7a57974ff6dbf5b"] = "Tự động tạo hóa đơn khi đặt hàng COD. Lưu thông tin thanh toán và trạng thái chờ thanh toán."
$descs["6a5251d5a1a43e0ebd89baa7"] = "Lưu snapshot thông tin sản phẩm (tên, giá, số lượng) vào hóa đơn ngay tại thời điểm đặt hàng (dù sau này sản phẩm thay đổi)."
$descs["6a5251d533c4a3c2db470243"] = "API lấy thông tin hóa đơn theo mã đơn hàng. Hiển thị chi tiết hóa đơn trong trang quản lý đơn hàng."

# === QUẢN TRỊ ===
$descs["6a52510d6a6dd38357ae62c4"] = "Trang admin: quản lý danh sách người dùng (customers + employees). Tìm kiếm, lọc, phân trang."
$descs["6a52510da66cb2e3912972f1"] = "Hệ thống phân quyền: Admin (full quyền), Staff (quản lý đơn hàng + sản phẩm), Customer (user thường)."
$descs["6a52510e8db3cb4fae472262"] = "Dashboard admin với các thống kê: tổng đơn hàng, doanh thu, người dùng mới. Biểu đồ doanh thu theo ngày/tháng/năm."
$descs["6a52512a7b5ccd70be5760c1"] = "Xuất báo cáo doanh thu ra file Excel (.xlsx). Chọn khoảng thời gian, nhóm theo ngày/tháng/năm."
$descs["6a52512b2e20bb0e73e30da4"] = "Gửi báo cáo doanh thu qua email định kỳ (hàng ngày/tuần/tháng). Đính kèm file Excel."
$descs["6a52512b0b71ab206bd00078"] = "Quản lý danh sách thương hiệu, màu sắc, kích cỡ sản phẩm. CRUD từng danh mục."
$descs["6a5251d692e6efd45f037d97"] = "Admin Layout: sidebar menu (dashboard, orders, products, users, coupons...), header với avatar + logout."
$descs["6a5251d70e871860dce8442a"] = "Thống kê doanh thu: tổng theo ngày, tháng, năm. Tính toán doanh thu, lợi nhuận, số đơn hàng."
$descs["6a5251d75ce59495f03e2b1e"] = "Sử dụng Recharts để vẽ biểu đồ: BarChart doanh thu, LineChart xu hướng, PieChart phân bố danh mục."
$descs["6a5251d8afc42d883532281a"] = "Hiển thị top 10 sản phẩm bán chạy nhất. Sort theo số lượng đã bán hoặc doanh thu."
$descs["6a5251d948a846ba97f2176f"] = "Widget đơn hàng gần đây trên dashboard: 5-10 đơn mới nhất. Click để xem chi tiết."
$descs["6a5251da6d4dcbb1567234d6"] = "Lọc đơn hàng theo trạng thái, khoảng ngày, khách hàng. Tìm kiếm theo mã đơn/SĐT."
$descs["6a5251da635980732f66b835"] = "Phân trang cho danh sách đơn hàng (20 đơn/trang). Hiển thị tổng số trang."
$descs["6a5251dbd1107716153137fd"] = "Form thêm/sửa tài khoản employee: nhập email, họ tên, SĐT, phân quyền admin/staff."
$descs["6a5251dc45a99914a4da2f3f"] = "Khóa/mở khóa tài khoản người dùng. Bulk action: chọn nhiều user → khóa/mở khóa hàng loạt."
$descs["6a5251dd79fadeb7a4fb53ee"] = "Click vào tiêu đề cột để sort: họ tên, email, SĐT, ngày tạo. Hỗ trợ sort tăng/giảm dần."
$descs["6a5251dd8941f605af862b31"] = "3 stats cards trên trang Users: Tổng người dùng, Đang hoạt động, Đã khóa. Cập nhật real-time."

# === MÃ GIẢM GIÁ ===
$descs["6a52511d17930212a3da0836"] = "Admin CRUD mã giảm giá: thêm mã (giá trị, % giảm, hạn sử dụng, số lượng). Bật/tắt trạng thái mã."
$descs["6a52511e30bf610e15a0f189"] = "Áp dụng mã giảm giá khi đặt hàng. Validate: mã tồn tại? còn hạn? còn lượt? giá trị đơn tối thiểu?"
$descs["6a5251decdb9cd60239c26cd"] = "API validate coupon cho POS. Kiểm tra mã hợp lệ và trả về số tiền giảm. Fix field giaTriDon -> tongTien."
$descs["6a5251df85dcf3841e42d807"] = "Entity VoucherNguoiDung: lưu mã giảm giá đã được người dùng sử dụng. Giới hạn số lần dùng mỗi user."
$descs["6a5251e0e8de1993a625e507"] = "Giới hạn 70 ký tự cho mã giảm giá. Validation độ dài mã khi tạo. Trim khoảng trắng thừa."

# === TẠI QUẦY (POS) ===
$descs["6a52511f00750355c8b5039f"] = "Giao diện POS: chia làm 2 khu vực (chọn sản phẩm + giỏ hàng). Tìm kiếm nhanh sản phẩm."
$descs["6a52512083d7766f9cd28d89"] = "Quét mã vạch sản phẩm bằng camera (QuaggaJS) hoặc nhập tay. Tìm sản phẩm theo mã vạch/SKU."
$descs["6a525120e7baeaad0fe160c9"] = "Xử lý thanh toán POS: tiền mặt (nhập tiền khách đưa → tính tiền thừa) hoặc ZaloPay."
$descs["6a525121713a36dae8cfd59c"] = "Áp dụng mã giảm giá khi bán tại quầy. Validate mã và cập nhật tổng tiền."
$descs["6a5251e1be7ab5c668ef8eab"] = "Service quản lý giỏ hàng tạm thời cho POS (session-based). Thêm/xóa/sửa sản phẩm."
$descs["6a5251e19375961e43013e47"] = "Tìm và thêm sản phẩm vào giỏ POS bằng mã SKU. Hỗ trợ nhập số lượng."
$descs["6a5251e2b59b015e21497ef7"] = "Tích hợp QuaggaJS (barcode scanner). Hiển thị vùng quét, xử lý kết quả quét mã vạch."
$descs["6a5251e314ccbe45529211a6"] = "Tạo đơn hàng POS với trạng thái hoàn thành. Xử lý thanh toán và cập nhật tồn kho."
$descs["6a5251e426dd32d12519af66"] = "Giao diện chọn nhanh: hiển thị sản phẩm dạng grid. Lọc theo danh mục. Thêm vào giỏ chỉ 1 click."
$descs["6a5251e46a6dd38357b00727"] = "Tìm kiếm và chọn khách hàng cho đơn POS. Tạo khách hàng mới nếu chưa tồn tại."

# === ĐÁNH GIÁ ===
$descs["6a5251252508a022fba7f1c8"] = "Cho phép user gửi đánh giá (1-5 sao + bình luận) sau khi đã nhận hàng. Upload ảnh kèm đánh giá."
$descs["6a5251262b201405881ef68b"] = "Admin xem danh sách đánh giá. Xóa đánh giá vi phạm. Khôi phục đánh giá đã xóa."
$descs["6a5251e5992af0012724bca7"] = "Form đánh giá: chọn rating sao, viết bình luận. Gọi API tạo review."
$descs["6a5251e62d75891843558b22"] = "Kiểm tra user đã mua sản phẩm (đơn hàng hoàn thành) trước khi cho phép đánh giá. Chặn đánh giá ảo."
$descs["6a5251e61d4d4381bd7ca2de"] = "Admin xóa đánh giá (soft delete). Khôi phục đánh giá. Quản lý danh sách đánh giá đã xóa."

# === VẬN CHUYỂN ===
$descs["6a52512236441aebd34fc424"] = "Tích hợp API GHN: tính phí ship, tạo đơn vận chuyển, tra cứu trạng thái giao hàng."
$descs["6a5251239283e22676ba56f9"] = "Admin cấu hình phí vận chuyển theo tỉnh/thành. Thêm/sửa/xóa mức phí."
$descs["6a5251e84577cc60d2b1a3eb"] = "Gọi API GHN lấy danh sách tỉnh/thành, quận/huyện, phường/xã. Cache dữ liệu để sử dụng trong form."
$descs["6a5251e8ed5220c97a1b002d"] = "Tính phí ship dựa trên địa chỉ người nhận (tỉnh → huyện → xã). Gọi GHN API tính phí real-time."
$descs["6a5251e91f4c926be784854a"] = "CRUD phí vận chuyển mặc định: tạo mức phí theo tỉnh, điều chỉnh giá, áp dụng cho đơn hàng."

# === YÊU THÍCH ===
$descs["6a52512642fa6175ab77704b"] = "Trang danh sách yêu thích: hiển thị sản phẩm đã thích. Xóa khỏi danh sách. Thêm vào giỏ hàng."
$descs["6a5251ee70882166c836f86d"] = "API thêm/xóa sản phẩm khỏi danh sách yêu thích. Icon trái tim toggle trên sản phẩm."
$descs["6a5251eed9a28be2af18469e"] = "API kiểm tra sản phẩm đã được user yêu thích chưa. Hiển thị trạng thái trái tim (đỏ/xám)."
$descs["6a5251efc13d1f8050b7911d"] = "Trang wishlist cá nhân: danh sách sản phẩm yêu thích. Phân trang. Thêm vào giỏ hàng từ wishlist."

# === HỖ TRỢ (CHAT) ===
$descs["6a5251275c1a09f29e9fda2e"] = "Chat hỗ trợ real-time: user gửi tin nhắn đến admin. Admin trả lời. SSE cập nhật tin nhắn mới."
$descs["6a525128b00a987f690a60dc"] = "Trang admin: danh sách hội thoại với từng user. Xem lịch sử, trả lời, đánh dấu đã đọc."
$descs["6a5251eafddbe01dd7788086"] = "Dùng Server-Sent Events (SSE) để đẩy tin nhắn mới real-time tới client. Xử lý kết nối/ngắt kết nối."
$descs["6a5251eb6fe34c7511c9a59d"] = "API gửi tin nhắn từ user đến admin. Lưu vào database. Gửi SSE notification cho admin."
$descs["6a5251eb2e20bb0e73e3e8dc"] = "Admin trả lời tin nhắn. Đánh dấu hội thoại đã đọc. SSE gửi tin nhắn mới tới user."
$descs["6a5251ec4ef87529b3fde189"] = "Trang admin: danh sách hội thoại. Hiển thị user, tin nhắn cuối, thời gian, trạng thái đã đọc/chưa đọc."
$descs["6a5251ed944b8440af8ea5f7"] = "Widget chat popup ở góc phải màn hình (user). Mở form chat, gửi tin nhắn, xem lịch sử."

# === CHATBOT AI ===
$descs["6a525129fca394579c6db8e7"] = "Hỗ trợ người dùng giải đáp thắc mắc tự động. Trả lời câu hỏi thường gặp về sản phẩm, đơn hàng, vận chuyển."

# === THÔNG BÁO ===
$descs["6a525129226e4c908af8ff8c"] = "Gửi thông báo cho người dùng khi: đơn hàng được xác nhận, đang giao, hoàn thành. Hiển thị badge thông báo."

# === HIỆU NĂNG ===
$descs["6a52512c4ba255daad26c2a1"] = "Tối ưu hiệu năng: cache dữ liệu danh mục, sản phẩm. Lazy load component. Tối ưu query JPA (fetch join, batch size)."

# === BẢO MẬT ===
$descs["6a52512d6d1f4558609e9c55"] = "JWT refresh token: tạo và lưu refresh token. Validation khi access token hết hạn. Xử lý revoke token."

# === TẢI LÊN ===
$descs["6a5251f01f4c926be7849bde"] = "Upload ảnh cho sản phẩm và variant. Resize ảnh, validate định dạng (jpg, png, webp), giới hạn dung lượng."
$descs["6a5251f01e2704bc932929de"] = "Upload avatar người dùng. Crop ảnh trước khi upload. Lưu nhiều kích thước (thumbnail, medium)."
$descs["6a5251f16df1a52cb766091f"] = "Serve file tĩnh qua API (ảnh upload). Cấu hình đường dẫn lưu trữ. Xử lý cache head cho file ảnh."

# === LỖI ===
$descs["6a5251f293449c7d20c55f77"] = "Fix: thiếu bảng voucher_nguoi_dung trong SQL Server gây lỗi Schema validation. Đã tạo bảng để khởi động được."
$descs["6a5251f2f25cf8b9ea6d6e98"] = "Fix: POS gửi field giaTriDon nhưng backend DTO nhận tongTien. Đổi field name trong AdminPOS.jsx dòng 262."
$descs["6a5251f333d3afb29c962d7f"] = "Fix: ThanhToanService.completePayment() tự động set trangThaiDon=2 khi thanh toán. Giữ nguyên trạng thái 1 (Chờ xác nhận)."
$descs["6a5251f4fdea12b01cf1d0cc"] = "Fix: AdminUsers thiếu stats cards, sort cột, phân trang employees, bulk actions. Đã thêm đầy đủ."

# === CẢI TIẾN ===
$descs["6a5251f5ae9bdee249e23fa5"] = "Di chuyển nút 'Cập nhật trạng thái' xuống ngay dưới OrderStatusStepper để người dùng dễ thao tác."
$descs["6a5251f64f58686e763b2f5a"] = "Di chuyển 'Lịch sử trạng thái' xuống dưới khu vực cập nhật trạng thái theo thứ tự hợp lý."
$descs["6a5251f73ea787e2902f976e"] = "Thêm chức năng xuất Excel báo cáo doanh thu. Sử dụng Apache POI tạo file .xlsx."
$descs["6a5251f7245017ca95354886"] = "Scheduled task gửi email báo cáo doanh thu định kỳ. Cấu hình cron schedule và danh sách người nhận."
$descs["6a5251f840b0fb59297dd454"] = "Hiển thị avatar dạng chữ cái đầu của tên người dùng khi chưa có ảnh đại diện (fallback)."
$descs["6a5251f92a32171a4f541ae4"] = "Thêm skeleton loading components cho các trang chính (products, orders, users) để cải thiện UX."

# === KIỂM THỬ ===
$descs["6a5251f9c30ffeaf9881a207"] = "Kiểm thử toàn bộ luồng: đặt hàng online → thanh toán VNPay/MoMo → admin xác nhận → giao hàng → hoàn thành."
$descs["6a5251fa9dc55de5bb296189"] = "Kiểm thử POS: thêm sản phẩm, quét mã vạch, áp dụng coupon, thanh toán tiền mặt/ZaloPay."
$descs["6a5251fb8e6a11e958f39e3f"] = "Kiểm thử phân quyền: admin vào tất cả trang, staff chỉ vào order + product, customer chỉ thấy trang user."
$descs["6a5251fb83f135275789c1e7"] = "Kiểm thử soft delete: xóa sản phẩm → ẩn khỏi user → admin khôi phục → stock được restore."
$descs["6a5251fcb588f4c5588059ba"] = "Kiểm thử concurrent: 2 user cùng mua sản phẩm cuối cùng. Xử lý OptimisticLockException, thông báo hết hàng."

# Update cards
$total = $cards.Count
$i = 0
$wc = New-Object System.Net.WebClient
$wc.Encoding = [System.Text.Encoding]::UTF8
$wc.Headers.Add("Content-Type", "application/json")

foreach ($card in $cards) {
    $i++
    $desc = $descs[$card.id]
    if (-not $desc) { Write-Output "  SKIP ($i/$total): $($card.name)"; continue }
    
    $body = @{ desc = $desc } | ConvertTo-Json
    $url = "https://api.trello.com/1/cards/$($card.id)?key=$apiKey&token=$token"
    
    try {
        $wc.UploadString($url, "PUT", $body) | Out-Null
        Write-Output "  OK ($i/$total): $($card.name)"
    } catch {
        Write-Output "  FAIL ($i/$total): $($card.name) - $_"
    }
}

$wc.Dispose()
Write-Output "Done!"
