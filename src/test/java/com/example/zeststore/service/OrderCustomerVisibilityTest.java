package com.example.zeststore.service;

import com.example.zeststore.entity.DonHang;
import com.example.zeststore.entity.LichSuDonHang;
import com.example.zeststore.entity.NguoiDung;
import com.example.zeststore.repository.*;
import com.example.zeststore.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/** Customer payloads must never expose an explicitly internal order note. */
@ExtendWith(MockitoExtension.class)
class OrderCustomerVisibilityTest {

    @Mock DonHangRepository donHangRepository;
    @Mock MucDonHangRepository mucDonHangRepository;
    @Mock GioHangRepository gioHangRepository;
    @Mock MucGioHangRepository mucGioHangRepository;
    @Mock BienTheSanPhamRepository bienTheRepository;
    @Mock PhieuGiamGiaRepository phieuGiamGiaRepository;
    @Mock NguoiDungRepository nguoiDungRepository;
    @Mock ThanhToanRepository thanhToanRepository;
    @Mock LichSuDonHangRepository lichSuDonHangRepository;
    @Mock OrderSseService orderSseService;
    @Mock ThongBaoService thongBaoService;
    @Mock GhnService ghnService;
    @Mock CheckoutShippingService checkoutShippingService;
    @Mock VoucherNguoiDungRepository voucherNguoiDungRepository;
    @Mock PhieuGiamGiaService phieuGiamGiaService;
    @Mock InventoryService inventoryService;
    @Mock CampaignDiscountService campaignDiscountService;
    @InjectMocks DonHangService service;

    private DonHang order;
    private LichSuDonHang internalNote;
    private LichSuDonHang customerNote;
    private LichSuDonHang legacyNote;

    @BeforeEach
    void setUp() {
        NguoiDung customer = NguoiDung.builder().maNguoiDung(42).build();
        order = DonHang.builder().maDonHang(7).maDonHangCode("DH0007")
                .nguoiDung(customer).build();
        internalNote = LichSuDonHang.builder().maLichSu(1).donHang(order)
                .trangThaiMoi(2).ghiChu("Ghi chú nội bộ").khachHangXem(false).build();
        customerNote = LichSuDonHang.builder().maLichSu(2).donHang(order)
                .trangThaiMoi(2).ghiChu("Đơn đang được xử lý").khachHangXem(true).build();
        legacyNote = LichSuDonHang.builder().maLichSu(3).donHang(order)
                .trangThaiMoi(1).ghiChu("Ghi chú cũ").khachHangXem(null).build();

        lenient().when(donHangRepository.findById(7)).thenReturn(Optional.of(order));
        lenient().when(mucDonHangRepository.findByDonHang_MaDonHang(7)).thenReturn(List.of());
        lenient().when(thanhToanRepository.findByDonHang_MaDonHang(7)).thenReturn(List.of());
        lenient().when(lichSuDonHangRepository.findByDonHang_MaDonHangOrderByThoiGianDesc(7))
                .thenReturn(List.of(internalNote, customerNote, legacyNote));
    }

    @Test
    void authenticatedOrderDetailFiltersInternalNotes() {
        Map<String, Object> payload = service.getOrderDetailForUser(7, 42);

        @SuppressWarnings("unchecked")
        List<LichSuDonHang> history = (List<LichSuDonHang>) payload.get("history");
        assertEquals(List.of(customerNote, legacyNote), history);
        assertFalse(history.contains(internalNote));
    }

    @Test
    void authenticatedOrderDetailRejectsAnotherCustomer() {
        assertThrows(BadRequestException.class, () -> service.getOrderDetailForUser(7, 99));
        verify(lichSuDonHangRepository, never()).findByDonHang_MaDonHangOrderByThoiGianDesc(7);
    }

    @Test
    void publicLookupFiltersInternalNotes() {
        when(donHangRepository.findByMaDonHangCodeAndEmail("DH0007", "buyer@example.com"))
                .thenReturn(Optional.of(order));

        Map<String, Object> payload = service.lookupOrder("DH0007", "buyer@example.com");

        @SuppressWarnings("unchecked")
        List<LichSuDonHang> history = (List<LichSuDonHang>) payload.get("history");
        assertEquals(List.of(customerNote, legacyNote), history);
        assertFalse(history.contains(internalNote));
    }
}
