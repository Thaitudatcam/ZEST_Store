package com.example.zeststore.controller;

import com.example.zeststore.service.PaymentService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/payments/momo")
@RequiredArgsConstructor
public class MomoController {

    private final PaymentService paymentService;

    @PostMapping("/create/{orderId}")
    public ResponseEntity<?> createPayment(@PathVariable Integer orderId) {
        return ResponseEntity.ok(paymentService.createMomoPayment(orderId));
    }

    @GetMapping("/return")
    public void returnHandler(@RequestParam Map<String, String> params, HttpServletResponse response) throws IOException {
        response.sendRedirect(paymentService.handleMomoReturn(params));
    }

    @PostMapping("/ipn")
    public ResponseEntity<?> ipnHandler(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(paymentService.handleMomoIpn(body));
    }
}
