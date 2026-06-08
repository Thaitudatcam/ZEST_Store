package com.example.zeststore.service;

import com.example.zeststore.entity.DonHang;
import com.example.zeststore.entity.ThanhToan;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.DonHangRepository;
import com.example.zeststore.repository.ThanhToanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ThanhToanService {

    private final ThanhToanRepository thanhToanRepository;
    private final DonHangRepository donHangRepository;

    public List<ThanhToan> getPaymentsByOrder(Integer orderId) {
        return thanhToanRepository.findByDonHang_MaDonHang(orderId);
    }

    public ThanhToan getPaymentById(Integer paymentId) {
        return thanhToanRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", paymentId));
    }

    @Transactional
    public ThanhToan completePayment(Integer paymentId, String maGiaoDich, String transactionId) {
        ThanhToan payment = getPaymentById(paymentId);
        payment.setMaGiaoDich(maGiaoDich);
        payment.setTransactionId(transactionId);
        payment.setTrangThaiThanhToan("success");
        payment.setThoiGianTt(java.time.LocalDateTime.now());

        DonHang order = payment.getDonHang();
        if (order.getTrangThaiDon().equals("pending")) {
            order.setTrangThaiDon("confirmed");
            donHangRepository.save(order);
        }

        return thanhToanRepository.save(payment);
    }

    @Transactional
    public ThanhToan failPayment(Integer paymentId) {
        ThanhToan payment = getPaymentById(paymentId);
        payment.setTrangThaiThanhToan("failed");
        return thanhToanRepository.save(payment);
    }
}
