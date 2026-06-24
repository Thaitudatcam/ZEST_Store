package com.example.zeststore.controller;

import com.example.zeststore.service.AdminCustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/customers")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCustomerController {

    private final AdminCustomerService adminCustomerService;

    @GetMapping
    public ResponseEntity<?> getAllCustomers() {
        return ResponseEntity.ok(adminCustomerService.getAllCustomers());
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchCustomers(@RequestParam String q) {
        return ResponseEntity.ok(adminCustomerService.searchCustomers(q));
    }

    @PostMapping
    public ResponseEntity<?> createCustomer(@RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(adminCustomerService.createCustomer(body));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCustomerDetail(@PathVariable Integer id) {
        return ResponseEntity.ok(adminCustomerService.getCustomerDetail(id));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> toggleStatus(@PathVariable Integer id) {
        return ResponseEntity.ok(adminCustomerService.toggleStatus(id));
    }
}
