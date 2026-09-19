package com.example.zeststore.service;

import com.example.zeststore.entity.*;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderNoteFilteringTest {

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

    private NguoiDung customer(Integer id) {
        return NguoiDung.builder().maNguoiDung(id).email("kh" + id + "@test.com").hoTen("KH " + id).build();
    }

    private DonHang order(Integer id, Integer userId) {
        return DonHang.builder().maDonHang(id).trangThaiDon(4)
                .nguoiDung(customer(userId)).build();
    }

    private LichSuDonHang historyEntry(Integer id, Integer trangThaiCu, Integer trangThaiMoi,
                                         String ghiChu, Boolean khachHangXem) {
        return LichSuDonHang.builder()
                .maLichSu(id)
                .trangThaiCu(trangThaiCu)
                .trangThaiMoi(trangThaiMoi)
                .ghiChu(ghiChu)
                .khachHangXem(khachHangXem)
                .nguoiCapNhat(NguoiDung.builder().maNguoiDung(100).build())
                .thoiGian(LocalDateTime.now())
                .build();
    }

    // --- lookupOrder filtering ---

    @Test void lookupOrder_legacyNoteNull_isVisible() {
        DonHang o = order(1, 1);
        when(donHangRepository.findByMaDonHangCodeAndEmail("DH001", "kh1@test.com"))
                .thenReturn(Optional.of(o));
        when(mucDonHangRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());
        when(lichSuDonHangRepository.findByDonHang_MaDonHangOrderByThoiGianDesc(1)).thenReturn(List.of(
                historyEntry(1, 1, 2, "Xac nhan don", null)
        ));

        Map<String, Object> result = service.lookupOrder("DH001", "kh1@test.com");
        @SuppressWarnings("unchecked")
        List<LichSuDonHang> history = (List<LichSuDonHang>) result.get("history");
        assertEquals(1, history.size());
        assertEquals("Xac nhan don", history.get(0).getGhiChu());
    }

    @Test void lookupOrder_internalNoteFalse_isHidden() {
        DonHang o = order(1, 1);
        when(donHangRepository.findByMaDonHangCodeAndEmail("DH001", "kh1@test.com"))
                .thenReturn(Optional.of(o));
        when(mucDonHangRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());
        when(lichSuDonHangRepository.findByDonHang_MaDonHangOrderByThoiGianDesc(1)).thenReturn(List.of(
                historyEntry(1, 1, 2, "Xac nhan don", null),
                historyEntry(2, 2, 3, "Ghi chu noi bo admin", false)
        ));

        Map<String, Object> result = service.lookupOrder("DH001", "kh1@test.com");
        @SuppressWarnings("unchecked")
        List<LichSuDonHang> history = (List<LichSuDonHang>) result.get("history");
        assertEquals(1, history.size());
        assertEquals("Xac nhan don", history.get(0).getGhiChu());
    }

    @Test void lookupOrder_customerNoteTrue_isVisible() {
        DonHang o = order(1, 1);
        when(donHangRepository.findByMaDonHangCodeAndEmail("DH001", "kh1@test.com"))
                .thenReturn(Optional.of(o));
        when(mucDonHangRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());
        when(lichSuDonHangRepository.findByDonHang_MaDonHangOrderByThoiGianDesc(1)).thenReturn(List.of(
                historyEntry(1, 1, 2, "Xac nhan don", null),
                historyEntry(2, 2, 3, "Giao som duoc khong", true)
        ));

        Map<String, Object> result = service.lookupOrder("DH001", "kh1@test.com");
        @SuppressWarnings("unchecked")
        List<LichSuDonHang> history = (List<LichSuDonHang>) result.get("history");
        assertEquals(2, history.size());
    }

    @Test void lookupOrder_allInternalNotesHidden() {
        DonHang o = order(1, 1);
        when(donHangRepository.findByMaDonHangCodeAndEmail("DH001", "kh1@test.com"))
                .thenReturn(Optional.of(o));
        when(mucDonHangRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());
        when(lichSuDonHangRepository.findByDonHang_MaDonHangOrderByThoiGianDesc(1)).thenReturn(List.of(
                historyEntry(1, 1, 2, "Note 1", false),
                historyEntry(2, 2, 3, "Note 2", false),
                historyEntry(3, 3, 4, "Note 3", false)
        ));

        Map<String, Object> result = service.lookupOrder("DH001", "kh1@test.com");
        @SuppressWarnings("unchecked")
        List<LichSuDonHang> history = (List<LichSuDonHang>) result.get("history");
        assertTrue(history.isEmpty());
    }

    @Test void lookupOrder_mixedNotes_correctFiltering() {
        DonHang o = order(1, 1);
        when(donHangRepository.findByMaDonHangCodeAndEmail("DH001", "kh1@test.com"))
                .thenReturn(Optional.of(o));
        when(mucDonHangRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());
        when(lichSuDonHangRepository.findByDonHang_MaDonHangOrderByThoiGianDesc(1)).thenReturn(List.of(
                historyEntry(1, 1, 2, "Xac nhan don", null),      // visible (null)
                historyEntry(2, 2, 3, "Noi bo admin", false),     // hidden
                historyEntry(3, 3, 4, "Giao som", true),          // visible (true)
                historyEntry(4, 4, 6, "Thanh cong", true),        // visible (true)
                historyEntry(5, null, 5, "Huy", null)             // visible (null)
        ));

        Map<String, Object> result = service.lookupOrder("DH001", "kh1@test.com");
        @SuppressWarnings("unchecked")
        List<LichSuDonHang> history = (List<LichSuDonHang>) result.get("history");
        assertEquals(4, history.size());
        assertTrue(history.stream().allMatch(h -> h.getGhiChu() != null));
        assertFalse(history.stream().anyMatch(h -> Boolean.FALSE.equals(h.getKhachHangXem())));
    }

    @Test void lookupOrder_orderNotFound_throwsException() {
        when(donHangRepository.findByMaDonHangCodeAndEmail("DH999", "kh1@test.com"))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> service.lookupOrder("DH999", "kh1@test.com"));
    }

    // --- getOrderDetailForUser filtering ---

    @Test void getOrderDetailForUser_internalNoteHidden() {
        DonHang o = order(1, 1);
        when(donHangRepository.findById(1)).thenReturn(Optional.of(o));
        when(mucDonHangRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());
        when(lichSuDonHangRepository.findByDonHang_MaDonHangOrderByThoiGianDesc(1)).thenReturn(List.of(
                historyEntry(1, 1, 2, "Xac nhan", null),
                historyEntry(2, 2, 3, "Noi bo", false)
        ));

        Map<String, Object> result = service.getOrderDetailForUser(1, 1);
        @SuppressWarnings("unchecked")
        List<LichSuDonHang> history = (List<LichSuDonHang>) result.get("history");
        assertEquals(1, history.size());
        assertEquals("Xac nhan", history.get(0).getGhiChu());
    }

    @Test void getOrderDetailForUser_wrongUser_throwsException() {
        DonHang o = order(1, 1);
        when(donHangRepository.findById(1)).thenReturn(Optional.of(o));

        assertThrows(BadRequestException.class,
                () -> service.getOrderDetailForUser(1, 2));
    }

    @Test void getOrderDetailForUser_legacyAndCustomerNotesVisible() {
        DonHang o = order(1, 1);
        when(donHangRepository.findById(1)).thenReturn(Optional.of(o));
        when(mucDonHangRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());
        when(lichSuDonHangRepository.findByDonHang_MaDonHangOrderByThoiGianDesc(1)).thenReturn(List.of(
                historyEntry(1, null, 1, "Legacy note", null),
                historyEntry(2, 1, 2, "Customer note", true),
                historyEntry(3, 2, 3, "Internal note", false)
        ));

        Map<String, Object> result = service.getOrderDetailForUser(1, 1);
        @SuppressWarnings("unchecked")
        List<LichSuDonHang> history = (List<LichSuDonHang>) result.get("history");
        assertEquals(2, history.size());
        assertTrue(history.stream().anyMatch(h -> "Legacy note".equals(h.getGhiChu())));
        assertTrue(history.stream().anyMatch(h -> "Customer note".equals(h.getGhiChu())));
        assertFalse(history.stream().anyMatch(h -> "Internal note".equals(h.getGhiChu())));
    }

    @Test void getOrderDetailForUser_noHistory_returnsEmptyList() {
        DonHang o = order(1, 1);
        when(donHangRepository.findById(1)).thenReturn(Optional.of(o));
        when(mucDonHangRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());
        when(lichSuDonHangRepository.findByDonHang_MaDonHangOrderByThoiGianDesc(1)).thenReturn(List.of());

        Map<String, Object> result = service.getOrderDetailForUser(1, 1);
        @SuppressWarnings("unchecked")
        List<LichSuDonHang> history = (List<LichSuDonHang>) result.get("history");
        assertTrue(history.isEmpty());
    }

    @Test void getOrderDetailForUser_orderWithNullUser_notAllowed() {
        DonHang o = DonHang.builder().maDonHang(1).trangThaiDon(4).nguoiDung(null).build();
        when(donHangRepository.findById(1)).thenReturn(Optional.of(o));

        assertThrows(BadRequestException.class,
                () -> service.getOrderDetailForUser(1, 1));
    }

    // --- lookupOrder: note content preservation ---

    @Test void lookupOrder_noteContentPreservedExactly() {
        DonHang o = order(1, 1);
        when(donHangRepository.findByMaDonHangCodeAndEmail("DH001", "kh1@test.com"))
                .thenReturn(Optional.of(o));
        when(mucDonHangRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());
        String note = "Đơn hàng #123 đã giao lúc 14:30. Cảm ơn!";
        when(lichSuDonHangRepository.findByDonHang_MaDonHangOrderByThoiGianDesc(1)).thenReturn(List.of(
                historyEntry(1, 3, 4, note, true)
        ));

        Map<String, Object> result = service.lookupOrder("DH001", "kh1@test.com");
        @SuppressWarnings("unchecked")
        List<LichSuDonHang> history = (List<LichSuDonHang>) result.get("history");
        assertEquals(note, history.get(0).getGhiChu());
    }

    @Test void lookupOrder_specialCharsInNote_preserved() {
        DonHang o = order(1, 1);
        when(donHangRepository.findByMaDonHangCodeAndEmail("DH001", "kh1@test.com"))
                .thenReturn(Optional.of(o));
        when(mucDonHangRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());
        when(thanhToanRepository.findByDonHang_MaDonHang(1)).thenReturn(List.of());
        String note = "<b>Xin chào</b> & \"tôi\" - 100%";
        when(lichSuDonHangRepository.findByDonHang_MaDonHangOrderByThoiGianDesc(1)).thenReturn(List.of(
                historyEntry(1, 3, 4, note, true)
        ));

        Map<String, Object> result = service.lookupOrder("DH001", "kh1@test.com");
        @SuppressWarnings("unchecked")
        List<LichSuDonHang> history = (List<LichSuDonHang>) result.get("history");
        assertEquals(note, history.get(0).getGhiChu());
    }
}
