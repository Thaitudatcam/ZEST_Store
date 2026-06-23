package com.example.zeststore.service;

import com.example.zeststore.entity.*;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ThanhToanService {

    private final ThanhToanRepository thanhToanRepository;
    private final DonHangRepository donHangRepository;
    private final HoaDonService hoaDonService;
    private final MucDonHangRepository mucDonHangRepository;
    private final BienTheSanPhamRepository bienTheRepository;
    private final LichSuDonHangRepository lichSuDonHangRepository;

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

        thanhToanRepository.save(payment);

        hoaDonService.generateInvoice(order.getMaDonHang());

        return payment;
    }

    @Transactional
    public ThanhToan failPayment(Integer paymentId) {
        ThanhToan payment = getPaymentById(paymentId);
        payment.setTrangThaiThanhToan(3);
        return thanhToanRepository.save(payment);
    }

    @Scheduled(fixedRate = 300000)
    @Transactional
    public void autoCancelExpiredPayments() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(2);
        List<ThanhToan> expired = thanhToanRepository
                .findByTrangThaiThanhToanAndThoiGianTaoBefore(1, threshold);
        for (ThanhToan payment : expired) {
            DonHang order = payment.getDonHang();
            List<ThanhToan> orderPayments = thanhToanRepository
                    .findByDonHang_MaDonHang(order.getMaDonHang());
            boolean hasSuccessfulPayment = orderPayments.stream()
                    .anyMatch(p -> Integer.valueOf(2).equals(p.getTrangThaiThanhToan()));
            if (hasSuccessfulPayment) {
                log.warn("Order #{} already has a successful payment, skipping cancel", order.getMaDonHang());
                payment.setTrangThaiThanhToan(3);
                thanhToanRepository.save(payment);
                continue;
            }
            if (Integer.valueOf(1).equals(order.getTrangThaiDon())) {
                List<MucDonHang> items = mucDonHangRepository
                        .findByDonHang_MaDonHang(order.getMaDonHang());
                for (MucDonHang item : items) {
                    BienTheSanPham variant = item.getBienThe();
                    variant.setTonKho(variant.getTonKho() + item.getSoLuong());
                    bienTheRepository.save(variant);
                }
                order.setTrangThaiDon(5);
                donHangRepository.save(order);
                log.info("Auto-cancelled expired order #{}", order.getMaDonHang());
            }
            payment.setTrangThaiThanhToan(3);
            thanhToanRepository.save(payment);
        }
    }

    @Transactional
    public ThanhToan retryPayment(Integer paymentId, Integer userId) {
        ThanhToan payment = getPaymentById(paymentId);
        if (!Integer.valueOf(3).equals(payment.getTrangThaiThanhToan())) {
            throw new BadRequestException("Can only retry failed payments");
        }
        if (!payment.getDonHang().getNguoiDung().getMaNguoiDung().equals(userId)) {
            throw new BadRequestException("Payment does not belong to current user");
        }
        payment.setTrangThaiThanhToan(1);
        payment.setMaGiaoDich("ORD-" + payment.getDonHang().getMaDonHang()
                + "-" + System.currentTimeMillis());
        payment.setThoiGianTt(null);
        payment.setThoiGianTao(LocalDateTime.now());
        return thanhToanRepository.save(payment);
    }
}