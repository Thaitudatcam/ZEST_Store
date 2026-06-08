package com.example.zeststore.service;

import com.example.zeststore.repository.DonHangRepository;
import com.example.zeststore.repository.SanPhamRepository;
import com.example.zeststore.repository.NguoiDungRepository;
import com.example.zeststore.repository.HanhViNguoiDungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ThongKeService {

    private final DonHangRepository donHangRepository;
    private final SanPhamRepository sanPhamRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final HanhViNguoiDungRepository hanhViRepository;

    public Map<String, Object> getDashboardStats() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfMonth = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime startOfYear = now.withDayOfYear(1).withHour(0).withMinute(0).withSecond(0);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalProducts", sanPhamRepository.count());
        stats.put("totalUsers", nguoiDungRepository.count());
        stats.put("totalOrders", donHangRepository.count());
        stats.put("pendingOrders", donHangRepository.countByTrangThaiDon("pending"));
        stats.put("monthlyRevenue", donHangRepository.sumRevenueByDateRange(startOfMonth, now));
        stats.put("yearlyRevenue", donHangRepository.sumRevenueByDateRange(startOfYear, now));
        return stats;
    }

    public Map<String, Object> getRevenueByDateRange(LocalDateTime tuNgay, LocalDateTime denNgay) {
        BigDecimal revenue = donHangRepository.sumRevenueByDateRange(tuNgay, denNgay);
        Long orderCount = donHangRepository.findByNgayDatBetween(tuNgay, denNgay)
                .stream().filter(o -> o.getTrangThaiDon().equals("delivered")).count();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("tuNgay", tuNgay);
        result.put("denNgay", denNgay);
        result.put("doanhThu", revenue);
        result.put("soDonHoanThanh", orderCount);
        return result;
    }

    public List<Object[]> getTopProducts(String hanhDong, int limit) {
        LocalDateTime lastMonth = LocalDateTime.now().minusMonths(1);
        return hanhViRepository.findTopSanPhamByHanhDongAndDateRange(
                hanhDong, lastMonth, LocalDateTime.now(), limit);
    }
}
