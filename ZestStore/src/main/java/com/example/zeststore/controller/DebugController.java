package com.example.zeststore.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/debug")
public class DebugController {

    @GetMapping("/auth")
    public ResponseEntity<?> checkAuth(Authentication authentication) {
        Map<String, Object> result = new LinkedHashMap<>();
        if (authentication == null) {
            result.put("authenticated", false);
            result.put("message", "No authentication found");
        } else {
            result.put("authenticated", authentication.isAuthenticated());
            result.put("name", authentication.getName());
            result.put("principalType", authentication.getPrincipal().getClass().getName());
            result.put("authorities", authentication.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList()));
        }
        return ResponseEntity.ok(result);
    }
}
