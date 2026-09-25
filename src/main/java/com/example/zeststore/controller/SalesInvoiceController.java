package com.example.zeststore.controller;

import com.example.zeststore.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import java.time.LocalDate;
import java.util.Map;

@RestController @RequestMapping("/api/admin/invoices") @RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','STAFF')")
public class SalesInvoiceController {
    private final SalesInvoiceService invoices;
    private final UserService users;
    @GetMapping public Object list(@RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size,
        @RequestParam(defaultValue="") String q, @RequestParam(required=false) String status,
        @RequestParam(required=false) LocalDate from, @RequestParam(required=false) LocalDate to) {
        return invoices.list(q, status, from, to, page, size);
    }
    @GetMapping("/order/{orderId}") public Object byOrder(@PathVariable Integer orderId) {
        return invoices.forOrder(orderId).map(i -> Map.<String,Object>of("invoice", i)).orElse(Map.of());
    }
    @PostMapping("/order/{orderId}") public Object issue(@PathVariable Integer orderId, Authentication auth) {
        return invoices.issue(orderId, users.getUserIdFromAuth(auth));
    }
    @GetMapping("/{id}") public Object detail(@PathVariable Long id) { return invoices.detail(id); }
    @PostMapping("/{id}/print") public Object print(@PathVariable Long id) { return invoices.registerPrint(id); }
    @PostMapping("/{id}/void") @PreAuthorize("hasRole('ADMIN')")
    public Object voidInvoice(@PathVariable Long id, @RequestBody Map<String,String> body, Authentication auth) {
        return invoices.voidInvoice(id, body.get("reason"), users.getUserIdFromAuth(auth));
    }
}
