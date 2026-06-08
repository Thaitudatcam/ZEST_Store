package com.example.zeststore.controller;

import com.example.zeststore.dto.request.ChangePasswordRequest;
import com.example.zeststore.dto.request.DiaChiRequest;
import com.example.zeststore.dto.request.UserUpdateRequest;
import com.example.zeststore.entity.DiaChiNguoiDung;
import com.example.zeststore.entity.NguoiDung;
import com.example.zeststore.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication auth) {
        NguoiDung user = getCurrentUser(auth);
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("maNguoiDung", user.getMaNguoiDung());
        result.put("hoTen", user.getHoTen());
        result.put("email", user.getEmail());
        result.put("soDienThoai", user.getSoDienThoai());
        result.put("anhDaiDien", user.getAnhDaiDien());
        result.put("gioiTinh", user.getGioiTinh());
        result.put("ngaySinh", user.getNgaySinh() != null ? user.getNgaySinh().toString() : null);
        result.put("vaiTro", user.getVaiTro() != null ? user.getVaiTro().getTenVaiTro() : null);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(Authentication auth,
                                            @Valid @RequestBody UserUpdateRequest request) {
        NguoiDung user = userService.updateProfile(getCurrentUser(auth).getMaNguoiDung(), request);
        return ResponseEntity.ok(Map.of("message", "Profile updated", "user", user));
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(Authentication auth,
                                             @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(getCurrentUser(auth).getMaNguoiDung(), request);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    @GetMapping("/addresses")
    public ResponseEntity<List<DiaChiNguoiDung>> getAddresses(Authentication auth) {
        return ResponseEntity.ok(userService.getAddresses(getCurrentUser(auth).getMaNguoiDung()));
    }

    @PostMapping("/addresses")
    public ResponseEntity<?> addAddress(Authentication auth,
                                         @Valid @RequestBody DiaChiRequest request) {
        DiaChiNguoiDung address = userService.addAddress(getCurrentUser(auth).getMaNguoiDung(), request);
        return ResponseEntity.ok(address);
    }

    @PutMapping("/addresses/{id}")
    public ResponseEntity<?> updateAddress(@PathVariable Integer id,
                                            @Valid @RequestBody DiaChiRequest request) {
        return ResponseEntity.ok(userService.updateAddress(id, request));
    }

    @DeleteMapping("/addresses/{id}")
    public ResponseEntity<?> deleteAddress(@PathVariable Integer id) {
        userService.deleteAddress(id);
        return ResponseEntity.ok(Map.of("message", "Address deleted"));
    }

    @PutMapping("/addresses/{id}/default")
    public ResponseEntity<?> setDefaultAddress(Authentication auth, @PathVariable Integer id) {
        userService.setDefaultAddress(getCurrentUser(auth).getMaNguoiDung(), id);
        return ResponseEntity.ok(Map.of("message", "Default address updated"));
    }

    private NguoiDung getCurrentUser(Authentication auth) {
        return userService.getUserByEmail(auth.getName());
    }
}
