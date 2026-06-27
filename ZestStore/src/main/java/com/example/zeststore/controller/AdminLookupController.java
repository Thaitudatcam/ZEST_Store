package com.example.zeststore.controller;

import com.example.zeststore.service.AdminLookupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminLookupController {

    private final AdminLookupService adminLookupService;

    @PostMapping("/brands")
    public ResponseEntity<?> createBrand(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(adminLookupService.createBrand(body));
    }

    @PutMapping("/brands/{id}")
    public ResponseEntity<?> updateBrand(@PathVariable Integer id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(adminLookupService.updateBrand(id, body));
    }

    @DeleteMapping("/brands/{id}")
    public ResponseEntity<?> deleteBrand(@PathVariable Integer id) {
        return ResponseEntity.ok(adminLookupService.deleteBrand(id));
    }

    @PostMapping("/sizes")
    public ResponseEntity<?> createSize(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(adminLookupService.createSize(body));
    }

    @PutMapping("/sizes/{id}")
    public ResponseEntity<?> updateSize(@PathVariable Integer id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(adminLookupService.updateSize(id, body));
    }

    @DeleteMapping("/sizes/{id}")
    public ResponseEntity<?> deleteSize(@PathVariable Integer id) {
        return ResponseEntity.ok(adminLookupService.deleteSize(id));
    }

    @PostMapping("/colors")
    public ResponseEntity<?> createColor(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(adminLookupService.createColor(body));
    }

    @PutMapping("/colors/{id}")
    public ResponseEntity<?> updateColor(@PathVariable Integer id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(adminLookupService.updateColor(id, body));
    }

    @DeleteMapping("/colors/{id}")
    public ResponseEntity<?> deleteColor(@PathVariable Integer id) {
        return ResponseEntity.ok(adminLookupService.deleteColor(id));
    }
}
