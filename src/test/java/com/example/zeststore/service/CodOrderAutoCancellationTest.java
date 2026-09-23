package com.example.zeststore.service;

import com.example.zeststore.entity.DonHang;
import com.example.zeststore.entity.LichSuDonHang;
import com.example.zeststore.entity.NguoiDung;
import com.example.zeststore.entity.ThanhToan;
import com.example.zeststore.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CodOrderAutoCancellationTest {

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

    @Test
    void expiredPendingOnlineCodIsCancelledAndItsReservationIsReleased() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(24);
        NguoiDung customer = NguoiDung.builder().maNguoiDung(7).build();
        NguoiDung system = NguoiDung.builder().maNguoiDung(1).build();
        DonHang order = DonHang.builder()
                .maDonHang(20)
                .loaiDonHang(1)
                .trangThaiDon(1)
                .stockState("RESERVED")
                .ngayDat(threshold.minusMinutes(1))
                .nguoiDung(customer)
                .build();
        ThanhToan cod = ThanhToan.builder()
                .maThanhToan(30)
                .donHang(order)
                .phuongThuc(1)
                .trangThaiThanhToan(1)
                .build();
        when(donHangRepository.findByIdForUpdate(20)).thenReturn(Optional.of(order));
        when(thanhToanRepository.findByDonHang_MaDonHang(20)).thenReturn(List.of(cod));
        when(nguoiDungRepository.findByVaiTro_TenVaiTroInAndTrangThai(anyList(), eq(1)))
                .thenReturn(List.of(system));

        assertTrue(service.autoCancelExpiredCodOrder(20, threshold));

        assertEquals(5, order.getTrangThaiDon());
        assertEquals(3, cod.getTrangThaiThanhToan());
        verify(inventoryService).release(order);
        verify(phieuGiamGiaService).restoreForOrder(20);
        verify(donHangRepository).save(order);
        verify(thanhToanRepository).save(cod);
        verify(orderSseService).sendOrderStatusUpdate(eq(20), eq(5), eq(1), eq("system"), contains("quá hạn"));
        verify(thongBaoService).taoThongBao(eq(7), contains("tự động hủy"), contains("quá thời hạn"),
                eq("DON_HANG_CAP_NHAT"), eq("/orders/20"));

        ArgumentCaptor<LichSuDonHang> history = ArgumentCaptor.forClass(LichSuDonHang.class);
        verify(lichSuDonHangRepository).save(history.capture());
        assertEquals(1, history.getValue().getTrangThaiCu());
        assertEquals(5, history.getValue().getTrangThaiMoi());
        assertTrue(history.getValue().getKhachHangXem());
        assertTrue(history.getValue().getGhiChu().contains("COD"));
    }

    @Test
    void recentOrNonCodOrderIsNotCancelled() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(24);
        DonHang recent = DonHang.builder().maDonHang(21).loaiDonHang(1).trangThaiDon(1)
                .ngayDat(threshold.plusMinutes(1)).stockState("RESERVED").build();
        when(donHangRepository.findByIdForUpdate(21)).thenReturn(Optional.of(recent));

        assertFalse(service.autoCancelExpiredCodOrder(21, threshold));
        verifyNoInteractions(inventoryService, phieuGiamGiaService, lichSuDonHangRepository);

        DonHang expired = DonHang.builder().maDonHang(22).loaiDonHang(1).trangThaiDon(1)
                .ngayDat(threshold.minusMinutes(1)).stockState("RESERVED").build();
        ThanhToan online = ThanhToan.builder().phuongThuc(2).trangThaiThanhToan(1).build();
        when(donHangRepository.findByIdForUpdate(22)).thenReturn(Optional.of(expired));
        when(thanhToanRepository.findByDonHang_MaDonHang(22)).thenReturn(List.of(online));

        assertFalse(service.autoCancelExpiredCodOrder(22, threshold));
        verifyNoInteractions(inventoryService, phieuGiamGiaService, lichSuDonHangRepository);
    }

    @Test
    void legacyOrderIsSkippedUntilInventoryIsReconciled() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(24);
        DonHang legacy = DonHang.builder().maDonHang(23).loaiDonHang(1).trangThaiDon(1)
                .ngayDat(threshold.minusMinutes(1)).stockState("LEGACY").build();
        when(donHangRepository.findByIdForUpdate(23)).thenReturn(Optional.of(legacy));

        assertFalse(service.autoCancelExpiredCodOrder(23, threshold));
        verifyNoInteractions(thanhToanRepository, inventoryService, phieuGiamGiaService,
                lichSuDonHangRepository, orderSseService);
    }
}
