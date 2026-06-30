package com.example.zeststore.controller;

import com.example.zeststore.dto.request.CouponRequest;
import com.example.zeststore.dto.request.CouponValidateRequest;
import com.example.zeststore.dto.response.CouponResponse;
import com.example.zeststore.service.PhieuGiamGiaService;
import com.example.zeststore.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class PhieuGiamGiaController {

    private final PhieuGiamGiaService phieuGiamGiaService;
    private final UserService userService;

    @PostMapping("/validate")
    public ResponseEntity<?> validate(@Valid @RequestBody CouponValidateRequest request) {
        return ResponseEntity.ok(phieuGiamGiaService.validateCoupon(request.getMaCode(), request.getTongTien()));
    }

    @GetMapping("/available")
    public ResponseEntity<?> getAvailable(
            @RequestParam(defaultValue = "0") BigDecimal tongTien,
            Authentication auth) {
        Integer userId = auth != null ? userService.getUserIdFromAuth(auth) : null;
        return ResponseEntity.ok(phieuGiamGiaService.getAvailableCoupons(tongTien, userId));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(phieuGiamGiaService.getAll());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> create(@Valid @RequestBody CouponRequest request) {
        return ResponseEntity.ok(phieuGiamGiaService.create(request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        return ResponseEntity.ok(phieuGiamGiaService.delete(id));
    }

    @GetMapping("/filter")
    public ResponseEntity<List<CouponResponse>> filterPhieuGiamGia(@RequestParam(required = false)
                                                          @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)LocalDateTime ngayBatDau,
                                                          @RequestParam(required = false)
                                                          @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)LocalDateTime ngayKetThuc,
                                                          @RequestParam(required = false) Integer kieuGiamGia,
                                                          @RequestParam(required = false)BigDecimal giaTriGiam
                                                          ){
        List<CouponResponse> result = phieuGiamGiaService.filterPhieuGiamGia(ngayBatDau, ngayKetThuc, kieuGiamGia, giaTriGiam);
        return ResponseEntity.ok(result);
    }
    @PutMapping("/{id}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> toggleStatus(@PathVariable Integer id) {
        return ResponseEntity.ok(phieuGiamGiaService.toggleStatus(id));
    }
}
