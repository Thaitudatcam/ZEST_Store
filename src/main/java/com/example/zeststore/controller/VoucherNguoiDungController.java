package com.example.zeststore.controller;

import com.example.zeststore.service.UserService;
import com.example.zeststore.service.VoucherNguoiDungService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    @GetMapping("/unclaimed-count")
    public ResponseEntity<?> getUnclaimedCount(Authentication auth) {
        return ResponseEntity.ok(voucherNguoiDungService
                .getUnclaimedCount(userService.getUserIdFromAuth(auth)));
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

    @PostMapping("/{id}/accept")
    public ResponseEntity<?> acceptVoucher(@PathVariable Integer id, Authentication auth) {
        return ResponseEntity.ok(voucherNguoiDungService
                .acceptVoucher(id, userService.getUserIdFromAuth(auth)));
    }

    @PostMapping("/grant")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> grantVoucher(@RequestBody Map<String, Integer> body) {
        Integer userId = body.get("maNguoiDung");
        Integer couponId = body.get("maPhieuGiamGia");
        if (userId == null || couponId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu thông tin"));
        }
        return ResponseEntity.ok(voucherNguoiDungService.grantVoucher(userId, couponId));
    }

    @PostMapping("/{id}/revoke")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> revokeVoucher(@PathVariable Integer id) {
        return ResponseEntity.ok(voucherNguoiDungService.revokeVoucher(id));
    }
}
