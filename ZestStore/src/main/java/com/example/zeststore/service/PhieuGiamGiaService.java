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

    public List<PhieuGiamGia> getAvailableCoupons(BigDecimal tongTien) {
        if (tongTien == null) tongTien = BigDecimal.ZERO;
        return phieuGiamGiaRepository.findValidCoupons(LocalDateTime.now(), tongTien);
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
        } else {
            giamGia = coupon.getGiaTriGiam();
        }
        if (giamGia.compareTo(giaTriDon) > 0) {
            giamGia = giaTriDon;
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
                request.getNgayBatDau().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Ngày bắt đầu phải từ hôm nay trở đi");
        }
        if (request.getNgayKetThuc() != null &&
                request.getNgayKetThuc().isBefore(LocalDateTime.now())) {
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