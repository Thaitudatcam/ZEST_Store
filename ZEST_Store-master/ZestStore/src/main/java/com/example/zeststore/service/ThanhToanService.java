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
    public ThanhToan completePayment(Integer paymentId, String maGiaoDich) {
        ThanhToan payment = getPaymentById(paymentId);
        payment.setMaGiaoDich(maGiaoDich);
        payment.setTrangThaiThanhToan(2);
        payment.setThoiGianTt(java.time.LocalDateTime.now());

        DonHang order = payment.getDonHang();
        if (Integer.valueOf(1).equals(order.getTrangThaiDon())) {
            order.setTrangThaiDon(2);
            donHangRepository.save(order);
        }

        return thanhToanRepository.save(payment);
    }

    @Transactional
    public ThanhToan failPayment(Integer paymentId) {
        ThanhToan payment = getPaymentById(paymentId);
        payment.setTrangThaiThanhToan(3);
        return thanhToanRepository.save(payment);
    }
}