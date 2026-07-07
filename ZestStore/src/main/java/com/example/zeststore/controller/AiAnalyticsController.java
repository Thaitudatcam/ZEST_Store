package com.example.zeststore.controller;

import com.example.zeststore.service.AiAnalyticsService;
import com.example.zeststore.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AiAnalyticsController {

    private final AiAnalyticsService aiAnalyticsService;
    private final UserService userService;

    @GetMapping("/insights")
    public ResponseEntity<?> getInsights(Authentication auth) {
        Integer userId = userService.getUserIdFromAuth(auth);
        return ResponseEntity.ok(aiAnalyticsService.generateInsights(userId));
    }
}
