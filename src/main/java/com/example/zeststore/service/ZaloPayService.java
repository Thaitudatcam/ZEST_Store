package com.example.zeststore.service;

import com.example.zeststore.config.PaymentConfig;
import com.example.zeststore.entity.ThanhToan;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.ThanhToanRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ZaloPayService {

    private final PaymentConfig paymentConfig;
    private final ThanhToanRepository thanhToanRepository;
    private final ThanhToanService thanhToanService;
    private final ThongBaoService thongBaoService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @SuppressWarnings("unchecked")
    public Map<String, String> createOrder(Integer orderId) {
        ThanhToan payment = thanhToanRepository
                .findByDonHang_MaDonHangAndTrangThaiThanhToan(orderId, 1)
                .orElseThrow(() -> new ResourceNotFoundException("Pending payment for order", orderId));
        if (!Integer.valueOf(4).equals(payment.getPhuongThuc()))
            throw new BadRequestException("Payment method is not ZaloPay");
        return buildZaloOrder(payment, "user_" + orderId, orderId, "Thanh toan don hang #" + orderId);
    }

    @SuppressWarnings("unchecked")
    private Map<String, String> buildZaloOrder(ThanhToan payment, String appUser, Integer orderId, String description) {
        PaymentConfig.ZalopayConfig config = paymentConfig.getZalopay();
        // ZaloPay requires app_trans_id to be unique per day. Include payment id
        // and a retry nonce, then resolve callbacks by payment id.
        String appTransId = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMdd"))
                + "_P" + payment.getMaThanhToan() + "_" + (System.currentTimeMillis() % 1_000_000_000L);
        long appTime = System.currentTimeMillis();
        String callbackUrl = paymentConfig.getZalopayCallbackUrl();
        String returnUrl = callbackUrl.replace("/callback", "/return");
        String embedData = "{\"redirecturl\":\"" + returnUrl + "\",\"orderId\":" + orderId + "}";
        String items = "[]";

        String macData = config.getAppId() + "|" + appTransId + "|" + appUser
                + "|" + payment.getSoTien().longValue() + "|" + appTime + "|" + embedData + "|" + items;
        String mac = hmacSHA256(config.getKey1(), macData);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("app_id", config.getAppId());
        body.put("app_user", appUser);
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
            result.put("qrCode", (String) zalopayResponse.get("qr_code"));
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
        return mac != null && calculated.equalsIgnoreCase(mac);
    }

    @Transactional
    public void handleSuccessCallback(String data) {
        try {
            Map<String, Object> dataMap = objectMapper.readValue(data, Map.class);
            String appTransId = (String) dataMap.get("app_trans_id");
            String zpTransId = String.valueOf(dataMap.get("zp_trans_id"));
            ThanhToan payment = resolvePayment(appTransId);
            validateSettledPayment(dataMap, payment);
            settleAndNotify(payment, zpTransId);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to handle ZaloPay callback", e);
        }
    }

    private ThanhToan resolvePayment(String appTransId) {
        if (appTransId == null || appTransId.isBlank())
            throw new BadRequestException("Missing app_trans_id");
        String[] parts = appTransId.split("_", 3);
        if (parts.length >= 2 && parts[1].startsWith("P")) {
            try {
                return thanhToanRepository.findById(Integer.parseInt(parts[1].substring(1)))
                        .orElseThrow(() -> new ResourceNotFoundException("Payment", parts[1]));
            } catch (NumberFormatException ex) {
                throw new BadRequestException("Invalid app_trans_id");
            }
        }
        String reference = appTransId.contains("_") ? appTransId.split("_", 2)[1] : appTransId;
        return thanhToanRepository.findByMaGiaoDich(reference)
                .orElseThrow(() -> new ResourceNotFoundException("Payment by ref: " + reference));
    }

    private void validateSettledPayment(Map<String, Object> gatewayData, ThanhToan payment) {
        if (!Integer.valueOf(4).equals(payment.getPhuongThuc()))
            throw new BadRequestException("Payment method does not match ZaloPay");
        Object appId = gatewayData.get("app_id");
        if (appId == null || !String.valueOf(paymentConfig.getZalopay().getAppId()).equals(String.valueOf(appId)))
            throw new BadRequestException("ZaloPay app_id does not match");
        Object amount = gatewayData.get("amount");
        if (!(amount instanceof Number)
                || payment.getSoTien().compareTo(new BigDecimal(amount.toString())) != 0)
            throw new BadRequestException("ZaloPay amount does not match");
    }

    private void settleAndNotify(ThanhToan payment, String zpTransId) {
        ThanhToanService.PaymentTransition transition =
                thanhToanService.completePaymentWithResult(payment.getMaThanhToan(), zpTransId);
        if (!transition.changed() || payment.getDonHang() == null || payment.getDonHang().getNguoiDung() == null) return;
        try {
            Integer orderId = payment.getDonHang().getMaDonHang();
            thongBaoService.taoThongBao(
                    payment.getDonHang().getNguoiDung().getMaNguoiDung(),
                    transition.requiresRefund() ? "Thanh toán cần đối soát #" + orderId : "Thanh toán thành công #" + orderId,
                    transition.requiresRefund()
                            ? "ZaloPay đã thu tiền sau khi đơn #" + orderId + " đóng. Cửa hàng sẽ đối soát và hoàn tiền."
                            : "Đơn hàng #" + orderId + " đã được thanh toán thành công qua ZaloPay.",
                    transition.requiresRefund() ? "THANH_TOAN_DOI_SOAT" : "THANH_TOAN_THANH_CONG",
                    "/orders/" + orderId);
        } catch (Exception ignored) {}
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> queryOrder(String appTransId) {
        PaymentConfig.ZalopayConfig config = paymentConfig.getZalopay();
        String mac = hmacSHA256(config.getKey1(), config.getAppId() + "|" + appTransId + "|" + config.getKey1());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("app_id", config.getAppId());
        body.put("app_trans_id", appTransId);
        body.put("mac", mac);

        try {
            return restTemplate.postForObject(config.getQueryEndpoint(), body, Map.class);
        } catch (Exception e) {
            throw new BadRequestException("Failed to query ZaloPay order: " + e.getMessage());
        }
    }

    @Transactional
    public String handleReturn(Map<String, String> params) {
        String appTransId = params.get("apptransid");
        String base = paymentConfig.getRedirectBaseUrl() + "/payment/result";
        if (appTransId == null || appTransId.isBlank()) return base;
        ThanhToan payment;
        try {
            payment = resolvePayment(appTransId);
        } catch (RuntimeException ex) {
            log.warn("Không tìm thấy thanh toán ZaloPay cho {}", appTransId);
            return base;
        }
        Integer orderId = payment.getDonHang() == null ? null : payment.getDonHang().getMaDonHang();
        String redirect = base + (orderId == null ? "" : "?orderId=" + orderId);
        Map<String, Object> queryResult;
        try {
            queryResult = queryOrder(appTransId);
        } catch (RuntimeException ex) {
            log.warn("Không thể truy vấn trạng thái ZaloPay cho {}", appTransId, ex);
            return redirect;
        }
        if (queryResult.get("is_processing") == Boolean.TRUE) return redirect;
        Object rawReturnCode = queryResult.get("return_code");
        if (!(rawReturnCode instanceof Number)) return redirect;
        int returnCode = ((Number) rawReturnCode).intValue();
        if (returnCode == 1) {
            queryResult.putIfAbsent("app_id", paymentConfig.getZalopay().getAppId());
            validateSettledPayment(queryResult, payment);
            settleAndNotify(payment, String.valueOf(queryResult.get("zp_trans_id")));
        } else {
            failAndNotify(payment);
        }
        return redirect;
    }

    private void failAndNotify(ThanhToan payment) {
        ThanhToanService.PaymentTransition transition =
                thanhToanService.failPaymentWithResult(payment.getMaThanhToan());
        if (!transition.changed() || payment.getDonHang() == null || payment.getDonHang().getNguoiDung() == null) return;
        try {
            Integer orderId = payment.getDonHang().getMaDonHang();
            thongBaoService.taoThongBao(
                    payment.getDonHang().getNguoiDung().getMaNguoiDung(),
                    "Thanh toán không thành công #" + orderId,
                    "Đơn hàng #" + orderId + " thanh toán qua ZaloPay không thành công hoặc đã bị hủy. Vui lòng thử lại.",
                    "THANH_TOAN_THAT_BAI", "/orders/" + orderId);
        } catch (Exception ignored) {}
    }

    @SuppressWarnings("unchecked")
    public Map<String, String> createPreviewOrder(BigDecimal amount) {
        PaymentConfig.ZalopayConfig config = paymentConfig.getZalopay();
        String previewRef = "PREVIEW_" + System.currentTimeMillis();
        String appTransId = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMdd"))
                + "_" + previewRef;
        long appTime = System.currentTimeMillis();
        String embedData = "{\"redirecturl\":\"\",\"orderId\":0}";
        String items = "[]";
        String description = "Thanh toan tai quay";

        String macData = config.getAppId() + "|" + appTransId + "|" + "user_0"
                + "|" + amount.longValue() + "|" + appTime + "|" + embedData + "|" + items;
        String mac = hmacSHA256(config.getKey1(), macData);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("app_id", config.getAppId());
        body.put("app_user", "user_0");
        body.put("app_trans_id", appTransId);
        body.put("app_time", appTime);
        body.put("amount", amount.longValue());
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
            result.put("qrCode", (String) zalopayResponse.get("qr_code"));
            return result;
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("Failed to create ZaloPay preview: " + e.getMessage());
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
