package com.example.zeststore.controller;

import com.example.zeststore.service.ViService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/vi")
@RequiredArgsConstructor
public class ViController {

    private final ViService viService;

    @GetMapping("/so-du")
    public ResponseEntity<?> getSoDu(Authentication auth) {
        Integer userId = Integer.valueOf(auth.getName());
        BigDecimal soDu = viService.getSoDu(userId);
        return ResponseEntity.ok(Map.of("soDu", soDu));
    }

    @GetMapping("/lich-su")
    public ResponseEntity<?> getLichSu(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {
        Integer userId = Integer.valueOf(auth.getName());
        Page<?> lichSu = viService.getLichSu(userId, page, size);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("content", lichSu.getContent());
        result.put("totalPages", lichSu.getTotalPages());
        result.put("number", lichSu.getNumber());
        return ResponseEntity.ok(result);
    }
}
