package com.example.zeststore.controller;

import com.example.zeststore.service.GhnService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/shipping")
@RequiredArgsConstructor
public class GhnController {

    private final GhnService ghnService;

    @GetMapping("/ghn/provinces")
    public ResponseEntity<?> getProvinces() {
        return ResponseEntity.ok(ghnService.getProvinces());
    }

    @GetMapping("/ghn/districts")
    public ResponseEntity<?> getDistricts(@RequestParam int provinceId) {
        return ResponseEntity.ok(ghnService.getDistricts(provinceId));
    }

    @GetMapping("/ghn/wards")
    public ResponseEntity<?> getWards(@RequestParam int districtId) {
        return ResponseEntity.ok(ghnService.getWards(districtId));
    }

    @GetMapping("/ghn/services")
    public ResponseEntity<?> getServices(@RequestParam int toDistrictId, @RequestParam(required = false) Integer fromDistrictId) {
        return ResponseEntity.ok(ghnService.getServices(toDistrictId, fromDistrictId));
    }

    @PostMapping("/ghn/fee")
    public ResponseEntity<?> calculateFee(@RequestBody Map<String, Object> request) {
        int serviceTypeId = ((Number) request.getOrDefault("serviceTypeId", 2)).intValue();
        int toDistrictId = ((Number) request.get("toDistrictId")).intValue();
        String toWardCode = (String) request.get("toWardCode");
        int weight = ((Number) request.getOrDefault("weight", 500)).intValue();
        return ResponseEntity.ok(ghnService.calculateFee(serviceTypeId, toDistrictId, toWardCode, weight));
    }

    @PostMapping("/calculate")
    public ResponseEntity<?> calculateShippingFee(@RequestBody Map<String, Object> request) {
        try {
            int serviceTypeId = request.containsKey("serviceTypeId") ? ((Number) request.get("serviceTypeId")).intValue() : 2;
            int toDistrictId = ((Number) request.get("toDistrictId")).intValue();
            String toWardCode = (String) request.get("toWardCode");
            int weight = ((Number) request.getOrDefault("weight", 500)).intValue();
            String provinceName = (String) request.getOrDefault("provinceName", "");

            Map<String, Object> result = ghnService.calculateFee(provinceName, serviceTypeId, toDistrictId, toWardCode, weight);

            if (result.containsKey("error")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", true,
                    "message", "Không thể tính phí vận chuyển từ GHN. Vui lòng thử lại sau."
                ));
            }

            Object data = result.get("data");
            if (data instanceof Map) {
                Object total = ((Map<?, ?>) data).get("total");
                if (total instanceof Number) {
                    return ResponseEntity.ok(Map.of(
                        "fee", ((Number) total).longValue(),
                        "source", "ghn"
                    ));
                }
            }
            return ResponseEntity.badRequest().body(Map.of(
                "error", true,
                "message", "GHN trả về dữ liệu không hợp lệ"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", true,
                "message", "Không thể tính phí vận chuyển"
            ));
        }
    }
}
