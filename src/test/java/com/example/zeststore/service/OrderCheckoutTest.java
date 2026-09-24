package com.example.zeststore.service;

import com.example.zeststore.dto.request.*;
import com.example.zeststore.entity.*;
import com.example.zeststore.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderCheckoutTest {
    @Mock NguoiDungRepository nguoiDungRepository;
    @Mock DonHangRepository donHangRepository;
    @Mock ThanhToanRepository thanhToanRepository;
    @Mock MucDonHangRepository mucDonHangRepository;
    @Mock GioHangRepository gioHangRepository;
    @Mock MucGioHangRepository mucGioHangRepository;
    @Mock LichSuDonHangRepository lichSuDonHangRepository;
    @Mock PosCartRepository posCartRepository;
    @Mock InventoryService inventoryService;
    @Mock CampaignDiscountService campaignDiscountService;
    @Mock CheckoutShippingService checkoutShippingService;
    @InjectMocks POSService pos;
    @InjectMocks DonHangService online;

    @Test void paidOrderCannotBeCancelledWithoutRefund() {
        var customer = NguoiDung.builder().maNguoiDung(1).build();
        var order = DonHang.builder().maDonHang(9).nguoiDung(customer).trangThaiDon(2).build();
        when(donHangRepository.findByIdForUpdate(9)).thenReturn(Optional.of(order));
        when(thanhToanRepository.findByDonHang_MaDonHang(9)).thenReturn(List.of(
                ThanhToan.builder().trangThaiThanhToan(2).build()));

        assertThrows(com.example.zeststore.exception.BadRequestException.class,
                () -> online.cancelOrder(9, 1));
        verify(inventoryService, never()).release(any());
        assertEquals(2, order.getTrangThaiDon());
    }

    @Test void dateOnlyOrderFilterDoesNotDropDateRange() {
        when(donHangRepository.findByNgayDatInRange(any(), any(), any()))
                .thenReturn(org.springframework.data.domain.Page.empty());

        online.getAllOrders(0, 20, null, null, null,
                LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 2));

        verify(donHangRepository).findByNgayDatInRange(
                eq(LocalDate.of(2026, 9, 1).atStartOfDay()),
                eq(LocalDate.of(2026, 9, 3).atStartOfDay()),
                org.mockito.ArgumentMatchers.any(org.springframework.data.domain.Pageable.class));
    }

    @Test void fromDateOnlyStillFiltersOrders() {
        when(donHangRepository.findByNgayDatInRange(any(), any(), any()))
                .thenReturn(org.springframework.data.domain.Page.empty());

        online.getAllOrders(0, 20, null, null, null,
                LocalDate.of(2026, 9, 1), null);

        verify(donHangRepository).findByNgayDatInRange(
                eq(LocalDate.of(2026, 9, 1).atStartOfDay()),
                eq(java.time.LocalDateTime.of(9999, 12, 31, 23, 59, 59)),
                org.mockito.ArgumentMatchers.any(org.springframework.data.domain.Pageable.class));
    }

    @Test void toDateOnlyStillFiltersOrders() {
        when(donHangRepository.findByNgayDatInRange(any(), any(), any()))
                .thenReturn(org.springframework.data.domain.Page.empty());

        online.getAllOrders(0, 20, null, null, null,
                null, LocalDate.of(2026, 9, 2));

        verify(donHangRepository).findByNgayDatInRange(
                eq(LocalDate.of(1900, 1, 1).atStartOfDay()),
                eq(LocalDate.of(2026, 9, 3).atStartOfDay()),
                org.mockito.ArgumentMatchers.any(org.springframework.data.domain.Pageable.class));
    }

    private OrderRequest onlineRequest() {
        var product = SanPham.builder().maSanPham(2).trangThai(1).build();
        var variant = BienTheSanPham.builder().maBienThe(3).sanPham(product).trangThai(1)
                .gia(BigDecimal.valueOf(100000)).tonKho(50).sku("SP-TRANG-S").build();
        when(nguoiDungRepository.findByIdForUpdate(1)).thenReturn(Optional.of(NguoiDung.builder().maNguoiDung(1).build()));
        when(gioHangRepository.findByNguoiDung_MaNguoiDung(1)).thenReturn(Optional.of(GioHang.builder().maGioHang(10).build()));
        when(mucGioHangRepository.findByGioHang_MaGioHang(10)).thenReturn(List.of(
                MucGioHang.builder().bienThe(variant).soLuong(2).build()));
        when(inventoryService.lockVariant(3)).thenReturn(variant);
        when(campaignDiscountService.pctByVariantIds(any())).thenReturn(Map.of());
        when(checkoutShippingService.calculate(100, "WARD", 2)).thenReturn(BigDecimal.valueOf(30000));
        return OrderRequest.builder().checkoutKey("online-new").phuongThucThanhToan(1)
                .toDistrictId(100).toWardCode("WARD").weight(1).phiVanChuyen(BigDecimal.ZERO).build();
    }

    @Test void onlineIgnoresClientShippingAndWeight() {
        var request = onlineRequest();
        when(donHangRepository.save(any())).thenAnswer(i -> { DonHang o = i.getArgument(0); o.setMaDonHang(99); return o; });
        var result = online.placeOrder(1, request);
        assertEquals(BigDecimal.valueOf(230000), result.get("tongTien"));
        verify(inventoryService).reserve(any());
        verify(mucGioHangRepository).deleteAll(any());
        verify(checkoutShippingService).calculate(100, "WARD", 2);
    }

    @Test void onlineRejectsChangedTotalBeforeCreatingPayment() {
        var request = onlineRequest();
        request.setExpectedTotal(BigDecimal.valueOf(200000));
        assertThrows(com.example.zeststore.exception.BadRequestException.class, () -> online.placeOrder(1, request));
        verify(donHangRepository, never()).save(any());
        verifyNoInteractions(thanhToanRepository);
    }

    @Test void retryPosReturnsOriginalOrderWithoutChargingAgain() {
        when(nguoiDungRepository.findByIdForUpdate(1)).thenReturn(Optional.of(NguoiDung.builder().maNguoiDung(1).build()));
        when(donHangRepository.findByCheckoutKey("POS:1:retry")).thenReturn(Optional.of(
                DonHang.builder().maDonHang(50).tongTien(BigDecimal.TEN).build()));
        var response = pos.createPosOrder(PosOrderRequest.builder().checkoutKey("retry").phuongThucThanhToan(5).build(), 1);
        assertEquals(50, response.get("maDonHang"));
        verifyNoInteractions(inventoryService, thanhToanRepository, mucDonHangRepository);
        verify(donHangRepository, never()).countTodayPosOrders(any());
    }
    @Test void retryOnlineWorksEvenAfterCartWasCleared() {
        when(nguoiDungRepository.findByIdForUpdate(1)).thenReturn(Optional.of(NguoiDung.builder().maNguoiDung(1).build()));
        when(donHangRepository.findByCheckoutKey("WEB:1:retry")).thenReturn(Optional.of(
                DonHang.builder().maDonHang(50).tongTien(BigDecimal.TEN).build()));
        when(thanhToanRepository.findByDonHang_MaDonHang(50)).thenReturn(List.of(ThanhToan.builder().phuongThuc(1).build()));
        var response = online.placeOrder(1, OrderRequest.builder().checkoutKey("retry").build());
        assertEquals(50, response.get("maDonHang"));
        verifyNoInteractions(gioHangRepository, inventoryService);
    }
    @Test void posDeliveryStoresAddressShippingAndFulfilmentState() {
        var staff = NguoiDung.builder().maNguoiDung(1).build();
        var product = SanPham.builder().maSanPham(2).trangThai(1).build();
        var variant = BienTheSanPham.builder().maBienThe(3).sanPham(product).trangThai(1)
                .gia(BigDecimal.valueOf(100000)).tonKho(50).sku("SP-TRANG-S").build();
        when(nguoiDungRepository.findByIdForUpdate(1)).thenReturn(Optional.of(staff));
        when(posCartRepository.findByAdmin_MaNguoiDungAndDraftKey(1, "new")).thenReturn(List.of(
                PosCartItem.builder().admin(staff).draftKey("new").bienThe(variant).soLuong(2).ngayTao(java.time.LocalDateTime.now()).build()));
        when(inventoryService.lockVariant(3)).thenReturn(variant);
        when(campaignDiscountService.pctByVariantIds(any())).thenReturn(Map.of());
        when(checkoutShippingService.calculate(100, "WARD", 2)).thenReturn(BigDecimal.valueOf(30000));
        when(donHangRepository.save(any())).thenAnswer(i -> { DonHang o = i.getArgument(0); o.setMaDonHang(99); return o; });
        var request = PosOrderRequest.builder().checkoutKey("new").phuongThucThanhToan(5).giaoHang(true)
                .tenKhachHang("Khách").sdtKhachHang("0912345678").diaChiGiaoHang("123 ABC, Phường A")
                .toDistrictId(100).toWardCode("WARD").expectedTotal(BigDecimal.valueOf(230000))
                .items(List.of(PosOrderRequest.PosItem.builder().maBienThe(3).soLuong(2).build())).build();
        var result = pos.createPosOrder(request, 1);
        var captor = ArgumentCaptor.forClass(DonHang.class);
        verify(donHangRepository, atLeastOnce()).save(captor.capture());
        assertEquals(2, captor.getValue().getTrangThaiDon());
        assertEquals("DH0099", captor.getValue().getMaDonHangCode());
        assertEquals(2, captor.getValue().getLoaiDonHang());
        assertEquals("123 ABC, Phường A", captor.getValue().getDiaChiGiaoHang());
        assertEquals(BigDecimal.valueOf(230000), result.get("thanhToan"));
        verify(inventoryService).deductPos(any(), eq(1), eq("new"));
        verify(posCartRepository).deleteByAdmin_MaNguoiDungAndDraftKey(1, "new");
        verify(posCartRepository, never()).deleteByAdmin_MaNguoiDung(any());
        verify(donHangRepository, never()).countTodayPosOrders(any());
    }
}
