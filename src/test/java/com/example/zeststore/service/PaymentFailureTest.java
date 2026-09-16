package com.example.zeststore.service;

import com.example.zeststore.entity.*;
import com.example.zeststore.repository.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentFailureTest {
    @Mock ThanhToanRepository thanhToanRepository;
    @Mock DonHangRepository donHangRepository;
    @Mock InventoryService inventoryService;
    @Mock PhieuGiamGiaService phieuGiamGiaService;
    @Mock LichSuDonHangRepository lichSuDonHangRepository;
    @Mock EntityManager entityManager;
    @InjectMocks ThanhToanService service;

    private ThanhToan payment(int status) {
        var order = DonHang.builder().maDonHang(10).trangThaiDon(1).stockState("RESERVED").build();
        var payment = ThanhToan.builder().maThanhToan(20).donHang(order).trangThaiThanhToan(status).build();
        when(thanhToanRepository.findById(20)).thenReturn(Optional.of(payment));
        when(donHangRepository.findByIdForUpdate(10)).thenReturn(Optional.of(order));
        when(thanhToanRepository.findByIdForUpdate(20)).thenReturn(Optional.of(payment));
        return payment;
    }

    @Test void paymentFailureRestoresStockAndCouponsOnlyOnce() {
        var payment = payment(1);
        when(thanhToanRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        service.failPayment(20);
        service.failPayment(20);
        assertEquals(3, payment.getTrangThaiThanhToan());
        assertEquals(5, payment.getDonHang().getTrangThaiDon());
        verify(inventoryService, times(1)).release(payment.getDonHang());
        verify(phieuGiamGiaService, times(1)).restoreForOrder(10);
        verify(lichSuDonHangRepository, times(1)).save(any());
    }

    @Test void failureNeverOverwritesSuccessfulPayment() {
        var payment = payment(2);
        assertSame(payment, service.failPayment(20));
        assertEquals(2, payment.getTrangThaiThanhToan());
        verifyNoInteractions(inventoryService, phieuGiamGiaService, lichSuDonHangRepository);
        verify(thanhToanRepository, never()).save(any());
    }
}
