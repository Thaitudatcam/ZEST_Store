package com.example.zeststore.controller;

import com.example.zeststore.service.AdminReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/reviews")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminReviewController {

    private final AdminReviewService adminReviewService;

    @GetMapping
    public ResponseEntity<?> getAllReviews() {
        return ResponseEntity.ok(adminReviewService.getAllReviews());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReview(@PathVariable Integer id) {
        adminReviewService.deleteReview(id);
        return ResponseEntity.ok(Map.of("message", "Review deleted successfully"));
    }

    @PutMapping("/{id}/restore")
    public ResponseEntity<?> restoreReview(@PathVariable Integer id) {
        adminReviewService.restoreReview(id);
        return ResponseEntity.ok(Map.of("message", "Review restored successfully"));
    }
}
