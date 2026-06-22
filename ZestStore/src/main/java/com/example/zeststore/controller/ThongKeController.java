package com.example.zeststore.controller;

import com.example.zeststore.service.ThongKeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ThongKeController {

    private final ThongKeService thongKeService;

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        return ResponseEntity.ok(thongKeService.getDashboardStats());
    }

    @GetMapping("/revenue")
    public ResponseEntity<?> getRevenue(@RequestParam(required = false) LocalDateTime tuNgay,
                                         @RequestParam(required = false) LocalDateTime denNgay) {
        return ResponseEntity.ok(thongKeService.getRevenueByDateRange(tuNgay, denNgay));
    }

    @GetMapping("/top-products")
    public ResponseEntity<?> getTopProducts(
            @RequestParam(defaultValue = "view") String hanhDong,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(thongKeService.getTopProducts(hanhDong, limit));
    }
}
