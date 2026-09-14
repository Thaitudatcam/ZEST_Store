package com.example.zeststore.service;

import com.example.zeststore.dto.request.PosOrderRequest;
import com.example.zeststore.entity.*;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.TooManyRequestsException;
import com.example.zeststore.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class POSService {

    private final BienTheSanPhamRepository bienTheRepository;
    private final DonHangRepository donHangRepository;
    private final MucDonHangRepository mucDonHangRepository;
    private final ThanhToanRepository thanhToanRepository;
    private final LichSuDonHangRepository lichSuDonHangRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final PhieuGiamGiaRepository phieuGiamGiaRepository;
    private final PosCartRepository posCartRepository;
    private final PhieuGiamGiaService phieuGiamGiaService;
    private final VoucherNguoiDungRepository voucherNguoiDungRepository;
    private final InventoryService inventoryService;
    private final CampaignDiscountService campaignDiscountService;

    public Map<String, Object> validateCoupon(String maCode, Integer maNguoiDung, BigDecimal tongTien) {
        Optional<PhieuGiamGia> opt = phieuGiamGiaRepository.findByMaCode(maCode);
        if (opt.isEmpty()) {
            return Map.of("hopLe", false, "loaiMa", "COUPON", "lyDoTuChoi", "Mã giảm giá không tồn tại");
        }
        PhieuGiamGia coupon = opt.get();

        if (!Integer.valueOf(1).equals(coupon.getTrangThai()) || coupon.getNgayXoa() != null) {
            return Map.of("hopLe", false, "loaiMa", "COUPON", "lyDoTuChoi", "Mã giảm giá đã ngừng hoạt động");
        }
        if (coupon.getNgayBatDau() != null && LocalDateTime.now().isBefore(coupon.getNgayBatDau())) {
            return Map.of("hopLe", false, "loaiMa", "COUPON", "lyDoTuChoi", "Mã giảm giá chưa đến hạn sử dụng");
        }
        if (coupon.getNgayKetThuc() != null && LocalDateTime.now().isAfter(coupon.getNgayKetThuc())) {
            return Map.of("hopLe", false, "loaiMa", "COUPON", "lyDoTuChoi", "Mã giảm giá đã hết hạn");
        }
        if (coupon.getSoLuong() != null && coupon.getSoLuong() <= 0) {
            return Map.of("hopLe", false, "loaiMa", "COUPON", "lyDoTuChoi", "Mã giảm giá đã hết lượt sử dụng");
        }
        if (coupon.getGiaTriDonToiThieu() != null && tongTien.compareTo(coupon.getGiaTriDonToiThieu()) < 0) {
            return Map.of("hopLe", false, "loaiMa", "COUPON", "lyDoTuChoi",
                    "Đơn hàng tối thiểu " + coupon.getGiaTriDonToiThieu() + "đ");
        }
        if (Integer.valueOf(3).equals(coupon.getKieuGiamGia())) {
            return Map.of("hopLe", false, "loaiMa", "COUPON", "lyDoTuChoi", "Mã freeship không áp dụng tại quầy");
        }

        String loaiMa = "COUPON";
        if (maNguoiDung != null) {
            Optional<VoucherNguoiDung> vnd = voucherNguoiDungRepository
                    .findByNguoiDung_MaNguoiDungAndPhieuGiamGia_MaPhieuGiamGia(maNguoiDung, coupon.getMaPhieuGiamGia());
            if (vnd.isPresent()) {
                // Dùng nhiều lần: voucher DA_DUNG cũ vẫn cho dùng tiếp (chỉ chặn khi hết SL).
                loaiMa = "VOUCHER";
            }
        }

        BigDecimal soTienGiam;
        if (Integer.valueOf(1).equals(coupon.getKieuGiamGia())) {
            soTienGiam = tongTien.multiply(coupon.getGiaTriGiam()).divide(BigDecimal.valueOf(100));
        } else {
            soTienGiam = coupon.getGiaTriGiam();
        }
        if (soTienGiam.compareTo(tongTien) > 0) {
            soTienGiam = tongTien;
        }
        if (coupon.getGiaTriGiamToiDa() != null && soTienGiam.compareTo(coupon.getGiaTriGiamToiDa()) > 0) {
            soTienGiam = coupon.getGiaTriGiamToiDa();
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("hopLe", true);
        result.put("maCode", coupon.getMaCode());
        result.put("loaiMa", loaiMa);
        result.put("kieuGiamGia", coupon.getKieuGiamGia());
        result.put("soTienGiam", soTienGiam);
        result.put("lyDoTuChoi", null);
        return result;
    }

    @Transactional
    public Map<String, Object> createPosOrder(PosOrderRequest request, Integer adminUserId) {
        NguoiDung admin = nguoiDungRepository.findByIdForUpdate(adminUserId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        // Frontend quầy hiện không gửi checkoutKey — tự sinh để vẫn bán được,
        // còn khi client có gửi thì giữ nguyên để chống thu tiền trùng
        String clientKey = request.getCheckoutKey();
        String checkoutKey = (clientKey == null || clientKey.isBlank())
                ? "POS:" + adminUserId + ":" + System.currentTimeMillis()
                : "POS:" + adminUserId + ":" + clientKey;
        DonHang previous = donHangRepository.findByCheckoutKey(checkoutKey).orElse(null);
        if (previous != null) return Map.of("maDonHang", previous.getMaDonHang(),
                "thanhToan", previous.getTongTien(),
                "message", "Đơn đã được tạo trước đó");
        if (!Integer.valueOf(5).equals(request.getPhuongThucThanhToan())
                && !Integer.valueOf(6).equals(request.getPhuongThucThanhToan()))
            throw new BadRequestException("POS chỉ nhận tiền mặt hoặc chuyển khoản đã được nhân viên xác nhận");

        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        Long todayPosCount = donHangRepository.countTodayPosOrders(startOfDay);
        if (todayPosCount >= 10) {
            throw new TooManyRequestsException("Đã đạt giới hạn 10 đơn hàng POS trong ngày");
        }


        List<Map<String, Object>> orderItems = new ArrayList<>();
        BigDecimal tongTien = BigDecimal.ZERO;

        SortedMap<Integer, Integer> quantities = new TreeMap<>();
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            for (PosOrderRequest.PosItem item : request.getItems()) {
                if (item == null || item.getMaBienThe() == null || item.getSoLuong() == null || item.getSoLuong() <= 0)
                    throw new BadRequestException("Số lượng sản phẩm không hợp lệ");
                quantities.merge(item.getMaBienThe(), item.getSoLuong(), Math::addExact);
            }
        } else {
            for (PosCartItem item : posCartRepository.findByAdmin_MaNguoiDung(adminUserId))
                quantities.merge(item.getBienThe().getMaBienThe(), item.getSoLuong(), Math::addExact);
        }
        if (quantities.isEmpty()) throw new BadRequestException("Giỏ hàng trống");
        Map<Integer, BigDecimal> pctMap = campaignDiscountService.pctByVariantIds(quantities.keySet());
        for (var entry : quantities.entrySet()) {
            BienTheSanPham variant = inventoryService.lockVariant(entry.getKey());
            PosCartItem reservation = posCartRepository
                    .findByAdmin_MaNguoiDungAndBienThe_MaBienThe(adminUserId, entry.getKey()).orElse(null);
            // Quầy hiện không dùng luồng giữ hàng server (frontend không sync pos-cart):
            // chỉ chặn khi CÓ bản giữ mà đã hết hạn/thiếu số lượng.
            // Không có bản giữ thì kiểm tra tồn khả dụng ở bước dưới (đã trừ phần quầy khác giữ).
            if (reservation != null && (reservation.getNgayTao().isBefore(LocalDateTime.now().minusMinutes(30))
                    || reservation.getSoLuong() < entry.getValue()))
                throw new BadRequestException("Giữ hàng đã hết hạn hoặc thay đổi. Vui lòng tải lại giỏ hàng trước khi thu tiền");
            if (variant.getNgayXoa() != null || variant.getTonKho()
                    - inventoryService.reserved(entry.getKey(), null, adminUserId) < entry.getValue())
                throw new BadRequestException("Không đủ hàng khả dụng cho " + variant.getSku());
            BigDecimal donGia = CampaignDiscountService.discountedPrice(
                    variant.getGia(), pctMap.get(entry.getKey()));
            BigDecimal lineTotal = donGia.multiply(BigDecimal.valueOf(entry.getValue()));
            tongTien = tongTien.add(lineTotal);
            orderItems.add(Map.of("bienThe", variant, "donGia", donGia,
                    "soLuong", entry.getValue(), "thanhTien", lineTotal));
        }

        NguoiDung customer = null;
        if (request.getMaNguoiDung() != null) {
            customer = nguoiDungRepository.findById(request.getMaNguoiDung())
                    .orElseThrow(() -> new BadRequestException("Customer not found: " + request.getMaNguoiDung()));
        }

        BigDecimal soTienGiam = BigDecimal.ZERO;
        PhieuGiamGia coupon = null;
        if (request.getMaCode() != null && !request.getMaCode().trim().isEmpty()) {
            coupon = phieuGiamGiaRepository.findByMaCodeForUpdate(request.getMaCode().trim())
                    .orElseThrow(() -> new BadRequestException("Mã giảm giá không hợp lệ"));

            // Dùng nhiều lần tới khi hết số lượng: không chặn theo user.

            if (!Integer.valueOf(1).equals(coupon.getTrangThai())) {
                throw new BadRequestException("Mã giảm giá không hoạt động");
            }
            LocalDateTime now = LocalDateTime.now();
            if (coupon.getNgayBatDau() != null && now.isBefore(coupon.getNgayBatDau())) {
                throw new BadRequestException("Mã giảm giá chưa đến hạn sử dụng");
            }
            if (coupon.getNgayKetThuc() != null && now.isAfter(coupon.getNgayKetThuc())) {
                throw new BadRequestException("Mã giảm giá đã hết hạn");
            }
            if (coupon.getGiaTriDonToiThieu() != null && tongTien.compareTo(coupon.getGiaTriDonToiThieu()) < 0) {
                throw new BadRequestException("Đơn hàng tối thiểu " + coupon.getGiaTriDonToiThieu() + " để áp dụng mã này");
            }
            if (Integer.valueOf(3).equals(coupon.getKieuGiamGia())) {
                throw new BadRequestException("Mã freeship không áp dụng tại quầy");
            }

            if (Integer.valueOf(1).equals(coupon.getKieuGiamGia())) {
                soTienGiam = tongTien.multiply(coupon.getGiaTriGiam()).divide(BigDecimal.valueOf(100));
            } else {
                soTienGiam = coupon.getGiaTriGiam();
            }
            if (soTienGiam.compareTo(tongTien) > 0) {
                soTienGiam = tongTien;
            }
            if (coupon.getGiaTriGiamToiDa() != null && soTienGiam.compareTo(coupon.getGiaTriGiamToiDa()) > 0) {
                soTienGiam = coupon.getGiaTriGiamToiDa();
            }
        }

        String tenNguoiNhan = customer != null ? customer.getHoTen()
                : (request.getTenKhachHang() != null ? request.getTenKhachHang() : "Khách lẻ");
        String sdtNguoiNhan = customer != null ? customer.getSoDienThoai()
                : (request.getSdtKhachHang() != null ? request.getSdtKhachHang() : "0000000000");

        String code = "POS-" + System.currentTimeMillis();

        BigDecimal thanhToanTong = tongTien.subtract(soTienGiam).max(BigDecimal.ZERO);

        DonHang order = DonHang.builder()
                .nguoiDung(customer)
                .loaiDonHang(2)
                .checkoutKey(checkoutKey)
                .maDonHangCode(code)
                .tongTien(thanhToanTong)
                .trangThaiDon(6)
                .tenNguoiNhan(tenNguoiNhan)
                .sdtNguoiNhan(sdtNguoiNhan)
                .tenKhachTaiQuay(customer == null ? (request.getTenKhachHang() != null ? request.getTenKhachHang() : null) : null)
                .sdtKhachTaiQuay(customer == null ? (request.getSdtKhachHang() != null ? request.getSdtKhachHang() : null) : null)
                .diaChiGiaoHang("Tại quầy")
                .phiVanChuyen(BigDecimal.ZERO)
                .soTienGiam(soTienGiam)
                .phieuGiamGia(coupon)
                .build();
        order = donHangRepository.save(order);

        if (coupon != null) {
            phieuGiamGiaService.useCoupon(coupon.getMaCode(),
                    customer != null ? customer.getMaNguoiDung() : null,
                    order.getMaDonHang(), soTienGiam, "POS");
        }

        for (Map<String, Object> item : orderItems) {
            BienTheSanPham variant = (BienTheSanPham) item.get("bienThe");
            mucDonHangRepository.save(MucDonHang.builder()
                    .donHang(order)
                    .bienThe(variant)
                    .donGia((BigDecimal) item.get("donGia"))
                    .soLuong((Integer) item.get("soLuong"))
                    .thanhTien((BigDecimal) item.get("thanhTien"))
                    .build());
        }

        inventoryService.deductPos(order, adminUserId);

        Integer phuongThuc = request.getPhuongThucThanhToan() != null ? request.getPhuongThucThanhToan() : 5;
        String nhaCungCap = Integer.valueOf(6).equals(phuongThuc) ? "VietQR" : "Tiền mặt";
        Integer trangThaiThanhToan = 2;

        String paymentRef = "POS-" + order.getMaDonHang() + "-" + System.currentTimeMillis();
        thanhToanRepository.save(ThanhToan.builder()
                .donHang(order)
                .phuongThuc(phuongThuc)
                .nhaCungCap(nhaCungCap)
                .trangThaiThanhToan(trangThaiThanhToan)
                .thoiGianTt(LocalDateTime.now())
                .soTien(thanhToanTong)
                .maGiaoDich(paymentRef)
                .build());

        lichSuDonHangRepository.save(LichSuDonHang.builder()
                .donHang(order)
                .trangThaiCu(null)
                .trangThaiMoi(6)
                .nguoiCapNhat(admin)
                .ghiChu("Bán tại quầy")
                .build());

        posCartRepository.deleteByAdmin_MaNguoiDung(adminUserId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("maDonHang", order.getMaDonHang());
        result.put("tongTien", tongTien);
        result.put("soTienGiam", soTienGiam);
        result.put("thanhToan", thanhToanTong);
        result.put("message", "Counter order created successfully");
        return result;
    }
}
