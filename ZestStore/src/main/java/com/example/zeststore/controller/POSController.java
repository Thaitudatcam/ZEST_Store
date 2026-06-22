package com.example.zeststore.controller;

import com.example.zeststore.dto.request.PosOrderRequest;
import com.example.zeststore.service.POSService;
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
    private final UserService userService;

    @PostMapping("/orders")
    public ResponseEntity<?> createOrder(Authentication auth, @Valid @RequestBody PosOrderRequest request) {
        return ResponseEntity.ok(posService.createPosOrder(request, userService.getUserIdFromAuth(auth)));
    }
}
