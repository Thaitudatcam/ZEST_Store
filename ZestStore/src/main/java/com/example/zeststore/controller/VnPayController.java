package com.example.zeststore.controller;

import com.example.zeststore.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.*;

@RestController
@RequestMapping("/api/payments/vnpay")
@RequiredArgsConstructor
public class VnPayController {

    private final PaymentService paymentService;

    @PostMapping("/create/{orderId}")
    public ResponseEntity<?> createPayment(@PathVariable Integer orderId, HttpServletRequest request) {
        return ResponseEntity.ok(paymentService.createVnPayPayment(orderId, request.getRemoteAddr()));
    }

    @GetMapping("/return")
    public void returnHandler(HttpServletRequest request, HttpServletResponse response) throws IOException {
        Map<String, String> params = extractParams(request);
        response.sendRedirect(paymentService.handleVnPayReturn(params));
    }

    @PostMapping("/ipn")
    public ResponseEntity<?> ipnHandler(HttpServletRequest request) {
        Map<String, String> params = extractParams(request);
        return ResponseEntity.ok(paymentService.handleVnPayIpn(params));
    }

    private Map<String, String> extractParams(HttpServletRequest request) {
        Map<String, String> params = new HashMap<>();
        Enumeration<String> paramNames = request.getParameterNames();
        while (paramNames.hasMoreElements()) {
            String key = paramNames.nextElement();
            params.put(key, request.getParameter(key));
        }
        return params;
    }
}
