package com.example.zeststore.controller;

import com.example.zeststore.service.PaymentService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
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

    @GetMapping("/return")
    public void returnHandler(@RequestParam Map<String, String> params, HttpServletResponse response) throws IOException {
        response.sendRedirect(paymentService.handleZaloPayReturn(params));
    }
}
