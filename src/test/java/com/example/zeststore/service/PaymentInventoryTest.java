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
@org.mockito.junit.jupiter.MockitoSettings(strictness = org.mockito.quality.Strictness.LENIENT)
class PaymentInventoryTest {
    @Mock ThanhToanRepository payments;
    @Mock DonHangRepository orders;
    @Mock MucDonHangRepository items;
    @Mock NguoiDungRepository users;
    @Mock MucGioHangRepository cartItems;
    @Mock BienTheSanPhamRepository variants;
    @Mock GioHangRepository carts;
    @Mock LichSuDonHangRepository history;
    @Mock OrderSseService sse;
    @Mock InventoryService inventory;
    @Mock EntityManager em;
    @Mock org.springframework.transaction.PlatformTransactionManager transactionManager;
    @Mock ViService wallet;
    @InjectMocks ThanhToanService service;
    DonHang order;
    ThanhToan payment;
    @BeforeEach void setup() {
        order=DonHang.builder().maDonHang(1).nguoiDung(NguoiDung.builder().maNguoiDung(7).build()).build();
        payment=ThanhToan.builder().maThanhToan(3).donHang(order).phuongThuc(2)
                .maGiaoDich("ORD-1-reference").soTien(BigDecimal.TEN).build();
        when(payments.findById(3)).thenReturn(Optional.of(payment));
        when(payments.findByIdForUpdate(3)).thenReturn(Optional.of(payment));
        when(orders.findByIdForUpdate(1)).thenReturn(Optional.of(order));
        when(payments.save(any())).thenAnswer(i -> i.getArgument(0));
    }
    @Test void callbackReplayKeepsReferenceAndDeductsOnce() {
        service.completePayment(3, "gateway-123"); service.completePayment(3, "gateway-123");
        verify(inventory, times(1)).deduct(order);
        assertEquals("ORD-1-reference", payment.getMaGiaoDich());
        assertEquals("gateway-123", payment.getGatewayTransactionId());
    }
    @Test void lateSuccessRefundsOnceWithoutTakingStock() {
        order.setTrangThaiDon(5);
        service.completePayment(3, "late"); service.completePayment(3, "late");
        verify(wallet, times(1)).napTien(eq(7), eq(BigDecimal.TEN), anyString(), eq(1));
        verifyNoInteractions(inventory);
        assertTrue(payment.isRefunded());
        assertEquals(5, order.getTrangThaiDon());
    }
    @Test void failureCannotUndoSuccess() {
        payment.setTrangThaiThanhToan(2);
        service.failPayment(3);
        assertEquals(2, payment.getTrangThaiThanhToan());
        verifyNoInteractions(inventory);
    }
    @Test void failedWalletDepositHasNoOrderAndDoesNotCrash() {
        payment.setDonHang(null);
        service.failPayment(3);
        assertEquals(3, payment.getTrangThaiThanhToan());
    }
    @Test void cancelledOrderCannotRetry() {
        order.setTrangThaiDon(5);
        assertThrows(BadRequestException.class, () -> service.retryPayment(3, 7));
    }
    @Test void failureReleasesPendingReservation() {
        service.failPayment(3);
        verify(inventory).release(order);
        assertEquals(5, order.getTrangThaiDon());
    }
    @Test void timeoutDoesNotCancelCodButHandlesExpiredDeposit() {
        payment.setDonHang(null);
        payment.setThoiGianTao(java.time.LocalDateTime.now().minusHours(3));
        ThanhToan cod=ThanhToan.builder().maThanhToan(8).phuongThuc(1).build();
        when(payments.findByTrangThaiThanhToanAndThoiGianTaoBefore(eq(1), any()))
                .thenReturn(List.of(cod, payment));
        when(transactionManager.getTransaction(any())).thenReturn(new org.springframework.transaction.support.SimpleTransactionStatus());
        service.autoCancelExpiredPayments();
        verify(payments, never()).findByIdForUpdate(8);
        assertEquals(3, payment.getTrangThaiThanhToan());
        verifyNoInteractions(inventory);
    }
}
