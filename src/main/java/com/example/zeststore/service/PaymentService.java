package com.example.zeststore.service;

import com.example.zeststore.config.PaymentConfig;
import com.example.zeststore.dto.response.PaymentResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final VnPayService vnPayService;
    private final ZaloPayService zaloPayService;
    private final PaymentConfig paymentConfig;

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
        String redirectBase = paymentConfig.getRedirectBaseUrl();
        try {
            Map<String, String> result = vnPayService.buildReturnParams(params);
            // Browser return parameters only drive navigation. The signed,
            // server-to-server IPN is authoritative for changing payment state.
            String redirect = redirectBase + "/payment/result";
            if (result.get("orderId") != null) redirect += "?orderId=" + result.get("orderId");
            return redirect;
        } catch (RuntimeException ex) {
            // A gateway callback must never expose a Spring JSON error page to the buyer.
            // Keep the order id so the result page can poll while VNPay IPN settles.
            log.error("Không thể xử lý callback VNPay", ex);
            Integer orderId = null;
            if (params != null) {
                orderId = vnPayService.extractOrderId(params.get("vnp_TxnRef"));
            }
            return redirectBase + "/payment/result" + (orderId != null ? "?orderId=" + orderId : "");
        }
    }

    public Map<String, String> handleVnPayIpn(Map<String, String> params) {
        try {
            VnPayService.IpnResult result = vnPayService.processIpn(params);
            return Map.of("RspCode", result.rspCode(), "Message", result.message());
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

    public Map<String, Object> handleZaloPayCallback(Map<String, String> body) {
        String data = body.get("data");
        String mac = body.get("mac");

        if (zaloPayService.verifyCallback(data, mac)) {
            try {
                zaloPayService.handleSuccessCallback(data);
                return Map.of("return_code", 1, "return_message", "success");
            } catch (RuntimeException ex) {
                log.error("Không thể xử lý callback ZaloPay", ex);
                return Map.of("return_code", 0, "return_message", "callback processing failed");
            }
        }
        return Map.of("return_code", -1, "return_message", "invalid mac");
    }

    public String handleZaloPayReturn(Map<String, String> params) {
        return zaloPayService.handleReturn(params);
    }
}
