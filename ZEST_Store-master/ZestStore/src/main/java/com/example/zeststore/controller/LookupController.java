package com.example.zeststore.controller;

import com.example.zeststore.repository.ThuongHieuRepository;
import com.example.zeststore.repository.KichCoRepository;
import com.example.zeststore.repository.MauSacRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class LookupController {

    private final ThuongHieuRepository thuongHieuRepository;
    private final KichCoRepository kichCoRepository;
    private final MauSacRepository mauSacRepository;

    @GetMapping("/brands")
    public ResponseEntity<?> getBrands() {
        return ResponseEntity.ok(thuongHieuRepository.findAll());
    }

    @GetMapping("/sizes")
    public ResponseEntity<?> getSizes() {
        return ResponseEntity.ok(kichCoRepository.findAll());
    }

    @GetMapping("/colors")
    public ResponseEntity<?> getColors() {
        return ResponseEntity.ok(mauSacRepository.findAll());
    }
}