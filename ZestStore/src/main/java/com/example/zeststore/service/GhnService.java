package com.example.zeststore.service;

import com.example.zeststore.config.GhnConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
public class GhnService {

    private final GhnConfig config;
    private final RestTemplate restTemplate;

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

    public Map<String, Object> getProvinces() {
        String url = config.getBaseUrl() + "/master-data/province";
        var response = restTemplate.exchange(url, HttpMethod.GET, createGetEntity(),
                new ParameterizedTypeReference<Map<String, Object>>() {});
        return parseResponse(response);
    }

    public Map<String, Object> getDistricts(int provinceId) {
        String url = config.getBaseUrl() + "/master-data/district?province_id=" + provinceId;
        var response = restTemplate.exchange(url, HttpMethod.GET, createGetEntity(),
                new ParameterizedTypeReference<Map<String, Object>>() {});
        return parseResponse(response);
    }

    public Map<String, Object> getWards(int districtId) {
        String url = config.getBaseUrl() + "/master-data/ward?district_id=" + districtId;
        var response = restTemplate.exchange(url, HttpMethod.GET, createGetEntity(),
                new ParameterizedTypeReference<Map<String, Object>>() {});
        return parseResponse(response);
    }

    public Map<String, Object> getServices(int toDistrictId, Integer fromDistrictId) {
        String url = config.getBaseUrl() + "/v2/shipping-order/available-services";
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("shop_id", config.getShopId());
        body.put("from_district", fromDistrictId != null ? fromDistrictId : 3440);
        body.put("to_district", toDistrictId);
        var response = restTemplate.exchange(url, HttpMethod.POST, createPostEntity(body),
                new ParameterizedTypeReference<Map<String, Object>>() {});
        return parseResponse(response);
    }

    public Map<String, Object> calculateFee(int serviceTypeId, int toDistrictId, String toWardCode, int weight, Integer fromDistrictId) {
        String url = config.getBaseUrl() + "/v2/shipping-order/fee";
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("service_type_id", serviceTypeId);
        body.put("to_district_id", toDistrictId);
        body.put("to_ward_code", toWardCode);
        body.put("weight", weight);
        if (fromDistrictId != null) body.put("from_district_id", fromDistrictId);
        body.put("insurance_value", 500000);
        body.put("coupon", null);
        var response = restTemplate.exchange(url, HttpMethod.POST, createPostEntity(body),
                new ParameterizedTypeReference<Map<String, Object>>() {});
        return parseResponse(response);
    }
}
