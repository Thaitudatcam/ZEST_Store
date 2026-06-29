package com.example.zeststore.service;

import com.example.zeststore.config.PaymentConfig;
import com.example.zeststore.entity.ThanhToan;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.ThanhToanRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
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
        params.put("vnp_ExpireDate", LocalDateTime.now().plusMinutes(15)
                .format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));

        String hashData = buildCreateHashData(params);
        String queryUrl = buildQueryUrl(params);
        String secureHash = hmacSHA512(config.getHashSecret(), hashData);
        log.debug("VNPay create URL hashData: {}", hashData);
        log.debug("VNPay secureHash: {}", secureHash);
        return config.getUrl() + "?" + queryUrl + "&vnp_SecureHash=" + secureHash;
    }

    public boolean verifyReturn(Map<String, String> rawParams) {
        Map<String, String> params = new HashMap<>(rawParams);
        String secureHash = params.remove("vnp_SecureHash");
        params.remove("vnp_SecureHashType");

        Map<String, String> sorted = new TreeMap<>(params);
        String hashData = buildHashData(sorted);
        String calculated = hmacSHA512(paymentConfig.getVnpay().getHashSecret(), hashData);
        boolean match = calculated.equalsIgnoreCase(secureHash);
        if (!match) {
            log.warn("VNPay hash MISMATCH:");
            log.warn("  hashData  = {}", hashData);
            log.warn("  secureHash= {}", secureHash);
            log.warn("  calculated= {}", calculated);
        } else {
            log.info("VNPay hash MATCH OK");
        }
        return match;
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

    public Map<String, String> buildReturnParams(Map<String, String> params) {
        boolean verified = verifyReturn(params);
        String responseCode = params.get("vnp_ResponseCode");
        String txnRef = params.get("vnp_TxnRef");
        Integer orderId = extractOrderId(txnRef);

        log.info("VNPay return: verified={}, responseCode={}, orderId={}, txnRef={}",
                verified, responseCode, orderId, txnRef);

        Map<String, String> result = new LinkedHashMap<>();
        result.put("verified", String.valueOf(verified));
        result.put("responseCode", responseCode);
        result.put("txnRef", txnRef);
        result.put("orderId", orderId != null ? orderId.toString() : null);
        result.put("transactionNo", params.get("vnp_TransactionNo"));
        return result;
    }

    public Integer extractOrderId(String txnRef) {
        if (txnRef == null) return null;
        try {
            String[] parts = txnRef.split("-");
            return parts.length >= 2 ? Integer.parseInt(parts[1]) : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String buildCreateHashData(Map<String, String> params) {
        Map<String, String> sorted = new TreeMap<>(params);
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> e : sorted.entrySet()) {
            if (sb.length() > 0) sb.append('&');
            sb.append(e.getKey()).append('=')
              .append(URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8));
        }
        return sb.toString();
    }

    private String buildHashData(Map<String, String> params) {
        Map<String, String> sorted = new TreeMap<>(params);
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> e : sorted.entrySet()) {
            if (sb.length() > 0) sb.append('&');
            sb.append(e.getKey()).append('=')
              .append(URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8));
        }
        return sb.toString();
    }

    private String buildQueryUrl(Map<String, String> params) {
        Map<String, String> sorted = new TreeMap<>(params);
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> e : sorted.entrySet()) {
            if (sb.length() > 0) sb.append('&');
            sb.append(e.getKey()).append('=')
              .append(URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8));
        }
        return sb.toString();
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
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate HMAC-SHA512", e);
        }
    }
}
