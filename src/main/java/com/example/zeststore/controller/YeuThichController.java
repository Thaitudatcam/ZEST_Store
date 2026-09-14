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
        return ResponseEntity.ok(yeuThichService.getWishlistItems(userService.getUserIdFromAuth(auth)));
    }

    @GetMapping("/check/{productId}")
    public ResponseEntity<?> checkInWishlist(Authentication auth, @PathVariable Integer productId) {
        return ResponseEntity.ok(Map.of("inWishlist",
                yeuThichService.isInWishlist(userService.getUserIdFromAuth(auth), productId)));
    }

    @PostMapping("/{productId}")
    public ResponseEntity<?> addItem(Authentication auth, @PathVariable Integer productId) {
        return ResponseEntity.ok(yeuThichService.addItem(userService.getUserIdFromAuth(auth), productId));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<?> removeItem(Authentication auth, @PathVariable Integer productId) {
        return ResponseEntity.ok(yeuThichService.removeItem(userService.getUserIdFromAuth(auth), productId));
    }
}
