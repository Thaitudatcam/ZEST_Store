package com.example.zeststore.controller;

import com.example.zeststore.dto.request.CartItemRequest;
import com.example.zeststore.dto.request.CartUpdateRequest;
import com.example.zeststore.service.GioHangService;
import com.example.zeststore.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class GioHangController {

    private final GioHangService gioHangService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<?> getCart(Authentication auth) {
        return ResponseEntity.ok(gioHangService.getCartItems(userService.getUserIdFromAuth(auth)));
    }

    @PostMapping
    public ResponseEntity<?> addItem(Authentication auth, @Valid @RequestBody CartItemRequest request) {
        return ResponseEntity.ok(gioHangService.addItem(
                userService.getUserIdFromAuth(auth), request.getMaBienThe(), request.getSoLuong()));
    }

    @PutMapping("/items/{maBienThe}")
    public ResponseEntity<?> updateQuantity(Authentication auth, @PathVariable Integer maBienThe,
                                             @Valid @RequestBody CartUpdateRequest request) {
        return ResponseEntity.ok(gioHangService.updateQuantity(
                userService.getUserIdFromAuth(auth), maBienThe, request.getSoLuong()));
    }

    @DeleteMapping("/items/{maBienThe}")
    public ResponseEntity<?> removeItem(Authentication auth, @PathVariable Integer maBienThe) {
        return ResponseEntity.ok(gioHangService.removeItem(userService.getUserIdFromAuth(auth), maBienThe));
    }

    @DeleteMapping
    public ResponseEntity<?> clearCart(Authentication auth) {
        return ResponseEntity.ok(gioHangService.clearCart(userService.getUserIdFromAuth(auth)));
    }
}
