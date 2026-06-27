package com.example.zeststore.service;

import com.example.zeststore.config.GhnConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class GhnService {

    private final GhnConfig config;
    private final RestTemplate restTemplate;
    private final PhiVanChuyenService phiVanChuyenService;

    private HttpEntity<Void> createGetEntity() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Token", config.getToken());
        headers.set("ShopId", String.valueOf(config.getShopId()));
        return new HttpEntity<>(headers);
    }

    private <T> HttpEntity<T> createPostEntity(T body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Token", config.getToken());
        headers.set("ShopId", String.valueOf(config.getShopId()));
        return new HttpEntity<>(body, headers);
    }

    private Map<String, Object> parseResponse(ResponseEntity<Map<String, Object>> response) {
        if (response.getBody() != null && response.getBody().containsKey("data")) {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("data", response.getBody().get("data"));
            return result;
        }
        return Map.of("data", List.of());
    }

    private Map<String, Object> errorResponse(String message) {
        return Map.of("error", true, "message", message, "data", List.of());
    }

    public Map<String, Object> getProvinces() {
        try {
            String url = config.getBaseUrl() + "/master-data/province";
            var response = restTemplate.exchange(url, HttpMethod.GET, createGetEntity(),
                    new ParameterizedTypeReference<Map<String, Object>>() {});
            return parseResponse(response);
        } catch (Exception e) {
            log.error("GHN getProvinces failed: {}", e.getMessage());
            return errorResponse(e.getMessage());
        }
    }

    public Map<String, Object> getDistricts(int provinceId) {
        try {
            String url = config.getBaseUrl() + "/master-data/district?province_id=" + provinceId;
            var response = restTemplate.exchange(url, HttpMethod.GET, createGetEntity(),
                    new ParameterizedTypeReference<Map<String, Object>>() {});
            return parseResponse(response);
        } catch (Exception e) {
            log.error("GHN getDistricts failed: {}", e.getMessage());
            return errorResponse(e.getMessage());
        }
    }

    public Map<String, Object> getWards(int districtId) {
        try {
            String url = config.getBaseUrl() + "/master-data/ward?district_id=" + districtId;
            var response = restTemplate.exchange(url, HttpMethod.GET, createGetEntity(),
                    new ParameterizedTypeReference<Map<String, Object>>() {});
            return parseResponse(response);
        } catch (Exception e) {
            log.error("GHN getWards failed: {}", e.getMessage());
            return errorResponse(e.getMessage());
        }
    }

    public Map<String, Object> getServices(int toDistrictId, Integer fromDistrictId) {
        try {
            String url = config.getBaseUrl() + "/v2/shipping-order/available-services";
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("shop_id", config.getShopId());
            body.put("from_district", fromDistrictId != null ? fromDistrictId : config.getFromDistrictId());
            body.put("to_district", toDistrictId);
            var response = restTemplate.exchange(url, HttpMethod.POST, createPostEntity(body),
                    new ParameterizedTypeReference<Map<String, Object>>() {});
            return parseResponse(response);
        } catch (Exception e) {
            log.error("GHN getServices failed: {}", e.getMessage());
            return errorResponse(e.getMessage());
        }
    }

    public Map<String, Object> calculateFee(int serviceTypeId, int toDistrictId, String toWardCode, int weight) {
        try {
            String url = config.getBaseUrl() + "/v2/shipping-order/fee";
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("service_type_id", serviceTypeId);
            body.put("from_district_id", config.getFromDistrictId());
            body.put("from_ward_code", config.getFromWardCode());
            body.put("to_district_id", toDistrictId);
            body.put("to_ward_code", toWardCode);
            body.put("weight", weight);
            body.put("insurance_value", 500000);
            body.put("coupon", null);
            var response = restTemplate.exchange(url, HttpMethod.POST, createPostEntity(body),
                    new ParameterizedTypeReference<Map<String, Object>>() {});
            return parseResponse(response);
        } catch (Exception e) {
            log.error("GHN calculateFee failed: {}", e.getMessage());
            return errorResponse(e.getMessage());
        }
    }

    public Map<String, Object> calculateFee(String provinceName, int serviceTypeId, int toDistrictId, String toWardCode, int weight) {
        Map<String, Object> result = calculateFee(serviceTypeId, toDistrictId, toWardCode, weight);
        if (result.containsKey("error")) return result;

        try {
            Object data = result.get("data");
            if (data instanceof Map) {
                Object total = ((Map<?, ?>) data).get("total");
                if (total instanceof Number) {
                    BigDecimal fee = BigDecimal.valueOf(((Number) total).longValue());
                    phiVanChuyenService.saveFeeLog(provinceName, fee);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to save GHN fee log: {}", e.getMessage());
        }
        return result;
    }
}
