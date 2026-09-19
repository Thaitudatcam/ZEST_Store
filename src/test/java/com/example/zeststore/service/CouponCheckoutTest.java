package com.example.zeststore.service;

import com.example.zeststore.entity.*;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CouponCheckoutTest {
    @Mock PhieuGiamGiaRepository phieuGiamGiaRepository;
    @Mock VoucherNguoiDungRepository voucherNguoiDungRepository;
    @Mock SanPhamRepository sanPhamRepository;
    @Mock CouponUsageLogRepository couponUsageLogRepository;
    @InjectMocks PhieuGiamGiaService service;

    private PhieuGiamGia coupon() {
        return PhieuGiamGia.builder().maPhieuGiamGia(1).maCode("SALE").congKhai(true)
                .kieuGiamGia(2).giaTriGiam(BigDecimal.TEN).soLuong(2).build();
    }
    @Test void checkoutRejectsAlreadyUsedCoupon() {
        var c = coupon();
        when(phieuGiamGiaRepository.findByMaCode("SALE")).thenReturn(Optional.of(c));
        when(couponUsageLogRepository.hasActiveUsage("SALE", 7)).thenReturn(true);
        assertThrows(BadRequestException.class, () -> service.validateCoupon("SALE", BigDecimal.valueOf(100), List.of(4), 7));
    }
    @Test void checkoutRejectsUnrelatedProducts() {
        var c = coupon();
        c.setSanPhamApDung(Set.of(SanPham.builder().maSanPham(5).build()));
        when(phieuGiamGiaRepository.findByMaCode("SALE")).thenReturn(Optional.of(c));
        when(sanPhamRepository.findAllById(List.of(4))).thenReturn(List.of(SanPham.builder().maSanPham(4).build()));
        assertThrows(BadRequestException.class, () -> service.validateCoupon("SALE", BigDecimal.valueOf(100), List.of(4), null));
    }
    @Test void restrictedPercentageCouponDiscountsOnlyEligibleProducts() {
        var c = coupon();
        c.setKieuGiamGia(1);
        c.setGiaTriGiam(BigDecimal.TEN);
        c.setSanPhamApDung(Set.of(SanPham.builder().maSanPham(5).build()));
        when(phieuGiamGiaRepository.findByMaCode("SALE")).thenReturn(Optional.of(c));
        when(sanPhamRepository.findAllById(any())).thenReturn(List.of(
                SanPham.builder().maSanPham(5).build(),
                SanPham.builder().maSanPham(6).build()));

        Map<String, Object> result = service.validateCoupon("SALE", BigDecimal.valueOf(1000),
                List.of(5, 6), null,
                new LinkedHashMap<>(Map.of(5, BigDecimal.valueOf(100), 6, BigDecimal.valueOf(900))));

        assertEquals(0, BigDecimal.TEN.compareTo((BigDecimal) result.get("soTienGiam")));
    }

    @Test void createRejectsEndBeforeStart() {
        when(phieuGiamGiaRepository.findByMaCode("BAD-DATE")).thenReturn(Optional.empty());
        var request = com.example.zeststore.dto.request.CouponRequest.builder()
                .maCode("BAD-DATE").kieuGiamGia(1).giaTriGiam(BigDecimal.TEN)
                .ngayBatDau(java.time.LocalDateTime.now().plusDays(2))
                .ngayKetThuc(java.time.LocalDateTime.now().plusDays(1)).build();
        assertThrows(BadRequestException.class, () -> service.create(request));
    }
    @Test void privateCouponRequiresClaimedPersonalVoucher() {
        var c = coupon(); c.setCongKhai(false);
        when(phieuGiamGiaRepository.findByMaCode("SALE")).thenReturn(Optional.of(c));
        assertThrows(BadRequestException.class, () -> service.validateCoupon("SALE", BigDecimal.valueOf(100), List.of(4), 7));
    }
    @Test void freeshipEnforcesMinimumAndRemainingUses() {
        var c = coupon(); c.setKieuGiamGia(3); c.setGiaTriDonToiThieu(BigDecimal.valueOf(200));
        when(phieuGiamGiaRepository.findByMaCode("SALE")).thenReturn(Optional.of(c));
        assertThrows(BadRequestException.class, () -> service.validateCoupon("SALE", BigDecimal.valueOf(100), List.of(4), null));
        c.setSoLuong(0);
        assertThrows(BadRequestException.class, () -> service.validateCoupon("SALE", BigDecimal.valueOf(300), List.of(4), null));
    }
    @Test void restoresBothCouponTypesOnlyOnceAndKeepsAuditLogs() {
        var c = coupon(); c.setSoLuong(0); c.setTrangThai(0);
        var f = coupon(); f.setMaCode("SHIP"); f.setMaPhieuGiamGia(2); f.setSoLuong(0); f.setTrangThai(0);
        var first = CouponUsageLog.builder().maCode("SALE").maNguoiDung(7).maDonHang(9).loai("ONLINE").build();
        var second = CouponUsageLog.builder().maCode("SHIP").maNguoiDung(7).maDonHang(9).loai("ONLINE_FREESHIP").build();
        var voucher = VoucherNguoiDung.builder().trangThai(TrangThaiVoucher.DA_DUNG).build();
        when(couponUsageLogRepository.findByMaDonHangOrderByMaCodeAsc(9)).thenReturn(List.of(first, second));
        when(phieuGiamGiaRepository.findByMaCodeForUpdate("SALE")).thenReturn(Optional.of(c));
        when(phieuGiamGiaRepository.findByMaCodeForUpdate("SHIP")).thenReturn(Optional.of(f));
        when(voucherNguoiDungRepository.findByNguoiDung_MaNguoiDungAndPhieuGiamGia_MaPhieuGiamGia(7, 1)).thenReturn(Optional.of(voucher));
        service.restoreForOrder(9); service.restoreForOrder(9);
        assertEquals(1, c.getSoLuong()); assertEquals(1, f.getSoLuong());
        assertEquals("RESTORED", first.getLoai()); assertEquals("RESTORED", second.getLoai());
        assertEquals(TrangThaiVoucher.DA_NHAN, voucher.getTrangThai());
        verify(couponUsageLogRepository, times(2)).saveAndFlush(any());
    }
}
