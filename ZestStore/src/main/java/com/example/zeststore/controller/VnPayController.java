package com.example.zeststore.controller;

import com.example.zeststore.config.PaymentConfig;
import com.example.zeststore.dto.response.PaymentResponse;
import com.example.zeststore.service.VnPayService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.*;

@RestController
@RequestMapping("/api/payments/vnpay")
@RequiredArgsConstructor
@Slf4j
public class VnPayController {

    private final VnPayService vnPayService;
    private final PaymentConfig paymentConfig;

    @PostMapping("/create/{orderId}")
    public ResponseEntity<?> createPayment(@PathVariable Integer orderId, HttpServletRequest request) {
        String ipAddress = request.getRemoteAddr();
        String paymentUrl = vnPayService.createPaymentUrl(orderId, ipAddress);
        return ResponseEntity.ok(PaymentResponse.builder()
                .paymentUrl(paymentUrl)
                .orderId(orderId)
                .message("Redirect to VNPay")
                .build());
    }

    @GetMapping("/return")
    public void returnHandler(HttpServletRequest request, HttpServletResponse response) throws IOException {
        Map<String, String> params = new HashMap<>();
        Enumeration<String> paramNames = request.getParameterNames();
        while (paramNames.hasMoreElements()) {
            String key = paramNames.nextElement();
            params.put(key, request.getParameter(key));
        }

        boolean verified = vnPayService.verifyReturn(params);
        String responseCode = params.get("vnp_ResponseCode");
        String txnRef = params.get("vnp_TxnRef");

        if (verified && "00".equals(responseCode) && txnRef != null) {
            vnPayService.handleSuccessPayment(txnRef, params.get("vnp_TransactionNo"));
            Integer orderId = extractOrderId(txnRef);
            response.sendRedirect(paymentConfig.getRedirectBaseUrl()
                    + "/payment/result?success=true&orderId=" + orderId);
        } else {
            if (txnRef != null) vnPayService.handleFailedPayment(txnRef);
            Integer orderId = txnRef != null ? extractOrderId(txnRef) : null;
            String redirect = paymentConfig.getRedirectBaseUrl() + "/payment/result?success=false";
            if (orderId != null) redirect += "&orderId=" + orderId;
            response.sendRedirect(redirect);
        }
    }

    @PostMapping("/ipn")
    public ResponseEntity<?> ipnHandler(HttpServletRequest request) {
        Map<String, String> params = new HashMap<>();
        Enumeration<String> paramNames = request.getParameterNames();
        while (paramNames.hasMoreElements()) {
            String key = paramNames.nextElement();
            params.put(key, request.getParameter(key));
        }

        boolean verified = vnPayService.verifyReturn(params);
        String responseCode = params.get("vnp_ResponseCode");
        String txnRef = params.get("vnp_TxnRef");

        try {
            if (verified && "00".equals(responseCode) && txnRef != null) {
                vnPayService.handleSuccessPayment(txnRef, params.get("vnp_TransactionNo"));
                return ResponseEntity.ok(Map.of("RspCode", "00", "Message", "Success"));
            }
            if (txnRef != null) vnPayService.handleFailedPayment(txnRef);
            return ResponseEntity.ok(Map.of("RspCode", "01", "Message", "Failed"));
        } catch (Exception e) {
            log.error("VNPay IPN processing failed: {}", e.getMessage());
            return ResponseEntity.ok(Map.of("RspCode", "01", "Message", "Order not found"));
        }
    }

    private Integer extractOrderId(String txnRef) {
        if (txnRef == null) return null;
        try {
            String[] parts = txnRef.split("-");
            return parts.length >= 2 ? Integer.parseInt(parts[1]) : null;
        } catch (NumberFormatException e) {
            log.warn("Cannot extract orderId from txnRef: {}", txnRef);
            return null;
        }
    }
}
