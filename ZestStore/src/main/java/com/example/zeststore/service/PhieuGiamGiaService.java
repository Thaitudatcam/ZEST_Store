package com.example.zeststore.service;

import com.example.zeststore.dto.request.CouponRequest;
import com.example.zeststore.entity.PhieuGiamGia;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.DuplicateResourceException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.PhieuGiamGiaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PhieuGiamGiaService {

    private final PhieuGiamGiaRepository phieuGiamGiaRepository;

    public List<PhieuGiamGia> getAll() {
        return phieuGiamGiaRepository.findByNgayXoaIsNull();
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
        if (coupon.getSoLuong() != null && coupon.getSoLuong() <= 0){
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
        phieuGiamGiaRepository.save(coupon);
        return Map.of("message", "Coupon deleted");
    }
}