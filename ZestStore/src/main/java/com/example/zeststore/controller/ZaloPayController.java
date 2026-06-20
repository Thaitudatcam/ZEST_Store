package com.example.zeststore.controller;

import com.example.zeststore.dto.response.PaymentResponse;
import com.example.zeststore.service.ZaloPayService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments/zalopay")
@RequiredArgsConstructor
public class ZaloPayController {

    private final ZaloPayService zaloPayService;

    @PostMapping("/create/{orderId}")
    public ResponseEntity<?> createPayment(@PathVariable Integer orderId) {
        Map<String, String> result = zaloPayService.createOrder(orderId);
        return ResponseEntity.ok(PaymentResponse.builder()
                .paymentUrl(result.get("orderUrl"))
                .orderId(orderId)
                .message("Redirect to ZaloPay")
                .build());
    }

    @PostMapping("/callback")
    public ResponseEntity<?> callback(@RequestBody Map<String, String> body) {
        String data = body.get("data");
        String mac = body.get("mac");

        if (zaloPayService.verifyCallback(data, mac)) {
            zaloPayService.handleSuccessCallback(data);
            return ResponseEntity.ok(Map.of("return_code", 1, "return_message", "success"));
        }
        return ResponseEntity.ok(Map.of("return_code", -1, "return_message", "invalid mac"));
    }
}
