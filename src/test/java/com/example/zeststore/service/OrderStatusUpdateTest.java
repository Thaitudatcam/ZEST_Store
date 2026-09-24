package com.example.zeststore.service;

import com.example.zeststore.entity.*;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderStatusUpdateTest {

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

    private NguoiDung admin() {
        return NguoiDung.builder().maNguoiDung(100).hoTen("Admin Test").build();
    }

    private DonHang order(Integer id, Integer status) {
        return DonHang.builder().maDonHang(id).trangThaiDon(status)
                .nguoiDung(NguoiDung.builder().maNguoiDung(1).build()).build();
    }

    // --- Valid transition tests ---

    @Test void status1To2_succeeds() {
        DonHang o = order(1, 1);
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));
        when(nguoiDungRepository.findById(100)).thenReturn(Optional.of(admin()));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());

        service.updateOrderStatus(1, 2, null, false, 100);

        assertEquals(2, o.getTrangThaiDon());
        verify(inventoryService).deduct(o);
    }

    @Test void status2To3_succeeds() {
        DonHang o = order(1, 2);
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));
        when(nguoiDungRepository.findById(100)).thenReturn(Optional.of(admin()));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());

        service.updateOrderStatus(1, 3, null, false, 100);
        assertEquals(3, o.getTrangThaiDon());
    }

    @Test void status3To4_succeeds() {
        DonHang o = order(1, 3);
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));
        when(nguoiDungRepository.findById(100)).thenReturn(Optional.of(admin()));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());

        service.updateOrderStatus(1, 4, null, false, 100);
        assertEquals(4, o.getTrangThaiDon());
    }

    @Test void status4To6_succeeds() {
        DonHang o = order(1, 4);
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));
        when(nguoiDungRepository.findById(100)).thenReturn(Optional.of(admin()));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());

        service.updateOrderStatus(1, 6, null, false, 100);
        assertEquals(6, o.getTrangThaiDon());
    }

    @Test void status4To9_succeeds() {
        DonHang o = order(1, 4);
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));
        when(nguoiDungRepository.findById(100)).thenReturn(Optional.of(admin()));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());

        service.updateOrderStatus(1, 9, null, false, 100);
        assertEquals(9, o.getTrangThaiDon());
        verify(inventoryService).release(o);
    }

    @Test void failedPaidDeliveryIsMarkedAsRefundRequired() {
        DonHang o = order(1, 4);
        ThanhToan payment = ThanhToan.builder().trangThaiThanhToan(2).phuongThuc(2).build();
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));
        when(nguoiDungRepository.findById(100)).thenReturn(Optional.of(admin()));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of(payment));

        service.updateOrderStatus(1, 9, null, false, 100);

        assertEquals(9, o.getTrangThaiDon());
        assertEquals(4, payment.getTrangThaiThanhToan());
        assertFalse(payment.getRefunded());
        verify(thanhToanRepository).save(payment);
    }

    @Test void status1To5_cancelsOrder() {
        DonHang o = order(1, 1);
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));
        when(nguoiDungRepository.findById(100)).thenReturn(Optional.of(admin()));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());

        service.updateOrderStatus(1, 5, null, false, 100);
        assertEquals(5, o.getTrangThaiDon());
        verify(inventoryService).release(o);
    }

    @Test void allPosTransitionsWork() {
        for (var transition : List.of(new int[]{1, 2}, new int[]{2, 3}, new int[]{3, 4}, new int[]{4, 6}, new int[]{4, 9}, new int[]{1, 5}, new int[]{2, 5}, new int[]{3, 5})) {
            DonHang o = order(1, transition[0]);
            when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));
            when(nguoiDungRepository.findById(100)).thenReturn(Optional.of(admin()));
            when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));
            when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());

            service.updateOrderStatus(1, transition[1], null, false, 100);
            assertEquals(transition[1], o.getTrangThaiDon());
            reset(donHangRepository, nguoiDungRepository, thanhToanRepository);
        }
    }

    // --- Invalid transition tests ---

    @Test void status1To3_throwsException() {
        DonHang o = order(1, 1);
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));

        assertThrows(BadRequestException.class,
                () -> service.updateOrderStatus(1, 3, null, false, 100));
    }

    @Test void status2To4_throwsException() {
        DonHang o = order(1, 2);
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));

        assertThrows(BadRequestException.class,
                () -> service.updateOrderStatus(1, 4, null, false, 100));
    }

    @Test void status4To2_throwsException() {
        DonHang o = order(1, 4);
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));

        assertThrows(BadRequestException.class,
                () -> service.updateOrderStatus(1, 2, null, false, 100));
    }

    @Test void status6ToAny_throwsException() {
        DonHang o = order(1, 6);
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));

        assertThrows(BadRequestException.class,
                () -> service.updateOrderStatus(1, 2, null, false, 100));
    }

    @Test void sameStatusReturnsEarly() {
        DonHang o = order(1, 3);
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));

        DonHang result = service.updateOrderStatus(1, 3, null, false, 100);
        assertSame(o, result);
        verify(lichSuDonHangRepository, never()).save(any());
    }

    // --- Note tests ---

    @Test void emptyNoteNormalizedToNull() {
        DonHang o = order(1, 1);
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));
        when(nguoiDungRepository.findById(100)).thenReturn(Optional.of(admin()));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());
        ArgumentCaptor<LichSuDonHang> captor = ArgumentCaptor.forClass(LichSuDonHang.class);

        service.updateOrderStatus(1, 2, "   ", false, 100);

        verify(lichSuDonHangRepository).save(captor.capture());
        assertNull(captor.getValue().getGhiChu());
    }

    @Test void nullNoteStaysNull() {
        DonHang o = order(1, 1);
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));
        when(nguoiDungRepository.findById(100)).thenReturn(Optional.of(admin()));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());
        ArgumentCaptor<LichSuDonHang> captor = ArgumentCaptor.forClass(LichSuDonHang.class);

        service.updateOrderStatus(1, 2, null, false, 100);

        verify(lichSuDonHangRepository).save(captor.capture());
        assertNull(captor.getValue().getGhiChu());
    }

    @Test void noteWithContentSaved() {
        DonHang o = order(1, 1);
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));
        when(nguoiDungRepository.findById(100)).thenReturn(Optional.of(admin()));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());
        ArgumentCaptor<LichSuDonHang> captor = ArgumentCaptor.forClass(LichSuDonHang.class);

        service.updateOrderStatus(1, 2, "Khach yeu cau giao som", false, 100);

        verify(lichSuDonHangRepository).save(captor.capture());
        assertEquals("Khach yeu cau giao som", captor.getValue().getGhiChu());
    }

    @Test void noteAtExactly500CharsSaved() {
        DonHang o = order(1, 1);
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));
        when(nguoiDungRepository.findById(100)).thenReturn(Optional.of(admin()));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());
        ArgumentCaptor<LichSuDonHang> captor = ArgumentCaptor.forClass(LichSuDonHang.class);

        String note500 = "A".repeat(500);
        service.updateOrderStatus(1, 2, note500, false, 100);

        verify(lichSuDonHangRepository).save(captor.capture());
        assertEquals(500, captor.getValue().getGhiChu().length());
    }

    @Test void noteExceeds500Chars_serviceSavesTruncatedByHibernate() {
        // Service itself doesn't enforce the 500 limit — it's done by the DTO @Size annotation.
        // But the service normalizes and passes through. If the DTO validation is bypassed (direct call),
        // the service still saves whatever it gets. The DB column is VARCHAR(500).
        DonHang o = order(1, 1);
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));
        when(nguoiDungRepository.findById(100)).thenReturn(Optional.of(admin()));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());
        ArgumentCaptor<LichSuDonHang> captor = ArgumentCaptor.forClass(LichSuDonHang.class);

        String longNote = "A".repeat(501);
        service.updateOrderStatus(1, 2, longNote, false, 100);

        verify(lichSuDonHangRepository).save(captor.capture());
        assertEquals(501, captor.getValue().getGhiChu().length());
    }

    @Test void specialCharactersInNoteSaved() {
        DonHang o = order(1, 1);
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));
        when(nguoiDungRepository.findById(100)).thenReturn(Optional.of(admin()));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());
        ArgumentCaptor<LichSuDonHang> captor = ArgumentCaptor.forClass(LichSuDonHang.class);

        String note = "Đơn hàng bị.delay! <script>alert(1)</script> & \"nội dung\" 'tiếng Việt'";
        service.updateOrderStatus(1, 2, note, false, 100);

        verify(lichSuDonHangRepository).save(captor.capture());
        assertEquals(note, captor.getValue().getGhiChu());
    }

    // --- Notify customer checkbox tests ---

    @Test void notifyCustomerFalse_khachHangXemFalse() {
        DonHang o = order(1, 1);
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));
        when(nguoiDungRepository.findById(100)).thenReturn(Optional.of(admin()));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());
        ArgumentCaptor<LichSuDonHang> captor = ArgumentCaptor.forClass(LichSuDonHang.class);

        service.updateOrderStatus(1, 2, "Ghi chu noi bo", false, 100);

        verify(lichSuDonHangRepository).save(captor.capture());
        assertFalse(captor.getValue().getKhachHangXem());
    }

    @Test void notifyCustomerTrue_khachHangXemTrue() {
        DonHang o = order(1, 1);
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));
        when(nguoiDungRepository.findById(100)).thenReturn(Optional.of(admin()));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());
        ArgumentCaptor<LichSuDonHang> captor = ArgumentCaptor.forClass(LichSuDonHang.class);

        service.updateOrderStatus(1, 2, "Giao som duoc khong", true, 100);

        verify(lichSuDonHangRepository).save(captor.capture());
        assertTrue(captor.getValue().getKhachHangXem());
    }

    @Test void notifyCustomerTrue_sendsNoteViaSse() {
        DonHang o = order(1, 1);
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));
        when(nguoiDungRepository.findById(100)).thenReturn(Optional.of(admin()));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());

        service.updateOrderStatus(1, 2, "Giao som", true, 100);

        verify(orderSseService).sendOrderStatusUpdate(1, 2, 1, "admin", "Giao som");
    }

    @Test void notifyCustomerFalse_doesNotSendNoteViaSse() {
        DonHang o = order(1, 1);
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));
        when(nguoiDungRepository.findById(100)).thenReturn(Optional.of(admin()));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());

        service.updateOrderStatus(1, 2, "Noi bo", false, 100);

        verify(orderSseService).sendOrderStatusUpdate(1, 2, 1, "admin", null);
    }

    @Test void notifyCustomerTrue_sendsNotificationToCustomer() {
        DonHang o = order(1, 1);
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));
        when(nguoiDungRepository.findById(100)).thenReturn(Optional.of(admin()));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());

        service.updateOrderStatus(1, 2, "Giao som", true, 100);

        verify(thongBaoService).taoThongBao(eq(1), contains("đang được xử lý"), anyString(), anyString(), anyString());
    }

    @Test void notifyCustomerFalse_doesNotSendNotification() {
        DonHang o = order(1, 1);
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));
        when(nguoiDungRepository.findById(100)).thenReturn(Optional.of(admin()));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());

        service.updateOrderStatus(1, 2, "Noi bo", false, 100);

        verify(thongBaoService, never()).taoThongBao(anyInt(), anyString(), anyString(), anyString(), anyString());
    }

    @Test void noNoteWithNotifyTrue_khachHangXemTrue() {
        DonHang o = order(1, 1);
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));
        when(nguoiDungRepository.findById(100)).thenReturn(Optional.of(admin()));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());
        ArgumentCaptor<LichSuDonHang> captor = ArgumentCaptor.forClass(LichSuDonHang.class);

        service.updateOrderStatus(1, 2, null, true, 100);

        verify(lichSuDonHangRepository).save(captor.capture());
        assertTrue(captor.getValue().getKhachHangXem());
        assertNull(captor.getValue().getGhiChu());
    }

    // --- History record tests ---

    @Test void historyRecordHasCorrectFields() {
        DonHang o = order(1, 2);
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));
        when(nguoiDungRepository.findById(100)).thenReturn(Optional.of(admin()));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());
        ArgumentCaptor<LichSuDonHang> captor = ArgumentCaptor.forClass(LichSuDonHang.class);

        service.updateOrderStatus(1, 3, "Note test", true, 100);

        verify(lichSuDonHangRepository).save(captor.capture());
        LichSuDonHang record = captor.getValue();
        assertSame(o, record.getDonHang());
        assertEquals(2, record.getTrangThaiCu());
        assertEquals(3, record.getTrangThaiMoi());
        assertNotNull(record.getNguoiCapNhat());
        assertEquals("Note test", record.getGhiChu());
        assertTrue(record.getKhachHangXem());
    }

    @Test void historyRecordForCancelHasAdminAsUpdater() {
        DonHang o = order(1, 1);
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));
        when(nguoiDungRepository.findById(100)).thenReturn(Optional.of(admin()));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());
        ArgumentCaptor<LichSuDonHang> captor = ArgumentCaptor.forClass(LichSuDonHang.class);

        service.updateOrderStatus(1, 5, "Huy don", false, 100);

        verify(lichSuDonHangRepository).save(captor.capture());
        assertEquals(100, captor.getValue().getNguoiCapNhat().getMaNguoiDung());
        assertFalse(captor.getValue().getKhachHangXem());
    }

    // --- Unpaid online payment guard ---

    @Test void unpaidOnlinePayment_blocksAdvance() {
        DonHang o = order(1, 1);
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of(
                ThanhToan.builder().phuongThuc(2).trangThaiThanhToan(1).build()));

        assertThrows(BadRequestException.class,
                () -> service.updateOrderStatus(1, 2, null, false, 100));
    }

    @Test void unpaidOnlinePayment_doesNotBlockCancel() {
        DonHang o = order(1, 1);
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));
        when(nguoiDungRepository.findById(100)).thenReturn(Optional.of(admin()));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of(
                ThanhToan.builder().phuongThuc(2).trangThaiThanhToan(1).build()));

        service.updateOrderStatus(1, 5, null, false, 100);
        assertEquals(5, o.getTrangThaiDon());
    }

    // --- Missing admin user ---

    @Test void adminNotFound_throwsException() {
        DonHang o = order(1, 1);
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));
        when(nguoiDungRepository.findById(100)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> service.updateOrderStatus(1, 2, null, false, 100));
    }

    // --- POS transitions (1→5) ---

    @Test void posStatus1To5_succeeds() {
        DonHang o = DonHang.builder().maDonHang(1).trangThaiDon(1)
                .loaiDonHang(2).nguoiDung(NguoiDung.builder().maNguoiDung(1).build()).build();
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));
        when(nguoiDungRepository.findById(100)).thenReturn(Optional.of(admin()));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());

        service.updateOrderStatus(1, 5, null, false, 100);
        assertEquals(5, o.getTrangThaiDon());
    }

    @Test void posOrderFollowsSameTransitionsAsOnline() {
        DonHang o = DonHang.builder().maDonHang(1).trangThaiDon(1)
                .loaiDonHang(2).nguoiDung(NguoiDung.builder().maNguoiDung(1).build()).build();
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));
        when(nguoiDungRepository.findById(100)).thenReturn(Optional.of(admin()));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());

        service.updateOrderStatus(1, 2, null, false, 100);
        assertEquals(2, o.getTrangThaiDon());
    }

    @Test void completedOrderCanEnterReturnFlow() {
        DonHang o = order(1, 6);
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));
        when(nguoiDungRepository.findById(100)).thenReturn(Optional.of(admin()));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        service.updateOrderStatus(1, 7, "Khách yêu cầu trả", true, 100);

        assertEquals(7, o.getTrangThaiDon());
        verify(inventoryService, never()).release(any());
    }

    @Test void acceptingReturnRestocksAndRestoresVoucher() {
        DonHang o = order(1, 7);
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));
        when(nguoiDungRepository.findById(100)).thenReturn(Optional.of(admin()));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        service.updateOrderStatus(1, 8, "Đã nhận lại hàng", true, 100);

        assertEquals(8, o.getTrangThaiDon());
        verify(inventoryService).release(o);
        verify(phieuGiamGiaService).restoreForOrder(1);
    }

    @Test void rejectingReturnMovesBackToCompletedWithoutChangingStock() {
        DonHang o = order(1, 7);
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));
        when(nguoiDungRepository.findById(100)).thenReturn(Optional.of(admin()));
        when(donHangRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        service.updateOrderStatus(1, 6, "Không đủ điều kiện trả hàng", true, 100);

        assertEquals(6, o.getTrangThaiDon());
        verify(inventoryService, never()).release(any());
    }

    @Test void customerCanRequestReturnForOwnCompletedOrder() {
        DonHang o = order(1, 6);
        NguoiDung customer = o.getNguoiDung();
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));
        when(nguoiDungRepository.findById(1)).thenReturn(Optional.of(customer));

        service.requestReturn(1, 1, "Sản phẩm không đúng mô tả");

        assertEquals(7, o.getTrangThaiDon());
        verify(orderSseService).sendOrderStatusUpdate(1, 7, 6, "user", "Sản phẩm không đúng mô tả");
    }

    @Test void customerCannotRequestReturnBeforeCompletion() {
        DonHang o = order(1, 4);
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));

        assertThrows(BadRequestException.class,
                () -> service.requestReturn(1, 1, "Chưa nhận được hàng"));
    }

    @Test void customerCannotRequestReturnAfterFifteenDays() {
        DonHang o = order(1, 6);
        LichSuDonHang completed = LichSuDonHang.builder()
                .trangThaiMoi(6).thoiGian(LocalDateTime.now().minusDays(16)).build();
        when(donHangRepository.findByIdForUpdate(1)).thenReturn(Optional.of(o));
        when(lichSuDonHangRepository.findByDonHang_MaDonHangOrderByThoiGianDesc(1))
                .thenReturn(List.of(completed));

        assertThrows(BadRequestException.class,
                () -> service.requestReturn(1, 1, "Yêu cầu quá hạn"));
    }

    }
