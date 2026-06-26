package com.example.zeststore.controller;

import com.example.zeststore.service.EmailService;
import com.example.zeststore.service.ThongKeService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
<<<<<<< HEAD
import java.time.LocalTime;
import java.util.List;
=======
>>>>>>> 393536e33d73ef0c78343db998b60a6973c9ba10
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ThongKeController {

    private final ThongKeService thongKeService;

    private final EmailService emailService;

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        return ResponseEntity.ok(thongKeService.getDashboardStats());
    }

    @GetMapping("/revenue/day")
    public ResponseEntity<?> getRevenueByDay(
            @RequestParam(required = false) LocalDate tuNgay,
            @RequestParam(required = false) LocalDate denNgay) {
        if (tuNgay == null) tuNgay = LocalDate.now().withDayOfMonth(1);
        if (denNgay == null) denNgay = LocalDate.now();
        return ResponseEntity.ok(thongKeService.getRevenueByDay(
                tuNgay.atStartOfDay(), denNgay.atTime(LocalTime.MAX)));
    }

    @GetMapping("/revenue/month")
    public ResponseEntity<?> getRevenueByMonth(
            @RequestParam int thang,
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().getYear()}") int nam) {
        return ResponseEntity.ok(thongKeService.getRevenueByMonth(thang, nam));
    }

    @GetMapping("/revenue/year")
    public ResponseEntity<?> getRevenueByYear() {
        return ResponseEntity.ok(thongKeService.getRevenueByYear());
    }

    @GetMapping("/best-selling")
    public ResponseEntity<?> getBestSelling(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(thongKeService.getBestSellingProducts(limit));
    }

    @GetMapping("/order-stats")
    public ResponseEntity<?> getOrderStats() {
        return ResponseEntity.ok(thongKeService.getOrderStats());
    }

    @GetMapping("/export-excel")
    public void exportExcel(HttpServletResponse response,
                            @RequestParam(required = false) LocalDate tuNgay,
                            @RequestParam(required = false) LocalDate denNgay) throws IOException {
        if (tuNgay == null) tuNgay = LocalDate.now().withDayOfMonth(1);
        if (denNgay == null) denNgay = LocalDate.now();

        LocalDateTime from = tuNgay.atStartOfDay();
        LocalDateTime to = denNgay.atTime(LocalTime.MAX);

        // Lấy dữ liệu
        List<Map<String, Object>> revenueDay = thongKeService.getRevenueByDay(from, to);
        Map<String, Object> orderStats = thongKeService.getOrderStats();
        List<Map<String, Object>> bestSelling = thongKeService.getBestSellingProducts(10);

        Workbook workbook = new XSSFWorkbook();

        // === SHEET 1: DOANH THU ===
        Sheet sheet1 = workbook.createSheet("Doanh thu");
        Row h1 = sheet1.createRow(0);
        h1.createCell(0).setCellValue("Ngày");
        h1.createCell(1).setCellValue("Doanh thu");
        int r = 1;
        for (Map<String, Object> item : revenueDay) {
            Row row = sheet1.createRow(r++);
            row.createCell(0).setCellValue(item.get("ngay") != null ? item.get("ngay").toString() : "");
            Object dt = item.get("doanhThu");
            row.createCell(1).setCellValue(dt instanceof BigDecimal ? ((BigDecimal) dt).doubleValue() : 0);
        }
        sheet1.autoSizeColumn(0);
        sheet1.autoSizeColumn(1);

        // === SHEET 2: THỐNG KÊ ĐƠN HÀNG ===
        Sheet sheet2 = workbook.createSheet("Thống kê đơn hàng");
        Row h2 = sheet2.createRow(0);
        h2.createCell(0).setCellValue("Chỉ tiêu");
        h2.createCell(1).setCellValue("Số lượng");
        String[] labels = {"Tổng đơn hàng", "Đang chờ xử lý", "Đang giao", "Đã giao", "Đã hủy"};
        String[] keys = {"totalOrders", "pending", "shipping", "completed", "cancelled"};
        for (int i = 0; i < labels.length; i++) {
            Row row = sheet2.createRow(i + 1);
            row.createCell(0).setCellValue(labels[i]);
            Object val = orderStats.get(keys[i]);
            row.createCell(1).setCellValue(val instanceof Number ? ((Number) val).doubleValue() : 0);
        }
        sheet2.autoSizeColumn(0);
        sheet2.autoSizeColumn(1);

        // === SHEET 3: SẢN PHẨM BÁN CHẠY ===
        Sheet sheet3 = workbook.createSheet("Sản phẩm bán chạy");
        Row h3 = sheet3.createRow(0);
        h3.createCell(0).setCellValue("Tên sản phẩm");
        h3.createCell(1).setCellValue("Số lượng đã bán");
        int r3 = 1;
        for (Map<String, Object> item : bestSelling) {
            Row row = sheet3.createRow(r3++);
            row.createCell(0).setCellValue(item.get("tenSanPham") != null ? item.get("tenSanPham").toString() : "");
            Object sl = item.get("soLuongDaBan");
            row.createCell(1).setCellValue(sl instanceof Number ? ((Number) sl).doubleValue() : 0);
        }
        sheet3.autoSizeColumn(0);
        sheet3.autoSizeColumn(1);

        // Ghi file
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=thong-ke.xlsx");
        workbook.write(response.getOutputStream());
        workbook.close();
    }
    @PostMapping("/export-email")
    public ResponseEntity<?> exportAndSendEmail(@RequestBody Map<String, String> body) {
        try {
            LocalDate tuNgay = body.get("tuNgay") != null ? LocalDate.parse(body.get("tuNgay")) : LocalDate.now().withDayOfMonth(1);
            LocalDate denNgay = body.get("denNgay") != null ? LocalDate.parse(body.get("denNgay")) : LocalDate.now();

            LocalDateTime from = tuNgay.atStartOfDay();
            LocalDateTime to = denNgay.atTime(LocalTime.MAX);

            Map<String, Object> orderStats = thongKeService.getOrderStats();
            List<Map<String, Object>> revenueDay = thongKeService.getRevenueByDay(from, to);
            List<Map<String, Object>> bestSelling = thongKeService.getBestSellingProducts(10);

            emailService.sendStatReport(tuNgay.toString(), denNgay.toString(), orderStats, revenueDay, bestSelling);

            return ResponseEntity.ok(Map.of("success", true, "message", "Đã gửi email thành công!"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Lỗi: " + e.getMessage()));
        }
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
