package com.example.zeststore.controller;

import com.example.zeststore.dto.request.PaymentCompleteRequest;
import com.example.zeststore.service.ThanhToanService;
import com.example.zeststore.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class ThanhToanController {

    private final ThanhToanService thanhToanService;
    private final UserService userService;

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
                                              @Valid @RequestBody PaymentCompleteRequest request) {
        return ResponseEntity.ok(thanhToanService.completePayment(id, request.getMaGiaoDich()));
    }

    @PutMapping("/{id}/fail")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> failPayment(@PathVariable Integer id) {
        return ResponseEntity.ok(thanhToanService.failPayment(id));
    }

    @PostMapping("/{id}/retry")
    public ResponseEntity<?> retryPayment(@PathVariable Integer id, Authentication auth) {
        return ResponseEntity.ok(thanhToanService.retryPayment(id, userService.getUserIdFromAuth(auth)));
    }
}
