package com.example.zeststore.controller;

import com.example.zeststore.dto.request.PosCartRequest;
import com.example.zeststore.dto.request.PosOrderRequest;
import com.example.zeststore.service.POSService;
import com.example.zeststore.service.PosCartService;
import com.example.zeststore.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/pos")
@RequiredArgsConstructor
public class POSController {

    private final POSService posService;
    private final PosCartService posCartService;
    private final UserService userService;

    @PostMapping("/orders")
    public ResponseEntity<?> createOrder(Authentication auth, @Valid @RequestBody PosOrderRequest request) {
        return ResponseEntity.ok(posService.createPosOrder(request, userService.getUserIdFromAuth(auth)));
    }

    @GetMapping("/cart")
    public ResponseEntity<?> getCart(Authentication auth) {
        return ResponseEntity.ok(posCartService.getCart(userService.getUserIdFromAuth(auth)));
    }

    @PostMapping("/cart/add")
    public ResponseEntity<?> addToCart(Authentication auth, @Valid @RequestBody PosCartRequest request) {
        return ResponseEntity.ok(posCartService.addItem(userService.getUserIdFromAuth(auth), request));
    }

    @PostMapping("/cart/release")
    public ResponseEntity<?> releaseFromCart(Authentication auth, @Valid @RequestBody PosCartRequest request) {
        posCartService.releaseItem(userService.getUserIdFromAuth(auth), request);
        return ResponseEntity.ok(Map.of("message", "Released"));
    }

    @DeleteMapping("/cart")
    public ResponseEntity<?> clearCart(Authentication auth) {
        posCartService.clearCart(userService.getUserIdFromAuth(auth));
        return ResponseEntity.ok(Map.of("message", "Cart cleared"));
    }
}
