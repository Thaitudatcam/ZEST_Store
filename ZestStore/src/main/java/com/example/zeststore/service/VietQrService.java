package com.example.zeststore.service;

import com.example.zeststore.config.PaymentConfig;
import com.example.zeststore.entity.ThanhToan;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.ThanhToanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class VietQrService {

    private final PaymentConfig paymentConfig;
    private final ThanhToanRepository thanhToanRepository;
    private final ThanhToanService thanhToanService;

    public Map<String, Object> createQrPayment(Integer orderId) {
        ThanhToan payment = thanhToanRepository
                .findByDonHang_MaDonHangAndTrangThaiThanhToan(orderId, 1)
                .orElseThrow(() -> new ResourceNotFoundException("Pending payment for order", orderId));

        if (!Integer.valueOf(6).equals(payment.getPhuongThuc())) {
            throw new IllegalStateException("Payment method is not VietQR");
        }

        PaymentConfig.VietQrConfig config = paymentConfig.getVietqr();
        BigDecimal amount = payment.getSoTien();

        String addInfo = "Thanh+toan+don+hang+%" + orderId;
        String qrUrl = String.format(
                "https://img.vietqr.io/image/%s-%s-%s.jpg?amount=%s&addInfo=%s&accountName=%s",
                config.getBankBin(),
                config.getBankNumber(),
                config.getTemplate(),
                amount.longValue(),
                addInfo,
                URLEncoder.encode(config.getBankName(), StandardCharsets.UTF_8)
        );

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("qrUrl", qrUrl);
        result.put("bankName", "MB Bank");
        result.put("accountNumber", config.getBankNumber());
        result.put("accountName", config.getBankName());
        result.put("amount", amount);
        result.put("orderId", orderId);
        result.put("paymentId", payment.getMaThanhToan());
        result.put("message", "Scan QR to pay");
        return result;
    }

    @Transactional
    public void confirmPayment(Integer paymentId) {
        ThanhToan payment = thanhToanRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", paymentId));
        thanhToanService.completePayment(paymentId, "VIETQR-" + payment.getDonHang().getMaDonHang()
                + "-" + System.currentTimeMillis());
    }
}
