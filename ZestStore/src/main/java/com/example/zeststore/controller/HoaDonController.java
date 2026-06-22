package com.example.zeststore.controller;

import com.example.zeststore.service.HoaDonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class HoaDonController {

    private final HoaDonService hoaDonService;

    @GetMapping
    public ResponseEntity<?> getAllInvoices() {
        return ResponseEntity.ok(hoaDonService.getAllInvoices());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getInvoiceDetail(@PathVariable Integer id) {
        return ResponseEntity.ok(hoaDonService.getInvoiceDetail(id));
    }

    @PostMapping("/generate/{orderId}")
    public ResponseEntity<?> generateInvoice(@PathVariable Integer orderId) {
        try {
            return ResponseEntity.ok(hoaDonService.generateInvoice(orderId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
