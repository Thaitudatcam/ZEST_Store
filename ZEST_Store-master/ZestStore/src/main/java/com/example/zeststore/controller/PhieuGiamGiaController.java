package com.example.zeststore.controller;

import com.example.zeststore.dto.request.CouponRequest;
import com.example.zeststore.service.PhieuGiamGiaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class PhieuGiamGiaController {

    private final PhieuGiamGiaService phieuGiamGiaService;

    @PostMapping("/validate")
    public ResponseEntity<?> validate(@RequestBody Map<String, Object> body) {
        String code = (String) body.get("maCode");
        BigDecimal giaTriDon = body.get("giaTriDon") != null
                ? new BigDecimal(body.get("giaTriDon").toString())
                : BigDecimal.ZERO;
        return ResponseEntity.ok(phieuGiamGiaService.validateCoupon(code, giaTriDon));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(phieuGiamGiaService.getAll());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> create(@Valid @RequestBody CouponRequest request) {
        return ResponseEntity.ok(phieuGiamGiaService.create(request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        phieuGiamGiaService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Coupon deleted"));
    }
}
