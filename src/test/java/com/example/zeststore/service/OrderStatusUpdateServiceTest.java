package com.example.zeststore.service;

import com.example.zeststore.entity.DonHang;
import com.example.zeststore.entity.LichSuDonHang;
import com.example.zeststore.entity.NguoiDung;
import com.example.zeststore.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderStatusUpdateServiceTest {

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
    @Mock SalesInvoiceService salesInvoiceService;
    @InjectMocks DonHangService service;

    @Test
    void publicCheckboxIsPersistedOnStatusHistory() {
        NguoiDung customer = NguoiDung.builder().maNguoiDung(42).build();
        NguoiDung admin = NguoiDung.builder().maNguoiDung(9).hoTen("Admin").build();
        DonHang order = DonHang.builder().maDonHang(20).trangThaiDon(1)
                .stockState("RESERVED").nguoiDung(customer).build();
        when(donHangRepository.findByIdForUpdate(20)).thenReturn(Optional.of(order));
        when(donHangRepository.save(order)).thenReturn(order);
        when(thanhToanRepository.findByDonHang_MaDonHang(20)).thenReturn(List.of());
        when(nguoiDungRepository.findById(9)).thenReturn(Optional.of(admin));

        service.updateOrderStatus(20, 2, "Đơn đã xác nhận", true, 9);

        ArgumentCaptor<LichSuDonHang> captor = ArgumentCaptor.forClass(LichSuDonHang.class);
        verify(lichSuDonHangRepository).save(captor.capture());
        assertTrue(captor.getValue().getKhachHangXem());
        assertEquals("Đơn đã xác nhận", captor.getValue().getGhiChu());
        verify(thongBaoService).taoThongBao(eq(42), contains("Đơn hàng #20"), anyString(),
                eq("DON_HANG_CAP_NHAT"), eq("/orders/20"));
    }

    @Test
    void uncheckedCheckboxPersistsInternalHistoryOnly() {
        NguoiDung admin = NguoiDung.builder().maNguoiDung(9).hoTen("Admin").build();
        DonHang order = DonHang.builder().maDonHang(21).trangThaiDon(1)
                .stockState("RESERVED").build();
        when(donHangRepository.findByIdForUpdate(21)).thenReturn(Optional.of(order));
        when(donHangRepository.save(order)).thenReturn(order);
        when(thanhToanRepository.findByDonHang_MaDonHang(21)).thenReturn(List.of());
        when(nguoiDungRepository.findById(9)).thenReturn(Optional.of(admin));

        service.updateOrderStatus(21, 2, "Ghi chú nội bộ", false, 9);

        ArgumentCaptor<LichSuDonHang> captor = ArgumentCaptor.forClass(LichSuDonHang.class);
        verify(lichSuDonHangRepository).save(captor.capture());
        assertFalse(captor.getValue().getKhachHangXem());
        verifyNoInteractions(thongBaoService);
    }
}
