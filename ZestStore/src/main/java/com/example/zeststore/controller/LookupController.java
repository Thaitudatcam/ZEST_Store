package com.example.zeststore.controller;

import com.example.zeststore.service.LookupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class LookupController {

    private final LookupService lookupService;

    @GetMapping("/brands")
    public ResponseEntity<?> getBrands() {
        return ResponseEntity.ok(lookupService.getBrands());
    }

    @GetMapping("/sizes")
    public ResponseEntity<?> getSizes() {
        return ResponseEntity.ok(lookupService.getSizes());
    }

    @GetMapping("/colors")
    public ResponseEntity<?> getColors() {
        return ResponseEntity.ok(lookupService.getColors());
    }
}
