package com.example.zeststore.controller;

import com.example.zeststore.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments/zalopay")
@RequiredArgsConstructor
public class ZaloPayController {

    private final PaymentService paymentService;

    @PostMapping("/create/{orderId}")
    public ResponseEntity<?> createPayment(@PathVariable Integer orderId) {
        return ResponseEntity.ok(paymentService.createZaloPayPayment(orderId));
    }

    @PostMapping("/callback")
    public ResponseEntity<?> callback(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(paymentService.handleZaloPayCallback(body));
    }
}
