package com.example.zeststore.controller;

import com.example.zeststore.dto.request.ChangePasswordRequest;
import com.example.zeststore.dto.request.DiaChiRequest;
import com.example.zeststore.dto.request.UserUpdateRequest;
import com.example.zeststore.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication auth) {
        return ResponseEntity.ok(userService.getProfileData(userService.getUserIdFromAuth(auth)));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(Authentication auth,
                                            @Valid @RequestBody UserUpdateRequest request) {
        return ResponseEntity.ok(userService.updateProfile(userService.getUserIdFromAuth(auth), request));
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(Authentication auth,
                                             @Valid @RequestBody ChangePasswordRequest request) {
        return ResponseEntity.ok(userService.changePassword(userService.getUserIdFromAuth(auth), request));
    }

    @GetMapping("/addresses")
    public ResponseEntity<?> getAddresses(Authentication auth) {
        return ResponseEntity.ok(userService.getAddresses(userService.getUserIdFromAuth(auth)));
    }

    @PostMapping("/addresses")
    public ResponseEntity<?> addAddress(Authentication auth,
                                         @Valid @RequestBody DiaChiRequest request) {
        return ResponseEntity.ok(userService.addAddress(userService.getUserIdFromAuth(auth), request));
    }

    @PutMapping("/addresses/{id}")
    public ResponseEntity<?> updateAddress(Authentication auth,
                                            @PathVariable Integer id,
                                            @Valid @RequestBody DiaChiRequest request) {
        return ResponseEntity.ok(userService.updateAddress(userService.getUserIdFromAuth(auth), id, request));
    }

    @DeleteMapping("/addresses/{id}")
    public ResponseEntity<?> deleteAddress(Authentication auth, @PathVariable Integer id) {
        return ResponseEntity.ok(userService.deleteAddress(userService.getUserIdFromAuth(auth), id));
    }

    @PutMapping("/addresses/{id}/default")
    public ResponseEntity<?> setDefaultAddress(Authentication auth, @PathVariable Integer id) {
        return ResponseEntity.ok(userService.setDefaultAddress(userService.getUserIdFromAuth(auth), id));
    }
}
