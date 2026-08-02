package com.example.zeststore.controller;

import com.example.zeststore.dto.response.PaymentListDTO;
import com.example.zeststore.dto.response.PaymentStatsDTO;
import com.example.zeststore.service.ThanhToanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/payments")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminPaymentController {

    private final ThanhToanService thanhToanService;

    @GetMapping
    public ResponseEntity<List<PaymentListDTO>> getAllPayments(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) Integer method) {
        return ResponseEntity.ok(thanhToanService.getAllPayments(keyword, status, method));
    }

    @GetMapping("/stats")
    public ResponseEntity<PaymentStatsDTO> getStats() {
        return ResponseEntity.ok(thanhToanService.getPaymentStats());
    }
}
