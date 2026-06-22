package com.example.zeststore.controller;

import com.example.zeststore.service.AdminEmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/employees")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminEmployeeController {

    private final AdminEmployeeService adminEmployeeService;

    @GetMapping
    public ResponseEntity<?> getAllEmployees() {
        return ResponseEntity.ok(adminEmployeeService.getAllEmployees());
    }

    @PostMapping
    public ResponseEntity<?> createEmployee(@RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(adminEmployeeService.createEmployee(body));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEmployee(@PathVariable Integer id, @RequestBody Map<String, String> body) {
        adminEmployeeService.updateEmployee(id, body);
        return ResponseEntity.ok(Map.of("message", "Employee updated successfully"));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> toggleStatus(@PathVariable Integer id) {
        return ResponseEntity.ok(adminEmployeeService.toggleStatus(id));
    }
}
