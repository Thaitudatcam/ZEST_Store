package com.example.zeststore.service;

import com.example.zeststore.config.PaymentConfig;
import com.example.zeststore.entity.ThanhToan;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.ThanhToanRepository;
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

    public record IpnResult(String rspCode, String message, Integer orderId) {}

    private final PaymentConfig paymentConfig;
    private final ThanhToanRepository thanhToanRepository;
    private final ThanhToanService thanhToanService;
    private final ThongBaoService thongBaoService;

    public String createPaymentUrl(Integer orderId, String ipAddress) {
        ThanhToan payment = thanhToanRepository
                .findByDonHang_MaDonHangAndTrangThaiThanhToan(orderId, 1)
                .orElseThrow(() -> new ResourceNotFoundException("Pending payment for order", orderId));
        return buildPaymentUrl(payment, "Thanh toan don hang #" + orderId, ipAddress);
    }

    public String createPaymentUrl(String maGiaoDich, String ipAddress) {
        ThanhToan payment = thanhToanRepository.findByMaGiaoDich(maGiaoDich)
                .orElseThrow(() -> new ResourceNotFoundException("Payment by ref: " + maGiaoDich));
        return buildPaymentUrl(payment, "Nạp tiền Ví ZestStore", ipAddress);
    }

    private String buildPaymentUrl(ThanhToan payment, String orderInfo, String ipAddress) {
        if (!Integer.valueOf(2).equals(payment.getPhuongThuc())) {
            throw new BadRequestException("Payment method is not VNPay");
        }
        PaymentConfig.VnpayConfig config = paymentConfig.getVnpay();
        BigDecimal amount = payment.getSoTien().multiply(BigDecimal.valueOf(100));

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime localDeadline = payment.getThoiGianTao().plusHours(2);
        LocalDateTime gatewayExpiry = now.plusMinutes(15).isBefore(localDeadline)
                ? now.plusMinutes(15) : localDeadline;
        if (!gatewayExpiry.isAfter(now.plusMinutes(1))) {
            throw new BadRequestException("Phiên thanh toán đã hết hạn. Vui lòng tạo đơn mới");
        }

        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", config.getTmnCode());
        params.put("vnp_Amount", String.valueOf(amount.longValue()));
        params.put("vnp_CreateDate", now.format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_IpAddr", ipAddress);
        params.put("vnp_Locale", "vn");
        params.put("vnp_OrderInfo", orderInfo);
        params.put("vnp_OrderType", "other");
        params.put("vnp_ReturnUrl", paymentConfig.getVnpayReturnUrl());
        params.put("vnp_TxnRef", payment.getMaGiaoDich());
        params.put("vnp_ExpireDate", gatewayExpiry.format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));

        String hashData = buildCreateHashData(params);
        String queryUrl = buildQueryUrl(params);
        String secureHash = hmacSHA512(config.getHashSecret(), hashData);
        log.debug("VNPay create URL hashData: {}", hashData);
        log.debug("VNPay secureHash: {}", secureHash);
        return config.getUrl() + "?" + queryUrl + "&vnp_SecureHash=" + secureHash;
    }

    public boolean verifyReturn(Map<String, String> rawParams) {
        if (rawParams == null || rawParams.isEmpty()) {
            log.warn("VNPay return không có tham số");
            return false;
        }
        Map<String, String> params = new HashMap<>(rawParams);
        String secureHash = params.remove("vnp_SecureHash");
        params.remove("vnp_SecureHashType");

        if (secureHash == null || secureHash.isBlank()) {
            log.warn("VNPay return missing vnp_SecureHash");
            return false;
        }

        Map<String, String> sorted = new TreeMap<>(params);
        if (sorted.entrySet().stream().anyMatch(e -> e.getKey() == null || e.getValue() == null)) {
            log.warn("VNPay return có tham số null");
            return false;
        }
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
        if (!Integer.valueOf(2).equals(payment.getPhuongThuc()))
            throw new BadRequestException("Payment method does not match VNPay");
        ThanhToanService.PaymentTransition transition =
                thanhToanService.completePaymentWithResult(payment.getMaThanhToan(), transactionNo);

        // Notify buyer that payment was successful
        if (transition.changed() && payment.getDonHang() != null && payment.getDonHang().getNguoiDung() != null) {
            try {
                Integer orderId = payment.getDonHang().getMaDonHang();
                thongBaoService.taoThongBao(
                        payment.getDonHang().getNguoiDung().getMaNguoiDung(),
                        transition.requiresRefund() ? "Thanh toán cần đối soát #" + orderId : "Thanh toán thành công #" + orderId,
                        transition.requiresRefund()
                                ? "VNPay đã thu tiền sau khi đơn #" + orderId + " đóng. Cửa hàng sẽ đối soát và hoàn tiền."
                                : "Đơn hàng #" + orderId + " đã được thanh toán thành công qua VNPay.",
                        transition.requiresRefund() ? "THANH_TOAN_DOI_SOAT" : "THANH_TOAN_THANH_CONG",
                        "/orders/" + orderId);
            } catch (Exception ignored) {}
        }
    }

    @Transactional
    public void handleFailedPayment(String maGiaoDich) {
        ThanhToan payment = thanhToanRepository.findByMaGiaoDich(maGiaoDich)
                .orElseThrow(() -> new ResourceNotFoundException("Payment by ref: " + maGiaoDich));
        if (!Integer.valueOf(2).equals(payment.getPhuongThuc()))
            throw new BadRequestException("Payment method does not match VNPay");
        ThanhToanService.PaymentTransition transition =
                thanhToanService.failPaymentWithResult(payment.getMaThanhToan());

        // Notify buyer that payment failed/cancelled
        if (transition.changed() && payment.getDonHang() != null && payment.getDonHang().getNguoiDung() != null) {
            try {
                Integer orderId = payment.getDonHang().getMaDonHang();
                thongBaoService.taoThongBao(
                        payment.getDonHang().getNguoiDung().getMaNguoiDung(),
                        "Thanh toán không thành công #" + orderId,
                        "Đơn hàng #" + orderId + " thanh toán qua VNPay không thành công hoặc đã bị hủy. Vui lòng thử lại.",
                        "THANH_TOAN_THAT_BAI",
                        "/orders/" + orderId);
            } catch (Exception ignored) {}
        }
    }

    public Map<String, String> buildReturnParams(Map<String, String> params) {
        Map<String, String> safeParams = params == null ? Collections.emptyMap() : params;
        boolean verified = verifyReturn(safeParams);
        String responseCode = safeParams.get("vnp_ResponseCode");
        String txnRef = safeParams.get("vnp_TxnRef");
        Integer orderId = extractOrderId(txnRef);

        log.info("VNPay return: verified={}, responseCode={}, orderId={}, txnRef={}",
                verified, responseCode, orderId, txnRef);

        Map<String, String> result = new LinkedHashMap<>();
        result.put("verified", String.valueOf(verified));
        result.put("responseCode", responseCode);
        result.put("txnRef", txnRef);
        result.put("orderId", orderId != null ? orderId.toString() : null);
        result.put("transactionNo", safeParams.get("vnp_TransactionNo"));
        result.put("transactionStatus", safeParams.get("vnp_TransactionStatus"));
        result.put("amount", safeParams.get("vnp_Amount"));
        result.put("tmnCode", safeParams.get("vnp_TmnCode"));
        return result;
    }

    @Transactional
    public IpnResult processIpn(Map<String, String> params) {
        Map<String, String> result = buildReturnParams(params);
        Integer orderId = result.get("orderId") == null ? null : Integer.valueOf(result.get("orderId"));
        if (!"true".equals(result.get("verified"))) return new IpnResult("97", "Invalid checksum", orderId);
        String txnRef = result.get("txnRef");
        ThanhToan payment = txnRef == null ? null : thanhToanRepository.findByMaGiaoDich(txnRef).orElse(null);
        if (payment == null || !Integer.valueOf(2).equals(payment.getPhuongThuc()))
            return new IpnResult("01", "Order not found", orderId);
        if (!Objects.equals(paymentConfig.getVnpay().getTmnCode(), result.get("tmnCode")))
            return new IpnResult("97", "Invalid terminal", orderId);
        String expectedAmount = payment.getSoTien().multiply(BigDecimal.valueOf(100)).toBigIntegerExact().toString();
        if (!expectedAmount.equals(result.get("amount")))
            return new IpnResult("04", "Invalid amount", orderId);
        if (Integer.valueOf(2).equals(payment.getTrangThaiThanhToan())
                || Integer.valueOf(4).equals(payment.getTrangThaiThanhToan()))
            return new IpnResult("02", "Order already confirmed", orderId);

        boolean paid = "00".equals(result.get("responseCode"))
                && "00".equals(result.get("transactionStatus"));
        if (paid) handleSuccessPayment(txnRef, result.get("transactionNo"));
        else handleFailedPayment(txnRef);
        return new IpnResult("00", "Confirm Success", orderId);
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
