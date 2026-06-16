package com.example.zeststore.controller;

import com.example.zeststore.dto.request.CartItemRequest;
import com.example.zeststore.entity.NguoiDung;
import com.example.zeststore.service.GioHangService;
import com.example.zeststore.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class GioHangController {

    private final GioHangService gioHangService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<?> getCart(Authentication auth) {
        Integer userId = userService.getUserByEmail(auth.getName()).getMaNguoiDung();
        return ResponseEntity.ok(gioHangService.getCartItems(userId));
    }

    @PostMapping
    public ResponseEntity<?> addItem(Authentication auth, @Valid @RequestBody CartItemRequest request) {
        Integer userId = userService.getUserByEmail(auth.getName()).getMaNguoiDung();
        return ResponseEntity.ok(gioHangService.addItem(userId, request.getMaBienThe(), request.getSoLuong()));
    }

    @PutMapping("/items/{maBienThe}")
    public ResponseEntity<?> updateQuantity(Authentication auth, @PathVariable Integer maBienThe,
                                             @RequestBody Map<String, Integer> body) {
        Integer userId = userService.getUserByEmail(auth.getName()).getMaNguoiDung();
        return ResponseEntity.ok(gioHangService.updateQuantity(userId, maBienThe, body.get("soLuong")));
    }

    @DeleteMapping("/items/{maBienThe}")
    public ResponseEntity<?> removeItem(Authentication auth, @PathVariable Integer maBienThe) {
        Integer userId = userService.getUserByEmail(auth.getName()).getMaNguoiDung();
        gioHangService.removeItem(userId, maBienThe);
        return ResponseEntity.ok(Map.of("message", "Item removed from cart"));
    }

    @DeleteMapping
    public ResponseEntity<?> clearCart(Authentication auth) {
        Integer userId = userService.getUserByEmail(auth.getName()).getMaNguoiDung();
        gioHangService.clearCart(userId);
        return ResponseEntity.ok(Map.of("message", "Cart cleared"));
    }
}
