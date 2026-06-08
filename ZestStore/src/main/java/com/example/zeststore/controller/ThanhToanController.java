package com.example.zeststore.controller;

import com.example.zeststore.service.ThanhToanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class ThanhToanController {

    private final ThanhToanService thanhToanService;

    @GetMapping("/order/{orderId}")
    public ResponseEntity<?> getPaymentsByOrder(@PathVariable Integer orderId) {
        return ResponseEntity.ok(thanhToanService.getPaymentsByOrder(orderId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPaymentById(@PathVariable Integer id) {
        return ResponseEntity.ok(thanhToanService.getPaymentById(id));
    }

    @PutMapping("/{id}/success")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> completePayment(@PathVariable Integer id,
                                              @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(thanhToanService.completePayment(id,
                body.get("maGiaoDich"), body.get("transactionId")));
    }

    @PutMapping("/{id}/fail")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> failPayment(@PathVariable Integer id) {
        return ResponseEntity.ok(thanhToanService.failPayment(id));
    }
}
