package com.example.zeststore.service;

import com.example.zeststore.config.PaymentConfig;
import com.example.zeststore.entity.ThanhToan;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.ThanhToanRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ZaloPayService {

    private final PaymentConfig paymentConfig;
    private final ThanhToanRepository thanhToanRepository;
    private final ThanhToanService thanhToanService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @SuppressWarnings("unchecked")
    public Map<String, String> createOrder(Integer orderId) {
        ThanhToan payment = thanhToanRepository
                .findByDonHang_MaDonHangAndTrangThaiThanhToan(orderId, 1)
                .orElseThrow(() -> new ResourceNotFoundException("Pending payment for order", orderId));

        PaymentConfig.ZalopayConfig config = paymentConfig.getZalopay();
        String appTransId = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMdd"))
                + "_" + payment.getMaGiaoDich();
        long appTime = System.currentTimeMillis();
        String embedData = "{\"redirecturl\":\"" + paymentConfig.getRedirectBaseUrl()
                + "/payment/result?orderId=" + orderId + "\",\"orderId\":" + orderId + "}";
        String items = "[]";
        String description = "Thanh toan don hang #" + orderId;

        String macData = config.getAppId() + "|" + appTransId + "|" + "user_" + orderId
                + "|" + payment.getSoTien().longValue() + "|" + appTime + "|" + embedData + "|" + items;
        String mac = hmacSHA256(config.getKey1(), macData);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("app_id", config.getAppId());
        body.put("app_user", "user_" + orderId);
        body.put("app_trans_id", appTransId);
        body.put("app_time", appTime);
        body.put("amount", payment.getSoTien().longValue());
        body.put("item", items);
        body.put("embed_data", embedData);
        body.put("description", description);
        body.put("mac", mac);
        body.put("callback_url", config.getCallbackUrl());

        try {
            Map<String, Object> zalopayResponse = restTemplate.postForObject(
                    config.getEndpoint(), body, Map.class);
            if (zalopayResponse == null) {
                throw new BadRequestException("ZaloPay returned empty response");
            }
            int returnCode = ((Number) zalopayResponse.get("return_code")).intValue();
            if (returnCode != 1) {
                throw new BadRequestException("ZaloPay error: " + zalopayResponse.get("return_message"));
            }
            Map<String, String> result = new LinkedHashMap<>();
            result.put("orderUrl", (String) zalopayResponse.get("order_url"));
            result.put("zpTransToken", (String) zalopayResponse.get("zp_trans_token"));
            return result;
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("Failed to create ZaloPay order: " + e.getMessage());
        }
    }

    public boolean verifyCallback(String data, String mac) {
        PaymentConfig.ZalopayConfig config = paymentConfig.getZalopay();
        String calculated = hmacSHA256(config.getKey2(), data != null ? data : "");
        return calculated.equals(mac);
    }

    @Transactional
    public void handleSuccessCallback(String data) {
        try {
            Map<String, Object> dataMap = objectMapper.readValue(data, Map.class);
            int returnCode = ((Number) dataMap.get("returncode")).intValue();
            if (returnCode != 1) return;

            String appTransId = (String) dataMap.get("apptransid");
            String zpTransId = String.valueOf(dataMap.get("zpTransId"));

            String[] parts = appTransId.split("_", 2);
            String maGiaoDich = parts.length > 1 ? parts[1] : appTransId;

            ThanhToan payment = thanhToanRepository.findByMaGiaoDich(maGiaoDich)
                    .orElseThrow(() -> new ResourceNotFoundException("Payment by ref: " + maGiaoDich));
            thanhToanService.completePayment(payment.getMaThanhToan(), zpTransId);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to handle ZaloPay callback", e);
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
