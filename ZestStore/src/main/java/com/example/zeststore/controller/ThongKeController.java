package com.example.zeststore.controller;

import com.example.zeststore.service.ThongKeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

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

    @GetMapping("/revenue-by-date")
    public ResponseEntity<?> getRevenueByDate(@RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(thongKeService.getRevenueByDate(days));
    }

    @GetMapping("/recent-orders")
    public ResponseEntity<?> getRecentOrders(@RequestParam(defaultValue = "10") int limit) {
        var orders = thongKeService.getRecentOrders(limit);
        var result = orders.stream().map(o -> {
            Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("maDonHang", o.getMaDonHang());
            m.put("maDonHangCode", o.getMaDonHangCode());
            m.put("tenNguoiNhan", o.getTenNguoiNhan());
            m.put("tongTien", o.getTongTien());
            m.put("trangThaiDon", o.getTrangThaiDon());
            m.put("ngayDat", o.getNgayDat());
            if (o.getNguoiDung() != null) {
                m.put("tenKhachHang", o.getNguoiDung().getHoTen());
            }
            return m;
        }).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(result);
    }
}
