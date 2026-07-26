package com.example.zeststore.service;

import com.example.zeststore.dto.request.CouponRequest;
import com.example.zeststore.dto.request.UpdateCouponRequest;
import com.example.zeststore.dto.response.CouponResponse;
import com.example.zeststore.entity.*;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.DuplicateResourceException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.Getter;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PhieuGiamGiaService {

    private final PhieuGiamGiaRepository phieuGiamGiaRepository;
    private final VoucherNguoiDungRepository voucherNguoiDungRepository;
    private final DanhMucRepository danhMucRepository;
    private final SanPhamRepository sanPhamRepository;
    private final CouponUsageLogRepository couponUsageLogRepository;

    // ========== IN-MEMORY COUPON RESERVATION ==========
    private final ConcurrentHashMap<String, CouponReservation> reservations = new ConcurrentHashMap<>();

    @Getter
    @AllArgsConstructor
    private static class CouponReservation {
        private final Integer userId;
        private final LocalDateTime expiresAt;
        public boolean isExpired() { return LocalDateTime.now().isAfter(expiresAt); }
    }

    // ========== LIFECYCLE HELPERS ==========
    public static int computeTrangThaiThucTe(PhieuGiamGia c) {
        if (c.getNgayXoa() != null) return 5;
        if (c.getTrangThai() == 0) return 0;
        if (c.getNgayBatDau() != null && c.getNgayBatDau().isAfter(LocalDateTime.now())) return 1;
        if (c.getNgayKetThuc() != null && c.getNgayKetThuc().isBefore(LocalDateTime.now())) return 4;
        if (c.getSoLuong() != null && c.getSoLuong() <= 0) return 3;
        return 2;
    }

    public static String trangThaiThucTeText(int t) {
        return switch (t) {
            case 0 -> "Đã huỷ";
            case 1 -> "Chưa bắt đầu";
            case 2 -> "Đang hoạt động";
            case 3 -> "Hết lượt";
            case 4 -> "Hết hạn";
            case 5 -> "Đã xoá";
            default -> "Không xác định";
        };
    }

    // ========== CRUD ==========
    public List<PhieuGiamGia> getAll() {
        List<PhieuGiamGia> list = phieuGiamGiaRepository.findByNgayXoaIsNull();
        LocalDateTime now = LocalDateTime.now();
        boolean changed = false;
        for (PhieuGiamGia c : list) {
            if (c.getTrangThai() == 1) {
                boolean hetHan = c.getNgayKetThuc() != null && now.isAfter(c.getNgayKetThuc());
                boolean hetSoLuong = c.getSoLuong() != null && c.getSoLuong() <= 0;
                if (hetHan || hetSoLuong) {
                    c.setTrangThai(0);
                    changed = true;
                }
            }
        }
        if (changed) {
            phieuGiamGiaRepository.saveAll(list);
        }
        return list;
    }

    public List<Map<String, Object>> getAvailableCoupons(BigDecimal tongTien) {
        return getAvailableCoupons(tongTien, null);
    }

    public List<Map<String, Object>> getAvailableCoupons(BigDecimal tongTien, Integer userId) {
        return getAvailableCoupons(tongTien, userId, null);
    }

    public List<Map<String, Object>> getAvailableCoupons(BigDecimal tongTien, Integer userId, List<Integer> maSanPhamIds) {
        if (tongTien == null) tongTien = BigDecimal.ZERO;
        List<PhieuGiamGia> coupons = phieuGiamGiaRepository.findValidCoupons(LocalDateTime.now(), tongTien);
        List<Map<String, Object>> result = new ArrayList<>();
        for (PhieuGiamGia c : coupons) {
            if (!Boolean.TRUE.equals(c.getCongKhai())) continue;
            if (isCouponApplicableToProducts(c, maSanPhamIds)) {
                result.add(buildCouponMap(c, tongTien, false));
            }
        }
        if (userId != null) {
            List<VoucherNguoiDung> userVouchers = voucherNguoiDungRepository
                    .findByNguoiDung_MaNguoiDungAndTrangThai(userId, TrangThaiVoucher.DA_NHAN);
            for (VoucherNguoiDung v : userVouchers) {
                PhieuGiamGia p = v.getPhieuGiamGia();
                boolean alreadyInResult = result.stream()
                        .anyMatch(r -> p.getMaCode().equals(r.get("maCode")));
                if (!alreadyInResult && Integer.valueOf(1).equals(p.getTrangThai())
                        && p.getNgayXoa() == null && isCouponApplicableToProducts(p, maSanPhamIds)) {
                    result.add(buildCouponMap(p, tongTien, true));
                }
            }
        }
        return result;
    }

    private boolean isCouponApplicableToProducts(PhieuGiamGia c, List<Integer> maSanPhamIds) {
        if (maSanPhamIds == null || maSanPhamIds.isEmpty()) return true;
        boolean hasCategoryRestriction = c.getDanhMucApDung() != null && !c.getDanhMucApDung().isEmpty();
        boolean hasProductRestriction = c.getSanPhamApDung() != null && !c.getSanPhamApDung().isEmpty();
        if (!hasCategoryRestriction && !hasProductRestriction) return true;
        Set<Integer> allowedCategoryIds = c.getDanhMucApDung().stream()
                .map(DanhMuc::getMaDanhMuc).collect(Collectors.toSet());
        Set<Integer> allowedProductIds = c.getSanPhamApDung().stream()
                .map(SanPham::getMaSanPham).collect(Collectors.toSet());
        List<SanPham> cartProducts = sanPhamRepository.findAllById(maSanPhamIds);
        for (SanPham sp : cartProducts) {
            if (hasProductRestriction && allowedProductIds.contains(sp.getMaSanPham())) return true;
            if (hasCategoryRestriction && sp.getDanhMuc() != null
                    && allowedCategoryIds.contains(sp.getDanhMuc().getMaDanhMuc())) return true;
        }
        return false;
    }

    private Map<String, Object> buildCouponMap(PhieuGiamGia c, BigDecimal tongTien, boolean isPersonal) {
        BigDecimal giamGia;
        if (Integer.valueOf(1).equals(c.getKieuGiamGia())) {
            giamGia = tongTien.multiply(c.getGiaTriGiam()).divide(BigDecimal.valueOf(100));
        } else if (Integer.valueOf(2).equals(c.getKieuGiamGia())) {
            giamGia = c.getGiaTriGiam();
        } else {
            giamGia = BigDecimal.ZERO;
        }
        if (giamGia.compareTo(tongTien) > 0) giamGia = tongTien;
        if (c.getGiaTriGiamToiDa() != null && giamGia.compareTo(c.getGiaTriGiamToiDa()) > 0) {
            giamGia = c.getGiaTriGiamToiDa();
        }
        int trangThaiThucTe = computeTrangThaiThucTe(c);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("maCode", c.getMaCode());
        m.put("kieuGiamGia", c.getKieuGiamGia());
        m.put("giaTriGiam", c.getGiaTriGiam());
        m.put("soTienGiam", giamGia);
        m.put("giaTriDonToiThieu", c.getGiaTriDonToiThieu() != null ? c.getGiaTriDonToiThieu() : BigDecimal.ZERO);
        m.put("ngayKetThuc", c.getNgayKetThuc() != null ? c.getNgayKetThuc().toString() : "");
        m.put("isPersonal", isPersonal);
        m.put("exclusive", c.getExclusive() != null && c.getExclusive());
        m.put("trangThaiThucTe", trangThaiThucTe);
        m.put("trangThaiThucTeText", trangThaiThucTeText(trangThaiThucTe));
        StringBuilder sb = new StringBuilder();
        if (isPersonal) sb.append("[Của bạn] ");
        if (Integer.valueOf(3).equals(c.getKieuGiamGia())) {
            if (c.getGiaTriGiam() == null || c.getGiaTriGiam().compareTo(BigDecimal.ZERO) == 0) {
                sb.append("Miễn phí vận chuyển");
            } else {
                sb.append("Giảm ").append(c.getGiaTriGiam()).append("đ tiền ship");
            }
        } else if (Integer.valueOf(1).equals(c.getKieuGiamGia())) {
            sb.append("Giảm ").append(c.getGiaTriGiam()).append("%");
        } else {
            sb.append("Giảm ").append(c.getGiaTriGiam());
        }
        if (c.getGiaTriDonToiThieu() != null && c.getGiaTriDonToiThieu().compareTo(BigDecimal.ZERO) > 0) {
            sb.append(" - Đơn tối thiểu ").append(c.getGiaTriDonToiThieu());
        }
        m.put("moTa", sb.toString());
        return m;
    }

    public PhieuGiamGia getById(Integer id) {
        return phieuGiamGiaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon", id));
    }

    // ========== VALIDATE ==========
    public Map<String, Object> validateCoupon(Map<String, Object> body) {
        String code = (String) body.get("maCode");
        BigDecimal giaTriDon = body.get("giaTriDon") != null
                ? new BigDecimal(body.get("giaTriDon").toString())
                : BigDecimal.ZERO;
        return validateCoupon(code, giaTriDon, null);
    }

    public Map<String, Object> validateCoupon(String code, BigDecimal giaTriDon) {
        return validateCoupon(code, giaTriDon, null);
    }

    public Map<String, Object> validateCoupon(String code, BigDecimal giaTriDon, List<Integer> maSanPhamIds) {
        if (giaTriDon == null) giaTriDon = BigDecimal.ZERO;
        PhieuGiamGia coupon = phieuGiamGiaRepository.findByMaCode(code)
                .orElseThrow(() -> new BadRequestException("Invalid coupon code"));

        int tt = computeTrangThaiThucTe(coupon);
        if (tt != 2) {
            throw new BadRequestException("Phiếu giảm giá " + trangThaiThucTeText(tt));
        }

        if (coupon.getGiaTriDonToiThieu() != null
                && giaTriDon.compareTo(coupon.getGiaTriDonToiThieu()) < 0) {
            throw new BadRequestException("Đơn hàng tối thiểu " + coupon.getGiaTriDonToiThieu());
        }

        if (!isCouponApplicableToProducts(coupon, maSanPhamIds)) {
            throw new BadRequestException("Mã giảm giá không áp dụng cho sản phẩm trong giỏ hàng");
        }

        BigDecimal giamGia;
        if (Integer.valueOf(1).equals(coupon.getKieuGiamGia())) {
            giamGia = giaTriDon.multiply(coupon.getGiaTriGiam()).divide(BigDecimal.valueOf(100));
        } else if (Integer.valueOf(2).equals(coupon.getKieuGiamGia())) {
            giamGia = coupon.getGiaTriGiam();
        } else {
            giamGia = BigDecimal.ZERO;
        }
        if (coupon.getGiaTriGiamToiDa() != null && giamGia.compareTo(coupon.getGiaTriGiamToiDa()) > 0) {
            giamGia = coupon.getGiaTriGiamToiDa();
        }
        if (giamGia.compareTo(giaTriDon) > 0) {
            giamGia = giaTriDon;
        }

        return Map.of(
                "maCode", coupon.getMaCode(),
                "kieuGiamGia", coupon.getKieuGiamGia(),
                "giaTriGiam", coupon.getGiaTriGiam(),
                "soTienGiam", giamGia,
                "moTa", "Coupon applied successfully"
        );
    }

    // ========== RESERVATION ==========
    public Map<String, Object> reserveCoupon(String maCode, Integer userId) {
        PhieuGiamGia coupon = phieuGiamGiaRepository.findByMaCode(maCode)
                .orElseThrow(() -> new BadRequestException("Invalid coupon code"));
        CouponReservation existing = reservations.get(maCode);
        if (existing != null && !existing.isExpired() && !existing.getUserId().equals(userId)) {
            throw new BadRequestException("Mã giảm giá đang được người khác sử dụng. Vui lòng thử lại sau.");
        }
        reservations.put(maCode, new CouponReservation(userId, LocalDateTime.now().plusMinutes(5)));
        cleanupExpiredReservations();
        return Map.of("reserved", true, "maCode", maCode, "expiresInMinutes", 5);
    }

    public void releaseReservation(String maCode) {
        reservations.remove(maCode);
    }

    public boolean isReservedBy(String maCode, Integer userId) {
        CouponReservation r = reservations.get(maCode);
        if (r == null || r.isExpired()) {
            reservations.remove(maCode);
            return false;
        }
        return r.getUserId().equals(userId);
    }

    private void cleanupExpiredReservations() {
        reservations.entrySet().removeIf(e -> e.getValue().isExpired());
    }

    // ========== AUTO-APPLY BEST OFFER ==========
    public Map<String, Object> getBestOffer(BigDecimal tongTien, Integer userId, List<Integer> maSanPhamIds, boolean pos) {
        if (tongTien == null) tongTien = BigDecimal.ZERO;
        List<Map<String, Object>> available = getAvailableCoupons(tongTien, userId, maSanPhamIds);
        if (pos) {
            available = available.stream()
                    .filter(m -> !Integer.valueOf(3).equals(m.get("kieuGiamGia")))
                    .collect(Collectors.toList());
        }
        if (available.isEmpty()) {
            return Map.of("found", false, "message", "Không có mã giảm giá phù hợp");
        }
        Map<String, Object> best = available.stream()
                .max(Comparator.comparing(m -> (BigDecimal) m.get("soTienGiam")))
                .orElse(null);
        if (best == null) {
            return Map.of("found", false, "message", "Không có mã giảm giá phù hợp");
        }
        best.put("found", true);
        best.put("isBest", true);
        return best;
    }

    // ========== AUDIT LOGGING ==========
    @Transactional
    public void logCouponUsage(String maCode, Integer maNguoiDung, Integer maDonHang,
                                BigDecimal soTienGiam, String loai) {
        couponUsageLogRepository.save(CouponUsageLog.builder()
                .maCode(maCode)
                .maNguoiDung(maNguoiDung)
                .maDonHang(maDonHang)
                .soTienGiam(soTienGiam)
                .loai(loai)
                .thoiGian(LocalDateTime.now())
                .build());
    }

    // ========== USE & DECREMENT ==========
    @Transactional
    public void useCoupon(String maCode, Integer maNguoiDung, Integer maDonHang,
                           BigDecimal soTienGiam, String loai) {
        PhieuGiamGia coupon = phieuGiamGiaRepository.findByMaCodeForUpdate(maCode)
                .orElseThrow(() -> new BadRequestException("Invalid coupon code"));
        if (coupon.getSoLuong() != null && coupon.getSoLuong() > 0) {
            coupon.setSoLuong(coupon.getSoLuong() - 1);
            if (coupon.getSoLuong() <= 0) {
                coupon.setTrangThai(0);
            }
            phieuGiamGiaRepository.save(coupon);
        }
        if (maNguoiDung != null) {
            voucherNguoiDungRepository
                    .findByNguoiDung_MaNguoiDungAndPhieuGiamGia_MaPhieuGiamGia(maNguoiDung, coupon.getMaPhieuGiamGia())
                    .ifPresent(v -> {
                        v.setTrangThai(TrangThaiVoucher.DA_DUNG);
                        v.setNgaySuDung(LocalDateTime.now());
                        voucherNguoiDungRepository.save(v);
                    });
        }
        logCouponUsage(maCode, maNguoiDung, maDonHang, soTienGiam, loai);
        releaseReservation(maCode);
    }

    // ========== RESTORE ON CANCEL ==========
    @Transactional
    public void restoreCoupon(PhieuGiamGia coupon) {
        if (coupon.getSoLuong() != null) {
            coupon.setSoLuong(coupon.getSoLuong() + 1);
            if (coupon.getTrangThai() == 0) {
                coupon.setTrangThai(1);
            }
            phieuGiamGiaRepository.save(coupon);
        }
    }

    // ========== CREATE ==========
    @Transactional
    public PhieuGiamGia create(CouponRequest request) {
        if (phieuGiamGiaRepository.findByMaCode(request.getMaCode()).isPresent()) {
            throw new DuplicateResourceException("Coupon code already exists: " + request.getMaCode());
        }
        if (request.getNgayBatDau() != null &&
                request.getNgayBatDau().toLocalDate().isBefore(LocalDateTime.now().toLocalDate())) {
            throw new IllegalArgumentException("Ngày bắt đầu phải từ hôm nay trở đi");
        }
        if (request.getNgayKetThuc() != null &&
                request.getNgayKetThuc().toLocalDate().isBefore(LocalDateTime.now().toLocalDate())) {
            throw new IllegalArgumentException("Ngày kết thúc phải ở tương lai");
        }
        if (phieuGiamGiaRepository.countByNgayXoaIsNull() >= 70) {
            throw new BadRequestException("Đã đạt giới hạn 70 mã giảm giá");
        }
        if (request.getSoLuong() != null && request.getSoLuong() <= 0) {
            throw new IllegalArgumentException("Số lượng mã phải lớn hơn 0");
        }

        PhieuGiamGia.PhieuGiamGiaBuilder builder = PhieuGiamGia.builder()
                .maCode(request.getMaCode())
                .kieuGiamGia(request.getKieuGiamGia())
                .giaTriGiam(request.getGiaTriGiam())
                .giaTriDonToiThieu(request.getGiaTriDonToiThieu())
                .ngayBatDau(request.getNgayBatDau())
                .ngayKetThuc(request.getNgayKetThuc())
                .trangThai(request.getTrangThai() != null ? request.getTrangThai() : 1)
                .soLuong(request.getSoLuong())
                .giaTriGiamToiDa(request.getGiaTriGiamToiDa())
                .exclusive(request.getExclusive() != null ? request.getExclusive() : false)
                .congKhai(request.getCongKhai() != null ? request.getCongKhai() : false);

        if (request.getMaDanhMucIds() != null && !request.getMaDanhMucIds().isEmpty()) {
            builder.danhMucApDung(new HashSet<>(danhMucRepository.findAllById(request.getMaDanhMucIds())));
        }
        if (request.getMaSanPhamIds() != null && !request.getMaSanPhamIds().isEmpty()) {
            builder.sanPhamApDung(new HashSet<>(sanPhamRepository.findAllById(request.getMaSanPhamIds())));
        }

        return phieuGiamGiaRepository.save(builder.build());
    }

    @Transactional
    public Map<String, String> delete(Integer id) {
        PhieuGiamGia coupon = getById(id);
        coupon.setNgayXoa(LocalDateTime.now());
        phieuGiamGiaRepository.save(coupon);
        return Map.of("message", "Coupon deleted");
    }

    public List<CouponResponse> filterPhieuGiamGia(LocalDateTime ngayBatDau, LocalDateTime ngayKetThuc,
                                                     Integer kieuGiamGia, BigDecimal giaTriGiam) {
        return phieuGiamGiaRepository.filterPhieuGiamGia(ngayBatDau, ngayKetThuc, kieuGiamGia, giaTriGiam)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private CouponResponse mapToResponse(PhieuGiamGia coupon) {
        CouponResponse.CouponResponseBuilder b = CouponResponse.builder()
                .maCode(coupon.getMaCode())
                .kieuGiamGia(coupon.getKieuGiamGia())
                .giaTriGiam(coupon.getGiaTriGiam())
                .giaTriDonToiThieu(coupon.getGiaTriDonToiThieu())
                .ngayBatDau(coupon.getNgayBatDau())
                .ngayKetThuc(coupon.getNgayKetThuc())
                .trangThai(coupon.getTrangThai())
                .trangThaiThucTe(coupon.getTrangThaiThucTe())
                .trangThaiThucTeText(coupon.getTrangThaiThucTeText())
                .soLuong(coupon.getSoLuong())
                .giaTriGiamToiDa(coupon.getGiaTriGiamToiDa())
                .exclusive(coupon.getExclusive() != null && coupon.getExclusive())
                .congKhai(coupon.getCongKhai() != null && coupon.getCongKhai());
        if (coupon.getDanhMucApDung() != null) {
            b.danhMucApDung(coupon.getDanhMucApDung().stream()
                    .map(dm -> new CouponResponse.CategoryInfo(dm.getMaDanhMuc(), dm.getTenDanhMuc()))
                    .collect(Collectors.toList()));
        }
        if (coupon.getSanPhamApDung() != null) {
            b.sanPhamApDung(coupon.getSanPhamApDung().stream()
                    .map(sp -> new CouponResponse.ProductInfo(sp.getMaSanPham(), sp.getTenSanPham()))
                    .collect(Collectors.toList()));
        }
        return b.build();
    }

    @Transactional
    public PhieuGiamGia update(Integer id, UpdateCouponRequest request) {
        PhieuGiamGia coupon = getById(id);

        if (request.getGiaTriGiam() != null) {
            coupon.setGiaTriGiam(request.getGiaTriGiam());
        }
        if (request.getGiaTriDonToiThieu() != null) {
            coupon.setGiaTriDonToiThieu(request.getGiaTriDonToiThieu());
        }
        if (request.getNgayBatDau() != null) {
            coupon.setNgayBatDau(request.getNgayBatDau());
        }
        if (request.getNgayKetThuc() != null) {
            coupon.setNgayKetThuc(request.getNgayKetThuc());
        }
        if (request.getTrangThai() != null) {
            coupon.setTrangThai(request.getTrangThai());
        }
        if (request.getSoLuong() != null) {
            coupon.setSoLuong(request.getSoLuong());
        }
        if (request.getGiaTriGiamToiDa() != null) {
            coupon.setGiaTriGiamToiDa(request.getGiaTriGiamToiDa());
        }
        if (request.getExclusive() != null) {
            coupon.setExclusive(request.getExclusive());
        }
        if (request.getCongKhai() != null) {
            coupon.setCongKhai(request.getCongKhai());
        }
        if (request.getMaDanhMucIds() != null) {
            coupon.setDanhMucApDung(new HashSet<>(danhMucRepository.findAllById(request.getMaDanhMucIds())));
        }
        if (request.getMaSanPhamIds() != null) {
            coupon.setSanPhamApDung(new HashSet<>(sanPhamRepository.findAllById(request.getMaSanPhamIds())));
        }

        return phieuGiamGiaRepository.save(coupon);
    }

    @Transactional
    public PhieuGiamGia toggleStatus(Integer id) {
        PhieuGiamGia coupon = getById(id);
        coupon.setTrangThai(coupon.getTrangThai() == 1 ? 0 : 1);
        return phieuGiamGiaRepository.save(coupon);
    }

    @Transactional
    public List<String> generateBatchVouchers(DotPhatHanh dotPhatHanh) {
        List<String> codes = new ArrayList<>();
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        Random random = new SecureRandom();

        while (codes.size() < dotPhatHanh.getSoLuong()) {
            String code = random.ints(8, 0, chars.length())
                    .mapToObj(chars::charAt)
                    .map(String::valueOf)
                    .collect(Collectors.joining());

            if (phieuGiamGiaRepository.findByMaCode(code).isPresent()) continue;
            if (codes.contains(code)) continue;

            PhieuGiamGia voucher = PhieuGiamGia.builder()
                    .maCode(code)
                    .kieuGiamGia(dotPhatHanh.getKieuGiamGia())
                    .giaTriGiam(dotPhatHanh.getGiaTriGiam())
                    .giaTriDonToiThieu(dotPhatHanh.getGiaTriDonToiThieu())
                    .giaTriGiamToiDa(dotPhatHanh.getGiaTriGiamToiDa())
                    .ngayBatDau(dotPhatHanh.getNgayBatDau())
                    .ngayKetThuc(dotPhatHanh.getNgayKetThuc())
                    .soLuong(1)
                    .loaiPhatHanh(2)
                    .dotPhatHanh(dotPhatHanh)
                    .trangThai(1)
                    .congKhai(false)
                    .build();

            phieuGiamGiaRepository.save(voucher);
            codes.add(code);
        }

        return codes;
    }
}
