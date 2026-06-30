package com.example.zeststore.controller;

import com.example.zeststore.service.UserService;
import com.example.zeststore.service.VoucherNguoiDungService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user-vouchers")
@RequiredArgsConstructor
public class VoucherNguoiDungController {

    private final VoucherNguoiDungService voucherNguoiDungService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<?> getUserVouchers(Authentication auth) {
        return ResponseEntity.ok(voucherNguoiDungService
                .getUserVouchers(userService.getUserIdFromAuth(auth)));
    }

    @GetMapping("/count")
    public ResponseEntity<?> getCount(Authentication auth) {
        return ResponseEntity.ok(voucherNguoiDungService
                .getUserVoucherCount(userService.getUserIdFromAuth(auth)));
    }

    @PostMapping("/claim")
    public ResponseEntity<?> claimVoucher(Authentication auth, @RequestBody Map<String, String> body) {
        String maCode = body.get("maCode");
        if (maCode == null || maCode.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mã voucher không được để trống"));
        }
        return ResponseEntity.ok(voucherNguoiDungService
                .claimVoucher(userService.getUserIdFromAuth(auth), maCode.trim()));
    }
}
