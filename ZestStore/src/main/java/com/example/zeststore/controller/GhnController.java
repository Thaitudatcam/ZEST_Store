package com.example.zeststore.controller;

import com.example.zeststore.service.GhnService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/shipping/ghn")
@RequiredArgsConstructor
public class GhnController {

    private final GhnService ghnService;

    @GetMapping("/provinces")
    public ResponseEntity<?> getProvinces() {
        return ResponseEntity.ok(ghnService.getProvinces());
    }

    @GetMapping("/districts")
    public ResponseEntity<?> getDistricts(@RequestParam int provinceId) {
        return ResponseEntity.ok(ghnService.getDistricts(provinceId));
    }

    @GetMapping("/wards")
    public ResponseEntity<?> getWards(@RequestParam int districtId) {
        return ResponseEntity.ok(ghnService.getWards(districtId));
    }

    @GetMapping("/services")
    public ResponseEntity<?> getServices(@RequestParam int toDistrictId, @RequestParam(required = false) Integer fromDistrictId) {
        return ResponseEntity.ok(ghnService.getServices(toDistrictId, fromDistrictId));
    }

    @PostMapping("/fee")
    public ResponseEntity<?> calculateFee(@RequestBody Map<String, Object> request) {
        int serviceTypeId = ((Number) request.getOrDefault("serviceTypeId", 2)).intValue();
        int toDistrictId = ((Number) request.get("toDistrictId")).intValue();
        String toWardCode = (String) request.get("toWardCode");
        int weight = ((Number) request.getOrDefault("weight", 500)).intValue();
        Integer fromDistrictId = request.containsKey("fromDistrictId") ? ((Number) request.get("fromDistrictId")).intValue() : null;
        return ResponseEntity.ok(ghnService.calculateFee(serviceTypeId, toDistrictId, toWardCode, weight, fromDistrictId));
    }
}
