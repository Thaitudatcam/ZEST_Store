package com.example.zeststore.service;

import com.example.zeststore.repository.*;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class POSBestCouponTest {

    @Test
    void selectsCouponWithHighestActualDiscountForSelectedCustomerAndItems() {
        PhieuGiamGiaService coupons = mock(PhieuGiamGiaService.class);
        POSService service = serviceWith(coupons);
        List<Integer> productIds = List.of(10, 20);
        Map<Integer, BigDecimal> subtotals = new LinkedHashMap<>(Map.of(
                10, BigDecimal.valueOf(100_000),
                20, BigDecimal.valueOf(900_000)));
        when(coupons.getAvailableCoupons(BigDecimal.valueOf(1_000_000), 7, productIds)).thenReturn(List.of(
                Map.of("maCode", "PERCENT", "kieuGiamGia", 1),
                Map.of("maCode", "FIXED", "kieuGiamGia", 2)));
        when(coupons.validateCoupon("PERCENT", BigDecimal.valueOf(1_000_000), productIds, 7, subtotals))
                .thenReturn(Map.of("maCode", "PERCENT", "kieuGiamGia", 1,
                        "soTienGiam", BigDecimal.valueOf(10_000)));
        when(coupons.validateCoupon("FIXED", BigDecimal.valueOf(1_000_000), productIds, 7, subtotals))
                .thenReturn(Map.of("maCode", "FIXED", "kieuGiamGia", 2,
                        "soTienGiam", BigDecimal.valueOf(50_000)));

        Map<String, Object> result = service.getBestCoupon(
                7, BigDecimal.valueOf(1_000_000), productIds, subtotals);

        assertTrue((Boolean) result.get("found"));
        assertEquals("FIXED", result.get("maCode"));
        assertEquals(BigDecimal.valueOf(50_000), result.get("soTienGiam"));
    }

    @Test
    void ignoresFreeshipAtTheCounter() {
        PhieuGiamGiaService coupons = mock(PhieuGiamGiaService.class);
        POSService service = serviceWith(coupons);
        when(coupons.getAvailableCoupons(BigDecimal.TEN, null, List.of(1)))
                .thenReturn(List.of(Map.of("maCode", "SHIP", "kieuGiamGia", 3)));

        Map<String, Object> result = service.getBestCoupon(
                null, BigDecimal.TEN, List.of(1), Map.of(1, BigDecimal.TEN));

        assertFalse((Boolean) result.get("found"));
        verify(coupons, never()).validateCoupon(anyString(), any(), any(), any(), any());
    }

    private POSService serviceWith(PhieuGiamGiaService coupons) {
        return new POSService(
                mock(BienTheSanPhamRepository.class), mock(DonHangRepository.class),
                mock(MucDonHangRepository.class), mock(ThanhToanRepository.class),
                mock(LichSuDonHangRepository.class), mock(NguoiDungRepository.class),
                mock(PhieuGiamGiaRepository.class), mock(PosCartRepository.class), coupons,
                mock(VoucherNguoiDungRepository.class), mock(InventoryService.class),
                mock(CheckoutShippingService.class), mock(CampaignDiscountService.class), mock(SalesInvoiceService.class));
    }
}
