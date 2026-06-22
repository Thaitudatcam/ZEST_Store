package com.example.zeststore.controller;

import com.example.zeststore.dto.request.CouponRequest;
import com.example.zeststore.dto.request.CouponValidateRequest;
import com.example.zeststore.service.PhieuGiamGiaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class PhieuGiamGiaController {

    private final PhieuGiamGiaService phieuGiamGiaService;

    @PostMapping("/validate")
    public ResponseEntity<?> validate(@Valid @RequestBody CouponValidateRequest request) {
        return ResponseEntity.ok(phieuGiamGiaService.validateCoupon(request.getMaCode(), request.getGiaTriDon()));
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
        return ResponseEntity.ok(phieuGiamGiaService.delete(id));
    }
}
