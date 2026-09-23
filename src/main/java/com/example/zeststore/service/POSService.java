package com.example.zeststore.service;

import com.example.zeststore.dto.request.PosOrderRequest;
import com.example.zeststore.entity.*;
import com.example.zeststore.exception.BadRequestException;
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
    private final CheckoutShippingService checkoutShippingService;
    private final CampaignDiscountService campaignDiscountService;

    public Map<String, Object> validateCoupon(String maCode, Integer maNguoiDung, BigDecimal tongTien,
                                               List<Integer> productIds,
                                               Map<Integer, BigDecimal> productSubtotals) {
        try {
            Map<String, Object> result = new LinkedHashMap<>(phieuGiamGiaService.validateCoupon(
                    maCode.trim(), tongTien, productIds, maNguoiDung, productSubtotals));
            if (Integer.valueOf(3).equals(result.get("kieuGiamGia")))
                throw new BadRequestException("Mã freeship không áp dụng tại quầy");
            result.put("hopLe", true);
            return result;
        } catch (BadRequestException ex) {
            return Map.of("hopLe", false, "lyDoTuChoi", ex.getMessage());
        }
    }

    public Map<String, Object> getBestCoupon(Integer maNguoiDung, BigDecimal tongTien,
                                              List<Integer> productIds,
                                              Map<Integer, BigDecimal> productSubtotals) {
        Map<String, Object> best = null;
        for (Map<String, Object> candidate : phieuGiamGiaService
                .getAvailableCoupons(tongTien, maNguoiDung, productIds)) {
            if (Integer.valueOf(3).equals(candidate.get("kieuGiamGia"))) continue;
            Map<String, Object> validated = validateCoupon(
                    candidate.get("maCode").toString(), maNguoiDung, tongTien, productIds, productSubtotals);
            if (!Boolean.TRUE.equals(validated.get("hopLe"))) continue;
            if (best == null || ((BigDecimal) validated.get("soTienGiam"))
                    .compareTo((BigDecimal) best.get("soTienGiam")) > 0) {
                best = new LinkedHashMap<>(validated);
            }
        }
        if (best == null) {
            return Map.of("found", false, "message", "Không có mã giảm giá phù hợp");
        }
        best.put("found", true);
        best.put("isBest", true);
        return best;
    }

    @Transactional
    public Map<String, Object> createPosOrder(PosOrderRequest request, Integer adminUserId) {
        NguoiDung admin = nguoiDungRepository.findByIdForUpdate(adminUserId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        String clientKey = request.getCheckoutKey();
        if (clientKey == null || clientKey.isBlank()) throw new BadRequestException("Thiếu mã xác nhận hóa đơn");
        String checkoutKey = "POS:" + adminUserId + ":" + clientKey.trim();
        DonHang previous = donHangRepository.findByCheckoutKey(checkoutKey).orElse(null);
        if (previous != null) return Map.of("maDonHang", previous.getMaDonHang(),
                "thanhToan", previous.getTongTien(),
                "message", "Đơn đã được tạo trước đó");
        if (!Integer.valueOf(5).equals(request.getPhuongThucThanhToan())
                && !Integer.valueOf(6).equals(request.getPhuongThucThanhToan()))
            throw new BadRequestException("POS chỉ nhận tiền mặt hoặc chuyển khoản đã được nhân viên xác nhận");

        List<Map<String, Object>> orderItems = new ArrayList<>();
        BigDecimal tongTien = BigDecimal.ZERO;

        SortedMap<Integer, Integer> quantities = new TreeMap<>();
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            for (PosOrderRequest.PosItem item : request.getItems()) {
                if (item == null || item.getMaBienThe() == null || item.getSoLuong() == null || item.getSoLuong() <= 0)
                    throw new BadRequestException("Số lượng sản phẩm không hợp lệ");
                quantities.merge(item.getMaBienThe(), item.getSoLuong(), Math::addExact);
            }
        }
        if (quantities.isEmpty()) throw new BadRequestException("Giỏ hàng trống");
        List<PosCartItem> heldItems = posCartRepository.findByAdmin_MaNguoiDungAndDraftKey(adminUserId, clientKey.trim());
        SortedMap<Integer, Integer> heldQuantities = new TreeMap<>();
        heldItems.forEach(i -> heldQuantities.merge(i.getBienThe().getMaBienThe(), i.getSoLuong(), Math::addExact));
        if (!quantities.equals(heldQuantities))
            throw new BadRequestException("Giỏ hàng chưa được giữ đủ số lượng. Vui lòng giữ lại hàng trước khi thanh toán");
        Map<Integer, BigDecimal> pctMap = campaignDiscountService.pctByVariantIds(quantities.keySet());
        for (var entry : quantities.entrySet()) {
            BienTheSanPham variant = inventoryService.lockVariant(entry.getKey());
            if (heldItems.stream().anyMatch(i -> !i.getNgayTao().isAfter(LocalDateTime.now().minusMinutes(30))))
                throw new BadRequestException("Giữ hàng đã hết hạn hoặc thay đổi. Vui lòng tải lại giỏ hàng trước khi thu tiền");
            if (variant.getNgayXoa() != null || !Integer.valueOf(1).equals(variant.getTrangThai())
                    || variant.getSanPham().getNgayXoa() != null || !Integer.valueOf(1).equals(variant.getSanPham().getTrangThai())
                    || variant.getTonKho()
                    - inventoryService.reserved(entry.getKey(), null, adminUserId, clientKey.trim()) < entry.getValue())
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

            List<Integer> productIds = orderItems.stream()
                    .map(i -> ((BienTheSanPham) i.get("bienThe")).getSanPham().getMaSanPham()).distinct().toList();
            phieuGiamGiaService.validateCoupon(coupon.getMaCode(), tongTien, productIds,
                    customer != null ? customer.getMaNguoiDung() : null);

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

            Map<Integer, BigDecimal> productSubtotals = new LinkedHashMap<>();
            orderItems.forEach(item -> productSubtotals.merge(
                    ((BienTheSanPham) item.get("bienThe")).getSanPham().getMaSanPham(),
                    (BigDecimal) item.get("thanhTien"), BigDecimal::add));
            soTienGiam = phieuGiamGiaService.calculateDiscount(coupon, tongTien, productSubtotals);
        }

        String tenNguoiNhan = request.isGiaoHang() ? request.getTenKhachHang() : customer != null ? customer.getHoTen()
                : (request.getTenKhachHang() != null ? request.getTenKhachHang() : "Khách lẻ");
        String sdtNguoiNhan = request.isGiaoHang() ? request.getSdtKhachHang() : customer != null ? customer.getSoDienThoai()
                : (request.getSdtKhachHang() != null ? request.getSdtKhachHang() : "0000000000");

        BigDecimal shippingFee = BigDecimal.ZERO;
        if (request.isGiaoHang()) {
            if (tenNguoiNhan == null || tenNguoiNhan.isBlank() || sdtNguoiNhan == null
                    || !sdtNguoiNhan.matches("[0-9]{10,11}") || request.getDiaChiGiaoHang() == null
                    || request.getDiaChiGiaoHang().isBlank())
                throw new BadRequestException("Vui lòng nhập đầy đủ tên, số điện thoại và địa chỉ giao hàng");
            shippingFee = checkoutShippingService.calculate(request.getToDistrictId(), request.getToWardCode(),
                    quantities.values().stream().mapToInt(Integer::intValue).sum());
            if (request.isMienPhiVanChuyen()) shippingFee = BigDecimal.ZERO;
        }
        BigDecimal thanhToanTong = tongTien.subtract(soTienGiam).max(BigDecimal.ZERO).add(shippingFee);
        if (request.getExpectedTotal() != null && request.getExpectedTotal().compareTo(thanhToanTong) != 0)
            throw new BadRequestException("Giá/khuyến mãi hoặc phí vận chuyển đã thay đổi. Vui lòng kiểm tra lại trước khi thu tiền");

        DonHang order = DonHang.builder()
                .nguoiDung(customer)
                .loaiDonHang(2)
                .checkoutKey(checkoutKey)
                .tongTien(thanhToanTong)
                .trangThaiDon(request.isGiaoHang() ? 2 : 6)
                .tenNguoiNhan(tenNguoiNhan)
                .sdtNguoiNhan(sdtNguoiNhan)
                .tenKhachTaiQuay(customer == null ? (request.getTenKhachHang() != null ? request.getTenKhachHang() : null) : null)
                .sdtKhachTaiQuay(customer == null ? (request.getSdtKhachHang() != null ? request.getSdtKhachHang() : null) : null)
                .diaChiGiaoHang(request.isGiaoHang() ? request.getDiaChiGiaoHang().trim() : "Tại quầy")
                .phiVanChuyen(shippingFee)
                .soTienGiam(soTienGiam)
                .phieuGiamGia(coupon)
                .build();
        order = donHangRepository.save(order);
        // Mã đơn ngắn, ổn định và đồng nhất với mã sản phẩm (ví dụ: DH0013).
        order.setMaDonHangCode(String.format("DH%04d", order.getMaDonHang()));
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

        inventoryService.deductPos(order, adminUserId, clientKey.trim());

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
                .trangThaiMoi(request.isGiaoHang() ? 2 : 6)
                .nguoiCapNhat(admin)
                .ghiChu(request.isGiaoHang() ? "Bán tại quầy - giao hàng, đã thu tiền" : "Bán tại quầy")
                .build());

        posCartRepository.deleteByAdmin_MaNguoiDungAndDraftKey(adminUserId, clientKey.trim());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("maDonHang", order.getMaDonHang());
        result.put("tongTien", tongTien);
        result.put("soTienGiam", soTienGiam);
        result.put("thanhToan", thanhToanTong);
        result.put("phiVanChuyen", shippingFee);
        result.put("message", "Counter order created successfully");
        return result;
    }
}
