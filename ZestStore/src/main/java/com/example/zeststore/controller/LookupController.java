package com.example.zeststore.controller;

import com.example.zeststore.dto.request.BrandRequest;
import com.example.zeststore.dto.request.ColorRequest;
import com.example.zeststore.dto.request.SizeRequest;
import com.example.zeststore.service.LookupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class LookupController {

    private final LookupService lookupService;

    @GetMapping("/brands")
    public ResponseEntity<?> getBrands() {
        return ResponseEntity.ok(lookupService.getBrands());
    }

    @PostMapping("/brands")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createBrand(@Valid @RequestBody BrandRequest request) {
        return ResponseEntity.ok(lookupService.createBrand(request.getTenThuongHieu()));
    }

    @GetMapping("/sizes")
    public ResponseEntity<?> getSizes() {
        return ResponseEntity.ok(lookupService.getSizes());
    }

    @GetMapping("/colors")
    public ResponseEntity<?> getColors() {
        return ResponseEntity.ok(lookupService.getColors());
    }

    @PostMapping("/colors")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createColor(@Valid @RequestBody ColorRequest request) {
        return ResponseEntity.ok(lookupService.createColor(request.getTenMauSac(), request.getMaMauHex()));
    }

    @PostMapping("/sizes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createSize(@Valid @RequestBody SizeRequest request) {
        return ResponseEntity.ok(lookupService.createSize(request.getTenKichCo()));
    }

    @DeleteMapping("/colors/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteColor(@PathVariable Integer id) {
        lookupService.deleteColor(id);
        return ResponseEntity.ok(java.util.Map.of("message", "Color deleted successfully"));
    }
}
