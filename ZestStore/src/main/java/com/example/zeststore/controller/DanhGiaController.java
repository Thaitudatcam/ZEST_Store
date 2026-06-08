package com.example.zeststore.controller;

import com.example.zeststore.dto.request.DanhGiaRequest;
import com.example.zeststore.service.DanhGiaService;
import com.example.zeststore.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class DanhGiaController {

    private final DanhGiaService danhGiaService;
    private final UserService userService;

    @GetMapping("/product/{productId}")
    public ResponseEntity<?> getByProduct(@PathVariable Integer productId) {
        return ResponseEntity.ok(Map.of(
                "reviews", danhGiaService.getReviewsByProduct(productId),
                "averageRating", danhGiaService.getAverageRating(productId),
                "reviewCount", danhGiaService.getReviewCount(productId)
        ));
    }

    @PostMapping
    public ResponseEntity<?> addReview(Authentication auth, @Valid @RequestBody DanhGiaRequest request) {
        Integer userId = userService.getUserByEmail(auth.getName()).getMaNguoiDung();
        return ResponseEntity.ok(danhGiaService.addReview(userId, request));
    }
}
