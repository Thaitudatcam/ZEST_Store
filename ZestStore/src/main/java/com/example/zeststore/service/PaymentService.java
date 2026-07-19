package com.example.zeststore.service;

import com.example.zeststore.config.PaymentConfig;
import com.example.zeststore.dto.response.PaymentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final VnPayService vnPayService;
    private final MomoService momoService;
    private final ZaloPayService zaloPayService;
    private final PaymentConfig paymentConfig;

    // ─── MoMo ───

    public PaymentResponse createMomoPayment(Integer orderId) {
        String paymentUrl = momoService.createPaymentUrl(orderId);
        return PaymentResponse.builder()
                .paymentUrl(paymentUrl)
                .orderId(orderId)
                .message("Redirect to MoMo")
                .build();
    }

    public String handleMomoReturn(Map<String, String> rawParams) {
        Map<String, String> result = momoService.buildReturnParams(new HashMap<>(rawParams));
        boolean success = "true".equals(result.get("verified")) && "0".equals(result.get("resultCode"));
        String redirectBase = paymentConfig.getRedirectBaseUrl();

        if (success && result.get("orderId") != null) {
            momoService.handleSuccessPayment(result.get("orderId"), result.get("transId"));
            if (result.get("orderId").startsWith("NAPVI")) {
                return redirectBase + "/vi-zeststore?status=pending";
            }
            return redirectBase + "/payment/result?success=true&orderId=" + result.get("orderIdInt");
        }
        String redirect = redirectBase + "/payment/result?success=false";
        if (result.get("orderIdInt") != null) redirect += "&orderId=" + result.get("orderIdInt");
        return redirect;
    }

    public Map<String, String> handleMomoIpn(Map<String, Object> body) {
        Map<String, String> params = new LinkedHashMap<>();
        body.forEach((k, v) -> params.put(k, v != null ? v.toString() : ""));

        Map<String, String> result = momoService.buildReturnParams(params);
        boolean success = "true".equals(result.get("verified")) && "0".equals(result.get("resultCode"));

        if (success && result.get("orderId") != null) {
            momoService.handleSuccessPayment(result.get("orderId"), result.get("transId"));
        } else if (result.get("orderId") != null) {
            momoService.handleFailedPayment(result.get("orderId"));
        }
        return Map.of("message", "received");
    }

    // ─── VNPay ───

    public PaymentResponse createVnPayPayment(Integer orderId, String ipAddress) {
        String paymentUrl = vnPayService.createPaymentUrl(orderId, ipAddress);
        return PaymentResponse.builder()
                .paymentUrl(paymentUrl)
                .orderId(orderId)
                .message("Redirect to VNPay")
                .build();
    }

    public String handleVnPayReturn(Map<String, String> params) {
        Map<String, String> result = vnPayService.buildReturnParams(params);
        boolean success = "true".equals(result.get("verified")) && "00".equals(result.get("responseCode"));
        String redirectBase = paymentConfig.getRedirectBaseUrl();

        if (success && result.get("txnRef") != null) {
            vnPayService.handleSuccessPayment(result.get("txnRef"), result.get("transactionNo"));
            if (result.get("txnRef").startsWith("NAPVI")) {
                return redirectBase + "/vi-zeststore?status=pending";
            }
            return redirectBase + "/payment/result?success=true&orderId=" + result.get("orderId");
        }
        String redirect = redirectBase + "/payment/result?success=false";
        if (result.get("orderId") != null) redirect += "&orderId=" + result.get("orderId");
        return redirect;
    }

    public Map<String, String> handleVnPayIpn(Map<String, String> params) {
        try {
            Map<String, String> result = vnPayService.buildReturnParams(params);
            boolean success = "true".equals(result.get("verified")) && "00".equals(result.get("responseCode"));

            if (success && result.get("txnRef") != null) {
                vnPayService.handleSuccessPayment(result.get("txnRef"), result.get("transactionNo"));
                return Map.of("RspCode", "00", "Message", "Success");
            }
            if (result.get("txnRef") != null) vnPayService.handleFailedPayment(result.get("txnRef"));
            return Map.of("RspCode", "01", "Message", "Failed");
        } catch (Exception e) {
            return Map.of("RspCode", "01", "Message", "Order not found");
        }
    }

    // ─── ZaloPay ───

    public PaymentResponse createZaloPayPayment(Integer orderId) {
        Map<String, String> result = zaloPayService.createOrder(orderId);
        String paymentUrl = result.get("orderUrl");
        return PaymentResponse.builder()
                .paymentUrl(paymentUrl)
                .orderId(orderId)
                .message("Redirect to ZaloPay")
                .build();
    }

    public Map<String, String> createZaloPayPreview(BigDecimal amount) {
        return zaloPayService.createPreviewOrder(amount);
    }

    public Map<String, Object> handleZaloPayCallback(Map<String, String> body) {
        String data = body.get("data");
        String mac = body.get("mac");

        if (zaloPayService.verifyCallback(data, mac)) {
            zaloPayService.handleSuccessCallback(data);
            return Map.of("return_code", 1, "return_message", "success");
        }
        return Map.of("return_code", -1, "return_message", "invalid mac");
    }

    public String handleZaloPayReturn(Map<String, String> params) {
        return zaloPayService.handleReturn(params);
    }
}
