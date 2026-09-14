package com.example.zeststore.service;

import com.example.zeststore.entity.*;
import com.example.zeststore.repository.*;
import com.example.zeststore.exception.BadRequestException;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import java.math.BigDecimal;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class ReturnInventoryTest {
    @Mock YeuCauTraHangRepository requests;
    @Mock DonHangRepository orders;
    @Mock NguoiDungRepository users;
    @Mock ThanhToanRepository payments;
    @Mock PhieuGiamGiaRepository coupons;
    @Mock LichSuDonHangRepository history;
    @Mock MucDonHangRepository items;
    @Mock BienTheSanPhamRepository variants;
    @Mock OrderSseService sse;
    @Mock ThongBaoService notifications;
    @Mock ViService wallet;
    @Mock InventoryService inventory;
    @Mock EntityManager em;
    @InjectMocks YeuCauTraHangService service;
    @Test void paidOnlineReturnRestoresBeforeRefundAndCannotRepeat() {
        NguoiDung user=NguoiDung.builder().maNguoiDung(7).build();
        DonHang order=DonHang.builder().maDonHang(1).nguoiDung(user).trangThaiDon(7).stockState("DEDUCTED").build();
        YeuCauTraHang request=YeuCauTraHang.builder().maYeuCau(9).donHang(order).trangThai(1).build();
        ThanhToan payment=ThanhToan.builder().trangThaiThanhToan(2).phuongThuc(2).soTien(BigDecimal.TEN).build();
        when(requests.findById(9)).thenReturn(Optional.of(request));
        when(orders.findByIdForUpdate(1)).thenReturn(Optional.of(order));
        when(users.findById(7)).thenReturn(Optional.of(user));
        when(payments.findByDonHang_MaDonHang(1)).thenReturn(List.of(payment));
        service.approveReturn(9,7);
        InOrder sequence=inOrder(inventory,wallet);
        sequence.verify(inventory).release(order);
        sequence.verify(wallet).napTien(eq(7),eq(BigDecimal.TEN),anyString(),eq(1));
        assertTrue(payment.isRefunded());
        assertThrows(BadRequestException.class, () -> service.approveReturn(9,7));
        verify(inventory,times(1)).release(order);
    }
}
