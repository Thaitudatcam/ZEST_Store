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
    @Mock NguoiDungRepository nguoiDungRepository;
    @InjectMocks PhieuGiamGiaService service;

    private PhieuGiamGia coupon() {
        return PhieuGiamGia.builder().maPhieuGiamGia(1).maCode("SALE").congKhai(true)
                .kieuGiamGia(2).giaTriGiam(BigDecimal.TEN).soLuong(2).build();
    }
    @Test void checkoutRejectsCouponWhenCustomerHasNoUsesLeft() {
        var c = coupon();
        var voucher = VoucherNguoiDung.builder().trangThai(TrangThaiVoucher.DA_DUNG).soLuongConLai(0).build();
        when(phieuGiamGiaRepository.findByMaCode("SALE")).thenReturn(Optional.of(c));
        when(voucherNguoiDungRepository.findByNguoiDung_MaNguoiDungAndPhieuGiamGia_MaPhieuGiamGia(7, 1))
                .thenReturn(Optional.of(voucher));
        assertThrows(BadRequestException.class, () -> service.validateCoupon("SALE", BigDecimal.valueOf(100), List.of(4), 7));
    }
    @Test void checkoutRejectsUnrelatedProducts() {
        var c = coupon();
        c.setSanPhamApDung(Set.of(SanPham.builder().maSanPham(5).build()));
        when(phieuGiamGiaRepository.findByMaCode("SALE")).thenReturn(Optional.of(c));
        when(sanPhamRepository.findAllById(List.of(4))).thenReturn(List.of(SanPham.builder().maSanPham(4).build()));
        assertThrows(BadRequestException.class, () -> service.validateCoupon("SALE", BigDecimal.valueOf(100), List.of(4), 7));
    }
    @Test void oneCustomersDepletionDoesNotDisableCouponForEveryone() {
        var c = coupon();
        var exhausted = VoucherNguoiDung.builder().trangThai(TrangThaiVoucher.DA_DUNG).soLuongConLai(0).build();

        assertEquals(2, PhieuGiamGiaService.computeTrangThaiThucTe(c));
        when(voucherNguoiDungRepository.findByNguoiDung_MaNguoiDungAndPhieuGiamGia_MaPhieuGiamGia(7, 1))
                .thenReturn(Optional.of(exhausted));
        assertTrue(service.isCouponUsedByUser(c, 7));
        assertFalse(service.isCouponUsedByUser(c, 8));
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
                List.of(5, 6), 7,
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
    @Test void unacceptedGiftCannotBeAppliedByTypingItsPublicCode() {
        var c = coupon();
        var voucher = VoucherNguoiDung.builder().trangThai(TrangThaiVoucher.CHUA_NHAN).build();
        when(phieuGiamGiaRepository.findByMaCode("SALE")).thenReturn(Optional.of(c));
        when(voucherNguoiDungRepository.findByNguoiDung_MaNguoiDungAndPhieuGiamGia_MaPhieuGiamGia(7, 1))
                .thenReturn(Optional.of(voucher));

        assertThrows(BadRequestException.class,
                () -> service.validateCoupon("SALE", BigDecimal.valueOf(100), List.of(4), 7));
    }
    @Test void allocatedPersonalVoucherCannotBeUsedWhenItsOwnQuotaIsEmpty() {
        var c = coupon(); c.setCongKhai(false); c.setTrangThai(1);
        var voucher = VoucherNguoiDung.builder().trangThai(TrangThaiVoucher.DA_DUNG).soLuongConLai(0).build();
        when(phieuGiamGiaRepository.findByMaCode("SALE")).thenReturn(Optional.of(c));
        when(voucherNguoiDungRepository.findByNguoiDung_MaNguoiDungAndPhieuGiamGia_MaPhieuGiamGia(7, 1))
                .thenReturn(Optional.of(voucher));

        assertThrows(BadRequestException.class, () -> service.validateCoupon(
                "SALE", BigDecimal.valueOf(100), List.of(4), 7));
    }
    @Test void usingAllocatedVoucherConsumesOnePersonalUse() {
        var c = coupon(); c.setSoLuong(2); c.setTrangThai(1);
        var voucher = VoucherNguoiDung.builder().trangThai(TrangThaiVoucher.DA_NHAN).soLuongConLai(2).build();
        when(phieuGiamGiaRepository.findByMaCodeForUpdate("SALE")).thenReturn(Optional.of(c));
        when(voucherNguoiDungRepository.findByNguoiDung_MaNguoiDungAndPhieuGiamGia_MaPhieuGiamGia(7, 1))
                .thenReturn(Optional.of(voucher));

        service.useCoupon("SALE", 7, 9, BigDecimal.TEN, "ONLINE");

        assertEquals(2, c.getSoLuong());
        assertEquals(1, voucher.getSoLuongConLai());
        assertEquals(TrangThaiVoucher.DA_NHAN, voucher.getTrangThai());
    }
    @Test void finiteCouponRequiresIdentifiedCustomer() {
        var c = coupon(); c.setSoLuong(1); c.setTrangThai(1);
        when(phieuGiamGiaRepository.findByMaCodeForUpdate("SALE")).thenReturn(Optional.of(c));

        assertThrows(BadRequestException.class,
                () -> service.useCoupon("SALE", null, 9, BigDecimal.TEN, "POS"));
    }
    @Test void finiteCouponIsNotOfferedToAnonymousPosCustomer() {
        var finite = coupon(); finite.setTrangThai(1);
        var unlimited = coupon(); unlimited.setMaPhieuGiamGia(2); unlimited.setMaCode("OPEN");
        unlimited.setSoLuong(null); unlimited.setTrangThai(1);
        when(phieuGiamGiaRepository.findValidCoupons(any(), eq(BigDecimal.valueOf(100))))
                .thenReturn(List.of(finite, unlimited));

        var result = service.getAvailableCoupons(BigDecimal.valueOf(100), null, List.of(4));

        assertEquals(List.of("OPEN"), result.stream().map(item -> item.get("maCode")).toList());
    }
    @Test void clearingQuotaMakesExistingVouchersUnlimitedAgain() {
        var c = coupon(); c.setTrangThai(1);
        var voucher = VoucherNguoiDung.builder().nguoiDung(NguoiDung.builder().maNguoiDung(7).build())
                .trangThai(TrangThaiVoucher.DA_DUNG).soLuongConLai(0).build();
        when(phieuGiamGiaRepository.findById(1)).thenReturn(Optional.of(c));
        when(voucherNguoiDungRepository.findByPhieuGiamGia_MaPhieuGiamGia(1)).thenReturn(List.of(voucher));
        when(phieuGiamGiaRepository.save(c)).thenReturn(c);
        var request = com.example.zeststore.dto.request.UpdateCouponRequest.builder()
                .xoaGioiHanSoLuong(true).build();

        service.update(1, request);

        assertNull(c.getSoLuong());
        assertNull(voucher.getSoLuongConLai());
        assertEquals(TrangThaiVoucher.DA_NHAN, voucher.getTrangThai());
    }
    @Test void bestOfferRanksRestrictedCouponsByEligibleSubtotal() {
        var restricted = coupon();
        restricted.setTrangThai(1); restricted.setSoLuong(null);
        restricted.setKieuGiamGia(1); restricted.setGiaTriGiam(BigDecimal.valueOf(50));
        restricted.setSanPhamApDung(Set.of(SanPham.builder().maSanPham(5).build()));
        var flat = coupon();
        flat.setMaPhieuGiamGia(2); flat.setMaCode("FLAT"); flat.setTrangThai(1);
        flat.setSoLuong(null); flat.setGiaTriGiam(BigDecimal.valueOf(100));
        when(phieuGiamGiaRepository.findValidCoupons(any(), eq(BigDecimal.valueOf(1000))))
                .thenReturn(List.of(restricted, flat));
        when(phieuGiamGiaRepository.findByMaCode("SALE")).thenReturn(Optional.of(restricted));
        when(phieuGiamGiaRepository.findByMaCode("FLAT")).thenReturn(Optional.of(flat));
        when(sanPhamRepository.findAllById(any())).thenReturn(List.of(
                SanPham.builder().maSanPham(5).build(), SanPham.builder().maSanPham(6).build()));

        var result = service.getBestOffer(BigDecimal.valueOf(1000), 7, List.of(5, 6), false,
                new LinkedHashMap<>(Map.of(5, BigDecimal.valueOf(100), 6, BigDecimal.valueOf(900))));

        assertEquals("FLAT", result.get("maCode"));
        assertEquals(0, BigDecimal.valueOf(100).compareTo((BigDecimal) result.get("soTienGiam")));
    }
    @Test void freeshipEnforcesMinimumAndRemainingUses() {
        var c = coupon(); c.setKieuGiamGia(3); c.setGiaTriDonToiThieu(BigDecimal.valueOf(200));
        when(phieuGiamGiaRepository.findByMaCode("SALE")).thenReturn(Optional.of(c));
        assertThrows(BadRequestException.class, () -> service.validateCoupon("SALE", BigDecimal.valueOf(100), List.of(4), 7));
        var exhausted = VoucherNguoiDung.builder().trangThai(TrangThaiVoucher.DA_DUNG).soLuongConLai(0).build();
        when(voucherNguoiDungRepository.findByNguoiDung_MaNguoiDungAndPhieuGiamGia_MaPhieuGiamGia(7, 1))
                .thenReturn(Optional.of(exhausted));
        assertThrows(BadRequestException.class, () -> service.validateCoupon("SALE", BigDecimal.valueOf(300), List.of(4), 7));
    }
    @Test void restoresBothCouponTypesOnlyOnceAndKeepsAuditLogs() {
        var c = coupon(); c.setSoLuong(2); c.setTrangThai(1);
        var f = coupon(); f.setMaCode("SHIP"); f.setMaPhieuGiamGia(2); f.setSoLuong(2); f.setTrangThai(1);
        var first = CouponUsageLog.builder().maCode("SALE").maNguoiDung(7).maDonHang(9).loai("ONLINE").build();
        var second = CouponUsageLog.builder().maCode("SHIP").maNguoiDung(7).maDonHang(9).loai("ONLINE_FREESHIP").build();
        var voucher = VoucherNguoiDung.builder().trangThai(TrangThaiVoucher.DA_DUNG).soLuongConLai(0).build();
        when(couponUsageLogRepository.findByMaDonHangOrderByMaCodeAsc(9)).thenReturn(List.of(first, second));
        when(phieuGiamGiaRepository.findByMaCodeForUpdate("SALE")).thenReturn(Optional.of(c));
        when(phieuGiamGiaRepository.findByMaCodeForUpdate("SHIP")).thenReturn(Optional.of(f));
        when(voucherNguoiDungRepository.findByNguoiDung_MaNguoiDungAndPhieuGiamGia_MaPhieuGiamGia(7, 1)).thenReturn(Optional.of(voucher));
        service.restoreForOrder(9); service.restoreForOrder(9);
        assertEquals(2, c.getSoLuong()); assertEquals(2, f.getSoLuong());
        assertEquals(1, voucher.getSoLuongConLai());
        assertEquals("RESTORED", first.getLoai()); assertEquals("RESTORED", second.getLoai());
        assertEquals(TrangThaiVoucher.DA_NHAN, voucher.getTrangThai());
        verify(couponUsageLogRepository, times(2)).saveAndFlush(any());
    }

    @Test void eachCustomerGetsTheFullConfiguredQuota() {
        var c = coupon(); c.setSoLuong(30); c.setTrangThai(1);
        var first = VoucherNguoiDung.builder().trangThai(TrangThaiVoucher.DA_NHAN).soLuongConLai(30).build();
        var second = VoucherNguoiDung.builder().trangThai(TrangThaiVoucher.DA_NHAN).soLuongConLai(30).build();
        when(phieuGiamGiaRepository.findByMaCodeForUpdate("SALE")).thenReturn(Optional.of(c));
        when(voucherNguoiDungRepository.findByNguoiDung_MaNguoiDungAndPhieuGiamGia_MaPhieuGiamGia(7, 1))
                .thenReturn(Optional.of(first));
        when(voucherNguoiDungRepository.findByNguoiDung_MaNguoiDungAndPhieuGiamGia_MaPhieuGiamGia(8, 1))
                .thenReturn(Optional.of(second));

        service.useCoupon("SALE", 7, 91, BigDecimal.TEN, "ONLINE");
        service.useCoupon("SALE", 8, 92, BigDecimal.TEN, "ONLINE");

        assertEquals(29, first.getSoLuongConLai());
        assertEquals(29, second.getSoLuongConLai());
        assertEquals(30, c.getSoLuong());
    }
}
