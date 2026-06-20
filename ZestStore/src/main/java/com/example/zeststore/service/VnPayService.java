package com.example.zeststore.service;

import com.example.zeststore.config.PaymentConfig;
import com.example.zeststore.entity.ThanhToan;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.ThanhToanRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class VnPayService {

    private final PaymentConfig paymentConfig;
    private final ThanhToanRepository thanhToanRepository;
    private final ThanhToanService thanhToanService;

    public String createPaymentUrl(Integer orderId, String ipAddress) {
        ThanhToan payment = thanhToanRepository
                .findByDonHang_MaDonHangAndTrangThaiThanhToan(orderId, 1)
                .orElseThrow(() -> new ResourceNotFoundException("Pending payment for order", orderId));

        PaymentConfig.VnpayConfig config = paymentConfig.getVnpay();
        BigDecimal amount = payment.getSoTien().multiply(BigDecimal.valueOf(100));

        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", config.getTmnCode());
        params.put("vnp_Amount", String.valueOf(amount.longValue()));
        params.put("vnp_CreateDate", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_IpAddr", ipAddress);
        params.put("vnp_Locale", "vn");
        params.put("vnp_OrderInfo", "Thanh toan don hang #" + orderId);
        params.put("vnp_OrderType", "other");
        params.put("vnp_ReturnUrl", config.getReturnUrl());
        params.put("vnp_TxnRef", payment.getMaGiaoDich());

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            if (hashData.length() > 0) {
                hashData.append('&');
                query.append('&');
            }
            hashData.append(key).append('=').append(value);
            query.append(key).append('=').append(URLEncoder.encode(value, StandardCharsets.UTF_8));
        }

        String secureHash = hmacSHA512(config.getHashSecret(), hashData.toString());
        return config.getUrl() + "?" + query + "&vnp_SecureHash=" + secureHash;
    }

    public boolean verifyReturn(Map<String, String> rawParams) {
        Map<String, String> params = new HashMap<>(rawParams);
        String secureHash = params.remove("vnp_SecureHash");
        params.remove("vnp_SecureHashType");

        Map<String, String> sorted = new TreeMap<>(params);
        StringBuilder hashData = new StringBuilder();
        for (Map.Entry<String, String> entry : sorted.entrySet()) {
            if (hashData.length() > 0) hashData.append('&');
            hashData.append(entry.getKey()).append('=').append(entry.getValue());
        }

        String calculated = hmacSHA512(paymentConfig.getVnpay().getHashSecret(), hashData.toString());
        return calculated.equals(secureHash);
    }

    @Transactional
    public void handleSuccessPayment(String maGiaoDich, String transactionNo) {
        ThanhToan payment = thanhToanRepository.findByMaGiaoDich(maGiaoDich)
                .orElseThrow(() -> new ResourceNotFoundException("Payment by ref: " + maGiaoDich));
        thanhToanService.completePayment(payment.getMaThanhToan(), transactionNo);
    }

    @Transactional
    public void handleFailedPayment(String maGiaoDich) {
        ThanhToan payment = thanhToanRepository.findByMaGiaoDich(maGiaoDich)
                .orElseThrow(() -> new ResourceNotFoundException("Payment by ref: " + maGiaoDich));
        thanhToanService.failPayment(payment.getMaThanhToan());
    }

    private String hmacSHA512(String key, String data) {
        try {
            Mac hmac = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac.init(secretKey);
            byte[] bytes = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString().toUpperCase();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate HMAC-SHA512", e);
        }
    }
}
