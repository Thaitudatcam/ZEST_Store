package com.example.zeststore.service;

import com.example.zeststore.entity.*;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.repository.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentHistoryTest {

    @Mock ThanhToanRepository thanhToanRepository;
    @Mock DonHangRepository donHangRepository;
    @Mock MucDonHangRepository mucDonHangRepository;
    @Mock NguoiDungRepository nguoiDungRepository;
    @Mock MucGioHangRepository mucGioHangRepository;
    @Mock BienTheSanPhamRepository bienTheRepository;
    @Mock GioHangRepository gioHangRepository;
    @Mock LichSuDonHangRepository lichSuDonHangRepository;
    @Mock OrderSseService orderSseService;
    @Mock InventoryService inventoryService;
    @Mock PhieuGiamGiaService phieuGiamGiaService;
    @Mock EntityManager entityManager;
    @Mock PlatformTransactionManager transactionManager;
    @InjectMocks ThanhToanService service;

    private ThanhToan payment(Integer id, Integer status, DonHang order) {
        return ThanhToan.builder().maThanhToan(id).donHang(order)
                .trangThaiThanhToan(status).phuongThuc(2)
                .thoiGianTao(LocalDateTime.now().minusHours(3))
                .build();
    }

    // --- completePayment creates history record ---

    @Test void completePayment_createsHistoryRecord() {
        DonHang order = DonHang.builder().maDonHang(10).trangThaiDon(1)
                .nguoiDung(NguoiDung.builder().maNguoiDung(1).build()).build();
        ThanhToan pay = payment(20, 1, order);

        when(thanhToanRepository.findById(20)).thenReturn(Optional.of(pay));
        when(donHangRepository.findByIdForUpdate(10)).thenReturn(Optional.of(order));
        when(thanhToanRepository.findByIdForUpdate(20)).thenReturn(Optional.of(pay));
        when(nguoiDungRepository.findByVaiTro_TenVaiTroInAndTrangThai(anyList(), eq(1)))
                .thenReturn(List.of(NguoiDung.builder().maNguoiDung(100).build()));
        when(thanhToanRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        service.completePayment(20, "TXN123");

        verify(lichSuDonHangRepository).save(argThat(record ->
                record.getDonHang() == order
                && record.getTrangThaiCu() == 1
                && record.getTrangThaiMoi() == 2
                && record.getNguoiCapNhat() != null
                && record.getNguoiCapNhat().getMaNguoiDung() != null
        ));
    }

    @Test void completePayment_historyHasValidNguoiCapNhat() {
        DonHang order = DonHang.builder().maDonHang(10).trangThaiDon(1)
                .nguoiDung(NguoiDung.builder().maNguoiDung(1).build()).build();
        ThanhToan pay = payment(20, 1, order);

        when(thanhToanRepository.findById(20)).thenReturn(Optional.of(pay));
        when(donHangRepository.findByIdForUpdate(10)).thenReturn(Optional.of(order));
        when(thanhToanRepository.findByIdForUpdate(20)).thenReturn(Optional.of(pay));
        when(nguoiDungRepository.findByVaiTro_TenVaiTroInAndTrangThai(anyList(), eq(1)))
                .thenReturn(List.of(NguoiDung.builder().maNguoiDung(100).build()));
        when(thanhToanRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        ArgumentCaptor<LichSuDonHang> captor = ArgumentCaptor.forClass(LichSuDonHang.class);

        service.completePayment(20, "TXN123");

        verify(lichSuDonHangRepository).save(captor.capture());
        assertNotNull(captor.getValue().getNguoiCapNhat());
        assertEquals(100, captor.getValue().getNguoiCapNhat().getMaNguoiDung());
    }

    @Test void completePayment_historyNoteIsCorrect() {
        DonHang order = DonHang.builder().maDonHang(10).trangThaiDon(1)
                .nguoiDung(NguoiDung.builder().maNguoiDung(1).build()).build();
        ThanhToan pay = payment(20, 1, order);

        when(thanhToanRepository.findById(20)).thenReturn(Optional.of(pay));
        when(donHangRepository.findByIdForUpdate(10)).thenReturn(Optional.of(order));
        when(thanhToanRepository.findByIdForUpdate(20)).thenReturn(Optional.of(pay));
        when(nguoiDungRepository.findByVaiTro_TenVaiTroInAndTrangThai(anyList(), eq(1)))
                .thenReturn(List.of(NguoiDung.builder().maNguoiDung(100).build()));
        when(thanhToanRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        ArgumentCaptor<LichSuDonHang> captor = ArgumentCaptor.forClass(LichSuDonHang.class);

        service.completePayment(20, "TXN123");

        verify(lichSuDonHangRepository).save(captor.capture());
        assertEquals("Đã xác nhận thanh toán", captor.getValue().getGhiChu());
        assertEquals(1, captor.getValue().getTrangThaiCu());
        assertEquals(2, captor.getValue().getTrangThaiMoi());
    }

    // --- systemActor fallback tests ---

    @Test void systemActor_fallsBackToId1_whenNoAdminStaffExists() {
        DonHang order = DonHang.builder().maDonHang(10).trangThaiDon(1)
                .nguoiDung(NguoiDung.builder().maNguoiDung(1).build()).build();
        ThanhToan pay = payment(20, 1, order);

        when(thanhToanRepository.findById(20)).thenReturn(Optional.of(pay));
        when(donHangRepository.findByIdForUpdate(10)).thenReturn(Optional.of(order));
        when(thanhToanRepository.findByIdForUpdate(20)).thenReturn(Optional.of(pay));
        when(nguoiDungRepository.findByVaiTro_TenVaiTroInAndTrangThai(anyList(), eq(1)))
                .thenReturn(List.of());
        when(thanhToanRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        ArgumentCaptor<LichSuDonHang> captor = ArgumentCaptor.forClass(LichSuDonHang.class);

        service.completePayment(20, "TXN123");

        verify(lichSuDonHangRepository).save(captor.capture());
        assertEquals(1, captor.getValue().getNguoiCapNhat().getMaNguoiDung());
    }

    @Test void systemActor_prefersAdminOverFallback() {
        DonHang order = DonHang.builder().maDonHang(10).trangThaiDon(1)
                .nguoiDung(NguoiDung.builder().maNguoiDung(1).build()).build();
        ThanhToan pay = payment(20, 1, order);
        NguoiDung adminUser = NguoiDung.builder().maNguoiDung(50).hoTen("Admin").build();

        when(thanhToanRepository.findById(20)).thenReturn(Optional.of(pay));
        when(donHangRepository.findByIdForUpdate(10)).thenReturn(Optional.of(order));
        when(thanhToanRepository.findByIdForUpdate(20)).thenReturn(Optional.of(pay));
        when(nguoiDungRepository.findByVaiTro_TenVaiTroInAndTrangThai(anyList(), eq(1)))
                .thenReturn(List.of(adminUser));
        when(thanhToanRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        ArgumentCaptor<LichSuDonHang> captor = ArgumentCaptor.forClass(LichSuDonHang.class);

        service.completePayment(20, "TXN123");

        verify(lichSuDonHangRepository).save(captor.capture());
        assertEquals(50, captor.getValue().getNguoiCapNhat().getMaNguoiDung());
    }

    // --- failPayment creates history record ---

    @Test void failPayment_createsHistoryWithSystemActor() {
        DonHang order = DonHang.builder().maDonHang(10).trangThaiDon(1)
                .nguoiDung(NguoiDung.builder().maNguoiDung(1).build()).build();
        ThanhToan pay = payment(20, 1, order);

        when(thanhToanRepository.findById(20)).thenReturn(Optional.of(pay));
        when(donHangRepository.findByIdForUpdate(10)).thenReturn(Optional.of(order));
        when(thanhToanRepository.findByIdForUpdate(20)).thenReturn(Optional.of(pay));
        when(nguoiDungRepository.findByVaiTro_TenVaiTroInAndTrangThai(anyList(), eq(1)))
                .thenReturn(List.of(NguoiDung.builder().maNguoiDung(100).build()));
        when(thanhToanRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        ArgumentCaptor<LichSuDonHang> captor = ArgumentCaptor.forClass(LichSuDonHang.class);

        service.failPayment(20);

        verify(lichSuDonHangRepository).save(captor.capture());
        assertNotNull(captor.getValue().getNguoiCapNhat());
        assertEquals(1, captor.getValue().getTrangThaiCu());
        assertEquals(5, captor.getValue().getTrangThaiMoi());
        assertEquals("Thanh toán thất bại hoặc hết hạn", captor.getValue().getGhiChu());
    }

    @Test void failPayment_idempotent_noDoubleHistory() {
        DonHang order = DonHang.builder().maDonHang(10).trangThaiDon(1)
                .nguoiDung(NguoiDung.builder().maNguoiDung(1).build()).build();
        ThanhToan pay = payment(20, 1, order);

        when(thanhToanRepository.findById(20)).thenReturn(Optional.of(pay));
        when(donHangRepository.findByIdForUpdate(10)).thenReturn(Optional.of(order));
        when(thanhToanRepository.findByIdForUpdate(20)).thenReturn(Optional.of(pay));
        when(nguoiDungRepository.findByVaiTro_TenVaiTroInAndTrangThai(anyList(), eq(1)))
                .thenReturn(List.of(NguoiDung.builder().maNguoiDung(100).build()));
        when(thanhToanRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        service.failPayment(20);
        service.failPayment(20);

        verify(lichSuDonHangRepository, times(1)).save(any());
    }

    @Test void completePayment_alreadyCompleted_noDoubleHistory() {
        DonHang order = DonHang.builder().maDonHang(10).trangThaiDon(2).build();
        ThanhToan pay = payment(20, 2, order);

        when(thanhToanRepository.findById(20)).thenReturn(Optional.of(pay));
        when(donHangRepository.findByIdForUpdate(10)).thenReturn(Optional.of(order));
        when(thanhToanRepository.findByIdForUpdate(20)).thenReturn(Optional.of(pay));

        ThanhToan result = service.completePayment(20, "TXN123");

        assertEquals(2, result.getTrangThaiThanhToan());
        verify(lichSuDonHangRepository, never()).save(any());
    }

    // --- Payment with COD method completes without history (non-auto-advance) ---

    @Test void completePayment_existingOrderAdvancesFrom1To2() {
        DonHang order = DonHang.builder().maDonHang(10).trangThaiDon(1)
                .nguoiDung(NguoiDung.builder().maNguoiDung(1).build()).build();
        ThanhToan pay = payment(20, 1, order);

        when(thanhToanRepository.findById(20)).thenReturn(Optional.of(pay));
        when(donHangRepository.findByIdForUpdate(10)).thenReturn(Optional.of(order));
        when(thanhToanRepository.findByIdForUpdate(20)).thenReturn(Optional.of(pay));
        when(nguoiDungRepository.findByVaiTro_TenVaiTroInAndTrangThai(anyList(), eq(1)))
                .thenReturn(List.of(NguoiDung.builder().maNguoiDung(100).build()));
        when(thanhToanRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        service.completePayment(20, "TXN123");

        assertEquals(2, order.getTrangThaiDon());
        verify(inventoryService).deduct(order);
    }

    @Test void completePayment_alreadyCancelledOrder_doesNotAdvance() {
        DonHang order = DonHang.builder().maDonHang(10).trangThaiDon(5)
                .nguoiDung(NguoiDung.builder().maNguoiDung(1).build()).build();
        ThanhToan pay = payment(20, 1, order);

        when(thanhToanRepository.findById(20)).thenReturn(Optional.of(pay));
        when(donHangRepository.findByIdForUpdate(10)).thenReturn(Optional.of(order));
        when(thanhToanRepository.findByIdForUpdate(20)).thenReturn(Optional.of(pay));
        when(thanhToanRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        ThanhToan result = service.completePayment(20, "TXN123");

        assertEquals(3, result.getTrangThaiThanhToan());
        assertEquals(5, order.getTrangThaiDon());
        verifyNoInteractions(inventoryService);
        verify(lichSuDonHangRepository, never()).save(any());
    }
}
