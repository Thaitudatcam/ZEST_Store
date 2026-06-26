package com.example.zeststore.controller;

import com.example.zeststore.dto.request.PhiVanChuyenRequest;
import com.example.zeststore.service.PhiVanChuyenService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/shipping-fees")
@RequiredArgsConstructor
public class PhiVanChuyenController {

    private final PhiVanChuyenService service;

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/by-province")
    public ResponseEntity<?> getByProvince(@RequestParam String province) {
        BigDecimal fee = service.getPhiByTenTinh(province);
        return ResponseEntity.ok(Map.of("tenTinh", province, "phiVanChuyen", fee));
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody PhiVanChuyenRequest request) {
        return ResponseEntity.ok(service.createFromRequest(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @Valid @RequestBody PhiVanChuyenRequest request) {
        return ResponseEntity.ok(service.updateFromRequest(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        service.delete(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }
}
