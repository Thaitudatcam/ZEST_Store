package com.example.zeststore.controller;

import com.example.zeststore.service.UserService;
import com.example.zeststore.service.YeuThichService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class YeuThichController {

    private final YeuThichService yeuThichService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<?> getWishlist(Authentication auth) {
        Integer userId = userService.getUserByEmail(auth.getName()).getMaNguoiDung();
        return ResponseEntity.ok(yeuThichService.getWishlistItems(userId));
    }

    @GetMapping("/check/{productId}")
    public ResponseEntity<?> checkInWishlist(Authentication auth, @PathVariable Integer productId) {
        Integer userId = userService.getUserByEmail(auth.getName()).getMaNguoiDung();
        return ResponseEntity.ok(Map.of("inWishlist", yeuThichService.isInWishlist(userId, productId)));
    }

    @PostMapping("/{productId}")
    public ResponseEntity<?> addItem(Authentication auth, @PathVariable Integer productId) {
        Integer userId = userService.getUserByEmail(auth.getName()).getMaNguoiDung();
        return ResponseEntity.ok(yeuThichService.addItem(userId, productId));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<?> removeItem(Authentication auth, @PathVariable Integer productId) {
        Integer userId = userService.getUserByEmail(auth.getName()).getMaNguoiDung();
        yeuThichService.removeItem(userId, productId);
        return ResponseEntity.ok(Map.of("message", "Item removed from wishlist"));
    }
}
