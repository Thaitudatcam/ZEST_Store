package com.example.zeststore.controller;

import com.example.zeststore.service.VietQrService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments/vietqr")
@RequiredArgsConstructor
public class VietQrController {

    private final VietQrService vietQrService;

    @PostMapping("/create/{orderId}")
    public ResponseEntity<?> createPayment(@PathVariable Integer orderId) {
        return ResponseEntity.ok(vietQrService.createQrPayment(orderId));
    }

    @PostMapping("/confirm/{paymentId}")
    public ResponseEntity<?> confirmPayment(@PathVariable Integer paymentId) {
        vietQrService.confirmPayment(paymentId);
        return ResponseEntity.ok(Map.of("message", "Payment confirmed"));
    }
}
