package com.example.zeststore.controller;

import com.example.zeststore.config.PaymentConfig;
import com.example.zeststore.dto.response.PaymentResponse;
import com.example.zeststore.service.MomoService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.*;

@RestController
@RequestMapping("/api/payments/momo")
@RequiredArgsConstructor
public class MomoController {

    private final MomoService momoService;
    private final PaymentConfig paymentConfig;

    @PostMapping("/create/{orderId}")
    public ResponseEntity<?> createPayment(@PathVariable Integer orderId) {
        String paymentUrl = momoService.createPaymentUrl(orderId);
        return ResponseEntity.ok(PaymentResponse.builder()
                .paymentUrl(paymentUrl)
                .orderId(orderId)
                .message("Redirect to MoMo")
                .build());
    }

    @GetMapping("/return")
    public void returnHandler(@RequestParam Map<String, String> params, HttpServletResponse response) throws IOException {
        boolean verified = momoService.verifyReturn(new HashMap<>(params));
        String resultCode = params.get("resultCode");
        String orderId = params.get("orderId");
        String transId = params.get("transId");

        if (verified && "0".equals(resultCode) && orderId != null) {
            momoService.handleSuccessPayment(orderId, transId);
            Integer oid = extractOrderId(orderId);
            response.sendRedirect(paymentConfig.getRedirectBaseUrl()
                    + "/payment/result?success=true&orderId=" + oid);
        } else {
            if (orderId != null) momoService.handleFailedPayment(orderId);
            Integer oid = orderId != null ? extractOrderId(orderId) : null;
            String redirect = paymentConfig.getRedirectBaseUrl() + "/payment/result?success=false";
            if (oid != null) redirect += "&orderId=" + oid;
            response.sendRedirect(redirect);
        }
    }

    @PostMapping("/ipn")
    public ResponseEntity<?> ipnHandler(@RequestBody Map<String, Object> body) {
        Map<String, String> params = new HashMap<>();
        body.forEach((k, v) -> params.put(k, v != null ? v.toString() : ""));

        boolean verified = momoService.verifyReturn(params);
        String resultCode = params.get("resultCode");
        String orderId = params.get("orderId");
        String transId = params.get("transId");

        if (verified && "0".equals(resultCode) && orderId != null) {
            momoService.handleSuccessPayment(orderId, transId);
        } else if (orderId != null) {
            momoService.handleFailedPayment(orderId);
        }
        return ResponseEntity.ok(Map.of("message", "received"));
    }

    private Integer extractOrderId(String ref) {
        if (ref == null) return null;
        try {
            String[] parts = ref.split("-");
            return parts.length >= 2 ? Integer.parseInt(parts[1]) : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
