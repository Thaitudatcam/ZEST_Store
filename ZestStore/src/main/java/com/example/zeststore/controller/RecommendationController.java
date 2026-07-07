package com.example.zeststore.controller;

import com.example.zeststore.service.RecommendationService;
import com.example.zeststore.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final UserService userService;

    @GetMapping("/best-selling")
    public ResponseEntity<?> getBestSelling(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(recommendationService.getBestSelling(limit));
    }

    @GetMapping("/product/{id}/related")
    public ResponseEntity<?> getRelated(@PathVariable Integer id,
                                         @RequestParam(defaultValue = "6") int limit) {
        return ResponseEntity.ok(recommendationService.getRelatedProducts(id, limit));
    }

    @GetMapping("/popular")
    public ResponseEntity<?> getPopular(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(recommendationService.getPopular(limit));
    }

    @GetMapping("/personalized")
    public ResponseEntity<?> getPersonalized(Authentication auth,
                                              @RequestParam(defaultValue = "10") int limit) {
        Integer userId = userService.getUserIdFromAuth(auth);
        return ResponseEntity.ok(recommendationService.getPersonalized(userId, limit));
    }
}
