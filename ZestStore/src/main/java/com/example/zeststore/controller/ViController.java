package com.example.zeststore.controller;

import com.example.zeststore.service.NapTienService;
import com.example.zeststore.service.UserService;
import com.example.zeststore.service.ViService;
import jakarta.servlet.http.HttpServletRequest;
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
    private final NapTienService napTienService;
    private final UserService userService;

    @GetMapping("/so-du")
    public ResponseEntity<?> getSoDu(Authentication auth) {
        Integer userId = userService.getUserIdFromAuth(auth);
        BigDecimal soDu = viService.getSoDu(userId);
        return ResponseEntity.ok(Map.of("soDu", soDu));
    }

    @GetMapping("/lich-su")
    public ResponseEntity<?> getLichSu(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {
        Integer userId = userService.getUserIdFromAuth(auth);
        Page<?> lichSu = viService.getLichSu(userId, page, size);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("content", lichSu.getContent());
        result.put("totalPages", lichSu.getTotalPages());
        result.put("number", lichSu.getNumber());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/nap")
    public ResponseEntity<?> napTien(@RequestBody Map<String, Object> body,
                                     HttpServletRequest request,
                                     Authentication auth) {
        if (body.get("soTien") == null || body.get("phuongThuc") == null) {
            throw new com.example.zeststore.exception.BadRequestException("soTien and phuongThuc are required");
        }
        BigDecimal soTien = new BigDecimal(body.get("soTien").toString());
        Integer phuongThuc = Integer.valueOf(body.get("phuongThuc").toString());
        Integer userId = userService.getUserIdFromAuth(auth);
        String ipAddress = request.getRemoteAddr();
        Map<String, Object> result = napTienService.createNapTien(soTien, phuongThuc, userId, ipAddress);
        return ResponseEntity.ok(result);
    }
}
