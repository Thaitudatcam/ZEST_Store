package com.example.zeststore.service;

import com.example.zeststore.config.PaymentConfig;
import com.example.zeststore.entity.ThanhToan;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.ThanhToanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
@RequiredArgsConstructor
public class MomoService {

    private final PaymentConfig paymentConfig;
    private final ThanhToanRepository thanhToanRepository;
    private final ThanhToanService thanhToanService;
    private final RestTemplate restTemplate;

    @SuppressWarnings("unchecked")
    public String createPaymentUrl(Integer orderId) {
        ThanhToan payment = thanhToanRepository
                .findByDonHang_MaDonHangAndTrangThaiThanhToan(orderId, 1)
                .orElseThrow(() -> new ResourceNotFoundException("Pending payment for order", orderId));

        PaymentConfig.MomoConfig config = paymentConfig.getMomo();
        String requestId = payment.getMaGiaoDich();
        String orderInfo = "Thanh toan don hang #" + orderId;
        String extraData = "";

        String rawSignature = "accessKey=" + config.getAccessKey()
                + "&amount=" + payment.getSoTien().longValue()
                + "&extraData=" + extraData
                + "&ipnUrl=" + config.getIpnUrl()
                + "&orderId=" + requestId
                + "&orderInfo=" + orderInfo
                + "&partnerCode=" + config.getPartnerCode()
                + "&redirectUrl=" + config.getReturnUrl()
                + "&requestId=" + requestId
                + "&requestType=captureWallet";

        String signature = hmacSHA256(config.getSecretKey(), rawSignature);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("partnerCode", config.getPartnerCode());
        body.put("accessKey", config.getAccessKey());
        body.put("requestId", requestId);
        body.put("amount", payment.getSoTien().longValue());
        body.put("orderId", requestId);
        body.put("orderInfo", orderInfo);
        body.put("redirectUrl", config.getReturnUrl());
        body.put("ipnUrl", config.getIpnUrl());
        body.put("extraData", extraData);
        body.put("requestType", "captureWallet");
        body.put("signature", signature);
        body.put("lang", "vi");

        try {
            Map<String, Object> momoResponse = restTemplate.postForObject(
                    config.getEndpoint(), body, Map.class);
            if (momoResponse == null) {
                throw new BadRequestException("MoMo returned empty response");
            }
            Object resultCode = momoResponse.get("resultCode");
            if (resultCode instanceof Number && ((Number) resultCode).intValue() != 0) {
                throw new BadRequestException("MoMo error: " + momoResponse.get("message"));
            }
            return (String) momoResponse.get("payUrl");
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("Failed to create MoMo payment: " + e.getMessage());
        }
    }

    public boolean verifyReturn(Map<String, String> rawParams) {
        PaymentConfig.MomoConfig config = paymentConfig.getMomo();
        Map<String, String> params = new HashMap<>(rawParams);
        String signature = params.remove("signature");
        params.remove("extraData");

        List<String> keys = new ArrayList<>(params.keySet());
        Collections.sort(keys);

        StringBuilder raw = new StringBuilder();
        for (String key : keys) {
            if (raw.length() > 0) raw.append('&');
            raw.append(key).append('=').append(params.get(key));
        }

        String calculated = hmacSHA256(config.getSecretKey(), raw.toString());
        return calculated.equals(signature);
    }

    @Transactional
    public void handleSuccessPayment(String orderId, String transId) {
        ThanhToan payment = thanhToanRepository.findByMaGiaoDich(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment by ref: " + orderId));
        thanhToanService.completePayment(payment.getMaThanhToan(), transId);
    }

    @Transactional
    public void handleFailedPayment(String orderId) {
        ThanhToan payment = thanhToanRepository.findByMaGiaoDich(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment by ref: " + orderId));
        thanhToanService.failPayment(payment.getMaThanhToan());
    }

    public Map<String, String> buildReturnParams(Map<String, String> rawParams) {
        boolean verified = verifyReturn(rawParams);
        String resultCode = rawParams.get("resultCode");
        String orderId = rawParams.get("orderId");
        Integer oid = extractOrderId(orderId);

        Map<String, String> result = new LinkedHashMap<>();
        result.put("verified", String.valueOf(verified));
        result.put("resultCode", resultCode);
        result.put("orderId", orderId);
        result.put("orderIdInt", oid != null ? oid.toString() : null);
        result.put("transId", rawParams.get("transId"));
        return result;
    }

    public Integer extractOrderId(String ref) {
        if (ref == null) return null;
        try {
            String[] parts = ref.split("-");
            return parts.length >= 2 ? Integer.parseInt(parts[1]) : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String hmacSHA256(String key, String data) {
        try {
            Mac hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            hmac.init(secretKey);
            byte[] bytes = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate HMAC-SHA256", e);
        }
    }
}
