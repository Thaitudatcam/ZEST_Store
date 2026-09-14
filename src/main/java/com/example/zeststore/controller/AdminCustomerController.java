package com.example.zeststore.controller;

import com.example.zeststore.service.AdminCustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
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

    @GetMapping("/{id}/addresses")
    public ResponseEntity<?> getCustomerAddresses(@PathVariable Integer id) {
        return ResponseEntity.ok(adminCustomerService.getCustomerAddresses(id));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> toggleStatus(@PathVariable Integer id) {
        return ResponseEntity.ok(adminCustomerService.toggleStatus(id));
    }

    @PostMapping("/bulk-delete")
    public ResponseEntity<?> bulkDelete(@RequestBody List<Integer> ids) {
        return ResponseEntity.ok(adminCustomerService.bulkDeleteCustomers(ids));
    }
}
