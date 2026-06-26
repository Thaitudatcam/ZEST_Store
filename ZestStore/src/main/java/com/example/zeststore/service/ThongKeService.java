package com.example.zeststore.service;

import com.example.zeststore.repository.DonHangRepository;
import com.example.zeststore.repository.SanPhamRepository;
import com.example.zeststore.repository.NguoiDungRepository;
import com.example.zeststore.repository.HanhViNguoiDungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.zeststore.entity.DonHang;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ThongKeService {

    private final DonHangRepository donHangRepository;
    private final SanPhamRepository sanPhamRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final HanhViNguoiDungRepository hanhViRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStats() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfMonth = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime startOfYear = now.withDayOfYear(1).withHour(0).withMinute(0).withSecond(0);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalProducts", sanPhamRepository.countByNgayXoaIsNull());
        stats.put("totalUsers", nguoiDungRepository.count());
        stats.put("totalOrders", donHangRepository.count());
        stats.put("pendingOrders", donHangRepository.countByTrangThaiDon(1));
        stats.put("monthlyRevenue", donHangRepository.sumRevenueByDateRange(startOfMonth, now));
        stats.put("yearlyRevenue", donHangRepository.sumRevenueByDateRange(startOfYear, now));
        return stats;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getRevenueByDateRange(LocalDateTime tuNgay, LocalDateTime denNgay) {
        if (tuNgay == null) tuNgay = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        if (denNgay == null) denNgay = LocalDateTime.now();

        BigDecimal revenue = donHangRepository.sumRevenueByDateRange(tuNgay, denNgay);
        Long orderCount = donHangRepository.countCompletedOrders(tuNgay, denNgay);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("doanhThu", revenue);
        result.put("soDonHoanThanh", orderCount);
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTopProducts(String hanhDong, int limit) {
        LocalDateTime lastMonth = LocalDateTime.now().minusMonths(1);
        List<Object[]> raw = hanhViRepository.findTopSanPhamByHanhDongAndDateRange(
                hanhDong, lastMonth, LocalDateTime.now(), limit);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : raw) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("maSanPham", row[0]);
            item.put("tenSanPham", row[1]);
            item.put("soLanXem", row[2]);
            result.add(item);
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getRevenueByDate(int days) {
        LocalDateTime denNgay = LocalDateTime.now();
        LocalDateTime tuNgay = denNgay.minusDays(days).withHour(0).withMinute(0).withSecond(0);

        List<Object[]> raw = donHangRepository.findRevenueData(tuNgay, denNgay);
        Map<LocalDate, BigDecimal> map = new HashMap<>();
        for (Object[] row : raw) {
            LocalDateTime dt = (LocalDateTime) row[0];
            LocalDate date = dt.toLocalDate();
            BigDecimal amount = (BigDecimal) row[1];
            map.merge(date, amount, BigDecimal::add);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (int i = days; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("ngay", date.toString());
            entry.put("doanhThu", map.getOrDefault(date, BigDecimal.ZERO));
            result.add(entry);
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getRecentOrders(int limit) {
        return donHangRepository.findTop10ByOrderByNgayDatDesc()
                .stream().limit(limit).map(o -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("maDonHang", o.getMaDonHang());
                    m.put("tenNguoiNhan", o.getTenNguoiNhan());
                    m.put("tongTien", o.getTongTien());
                    m.put("trangThaiDon", o.getTrangThaiDon());
                    m.put("ngayDat", o.getNgayDat());
                    return m;
                }).collect(Collectors.toList());
    }
}