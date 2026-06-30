package com.example.zeststore.service;

import com.example.zeststore.dto.request.CouponRequest;
import com.example.zeststore.dto.response.CouponResponse;
import com.example.zeststore.entity.PhieuGiamGia;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.DuplicateResourceException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.PhieuGiamGiaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PhieuGiamGiaService {

    private final PhieuGiamGiaRepository phieuGiamGiaRepository;

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
        if (tongTien == null) tongTien = BigDecimal.ZERO;
        List<PhieuGiamGia> coupons = phieuGiamGiaRepository.findValidCoupons(LocalDateTime.now(), tongTien);
        List<Map<String, Object>> result = new ArrayList<>();
        for (PhieuGiamGia c : coupons) {
            BigDecimal giamGia;
            if (Integer.valueOf(1).equals(c.getKieuGiamGia())) {
                giamGia = tongTien.multiply(c.getGiaTriGiam()).divide(BigDecimal.valueOf(100));
            } else {
                giamGia = c.getGiaTriGiam();
            }
            if (giamGia.compareTo(tongTien) > 0) giamGia = tongTien;
            if (c.getGiaTriGiamToiDa() != null && giamGia.compareTo(c.getGiaTriGiamToiDa()) > 0) {
                giamGia = c.getGiaTriGiamToiDa();
            }
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("maCode", c.getMaCode());
            m.put("kieuGiamGia", c.getKieuGiamGia());
            m.put("giaTriGiam", c.getGiaTriGiam());
            m.put("soTienGiam", giamGia);
            m.put("giaTriDonToiThieu", c.getGiaTriDonToiThieu() != null ? c.getGiaTriDonToiThieu() : BigDecimal.ZERO);
            m.put("ngayKetThuc", c.getNgayKetThuc() != null ? c.getNgayKetThuc().toString() : "");
            StringBuilder sb = new StringBuilder();
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
            result.add(m);
        }
        return result;
    }

    public PhieuGiamGia getById(Integer id) {
        return phieuGiamGiaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon", id));
    }

    public Map<String, Object> validateCoupon(Map<String, Object> body) {
        String code = (String) body.get("maCode");
        BigDecimal giaTriDon = body.get("giaTriDon") != null
                ? new BigDecimal(body.get("giaTriDon").toString())
                : BigDecimal.ZERO;
        return validateCoupon(code, giaTriDon);
    }

    public Map<String, Object> validateCoupon(String code, BigDecimal giaTriDon) {
        if (giaTriDon == null) giaTriDon = BigDecimal.ZERO;
        PhieuGiamGia coupon = phieuGiamGiaRepository.findByMaCode(code)
                .orElseThrow(() -> new BadRequestException("Invalid coupon code"));

        if (!Integer.valueOf(1).equals(coupon.getTrangThai())) {
            throw new BadRequestException("Coupon is not active");
        }

        LocalDateTime now = LocalDateTime.now();
        if (coupon.getNgayBatDau() != null && now.isBefore(coupon.getNgayBatDau())) {
            throw new BadRequestException("Coupon is not yet valid");
        }
        if (coupon.getNgayKetThuc() != null && now.isAfter(coupon.getNgayKetThuc())) {
            throw new BadRequestException("Coupon has expired");
        }

        if (coupon.getGiaTriDonToiThieu() != null
                && giaTriDon.compareTo(coupon.getGiaTriDonToiThieu()) < 0) {
            throw new BadRequestException("Minimum order value: " + coupon.getGiaTriDonToiThieu());
        }

        BigDecimal giamGia;
        if (Integer.valueOf(1).equals(coupon.getKieuGiamGia())) {
            giamGia = giaTriDon.multiply(coupon.getGiaTriGiam()).divide(BigDecimal.valueOf(100));
        } else if (Integer.valueOf(2).equals(coupon.getKieuGiamGia())) {
            giamGia = coupon.getGiaTriGiam();
        } else {
            // Type 3 = freeship: soTienGiam = 0 (tính sau ở DonHangService với phiVanChuyen)
            giamGia = BigDecimal.ZERO;
        }
        if (coupon.getSoLuong() != null && coupon.getSoLuong() <= 0) {
            coupon.setTrangThai(0);
            phieuGiamGiaRepository.save(coupon);
            throw new BadRequestException("Phiếu giảm giá đã hết số lượng sử dụng");
        }
        if (coupon.getGiaTriGiamToiDa()!=null && giamGia.compareTo(coupon.getGiaTriGiamToiDa()) > 0){
            giamGia = coupon.getGiaTriGiamToiDa();
        }

        return Map.of(
                "maCode", coupon.getMaCode(),
                "kieuGiamGia", coupon.getKieuGiamGia(),
                "giaTriGiam", coupon.getGiaTriGiam(),
                "soTienGiam", giamGia,
                "moTa", "Coupon applied successfully"
        );
    }

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

        return phieuGiamGiaRepository.save(PhieuGiamGia.builder()
                .maCode(request.getMaCode())
                .kieuGiamGia(request.getKieuGiamGia())
                .giaTriGiam(request.getGiaTriGiam())
                .giaTriDonToiThieu(request.getGiaTriDonToiThieu())
                .ngayBatDau(request.getNgayBatDau())
                .ngayKetThuc(request.getNgayKetThuc())
                .trangThai(request.getTrangThai() != null ? request.getTrangThai() : 1)
                .soLuong(request.getSoLuong())
                .giaTriGiamToiDa(request.getGiaTriGiamToiDa())
                .build());
    }

    @Transactional
    public Map<String, String> delete(Integer id) {
        PhieuGiamGia coupon = getById(id);
        coupon.setNgayXoa(LocalDateTime.now());
        phieuGiamGiaRepository.save(coupon); // ✅ không bị chặn
        return Map.of("message", "Coupon deleted");
    }

    public List<CouponResponse> filterPhieuGiamGia(LocalDateTime ngayBatDau, LocalDateTime ngayKetThuc, Integer kieuGiamGia, BigDecimal giaTriGiam){
        return phieuGiamGiaRepository.filterPhieuGiamGia(ngayBatDau, ngayKetThuc, kieuGiamGia, giaTriGiam).stream().map(this::mapToResponse).collect(Collectors.toList());
    }
    private CouponResponse mapToResponse(PhieuGiamGia coupon) {
        return CouponResponse.builder().
                maCode(coupon.getMaCode()).
                kieuGiamGia(coupon.getKieuGiamGia()).
                giaTriGiam(coupon.getGiaTriGiam()).
                giaTriDonToiThieu(coupon.getGiaTriDonToiThieu()).
                ngayBatDau(coupon.getNgayBatDau()).
                ngayKetThuc(coupon.getNgayKetThuc()).
                trangThai(coupon.getTrangThai()).
                soLuong(coupon.getSoLuong()).
                giaTriGiamToiDa(coupon.getGiaTriGiamToiDa()).
                build();

    }
    @Transactional
    public PhieuGiamGia toggleStatus(Integer id) {
        PhieuGiamGia coupon = getById(id);
        coupon.setTrangThai(coupon.getTrangThai() == 1 ? 0 : 1);
        return phieuGiamGiaRepository.save(coupon);
    }
}