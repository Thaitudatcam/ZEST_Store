package com.example.zeststore.service;

import com.example.zeststore.entity.ThongKeNgay;
import com.example.zeststore.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.zeststore.entity.DonHang;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class ThongKeService {


    private final DonHangRepository donHangRepository;
    private final SanPhamRepository sanPhamRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final HanhViNguoiDungRepository hanhViRepository;
    private final MucDonHangRepository mucDonHangRepository;
    private final ThongKeNgayRepository thongKeNgayRepository;

    // === ĐỌC TỪ BẢNG TỔNG HỢP THONG_KE_NGAY ===

    private BigDecimal doanhThuTrongKhoang(LocalDate tuNgay, LocalDate denNgay) {
        return donHangRepository.sumRevenueByDateRange(
                tuNgay.atStartOfDay(), denNgay.plusDays(1).atStartOfDay().minusNanos(1));
    }

    public Map<String, Object> getDashboardStats() {
        LocalDateTime now = LocalDateTime.now();
        LocalDate startOfMonth = now.toLocalDate().withDayOfMonth(1);
        LocalDate startOfYear = now.toLocalDate().withDayOfYear(1);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalProducts", sanPhamRepository.countByNgayXoaIsNull());
        stats.put("totalUsers", nguoiDungRepository.count());
        stats.put("totalOrders", donHangRepository.count());
        stats.put("pendingOrders", donHangRepository.countByTrangThaiDon(1));
        stats.put("monthlyRevenue", doanhThuTrongKhoang(startOfMonth, now.toLocalDate()));
        stats.put("yearlyRevenue", doanhThuTrongKhoang(startOfYear, now.toLocalDate()));
        return stats;
    }
    public Map<String, Object> getRevenueByDateRange(LocalDateTime tuNgay, LocalDateTime denNgay) {
        LocalDate tuDate = tuNgay.toLocalDate();
        LocalDate denDate = denNgay.toLocalDate();
        BigDecimal doanhThu = doanhThuTrongKhoang(tuDate, denDate);

        long soDonHoanThanh = donHangRepository.countCompletedOrders(tuNgay, denNgay);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("doanhThu", doanhThu);
        result.put("soDonHoanThanh", soDonHoanThanh);
        return result;
    }

    public List<Map<String, Object>> getRevenueByDay(LocalDateTime tuNgay, LocalDateTime denNgay) {
        return donHangRepository.sumRevenueByDay(tuNgay, denNgay).stream().map(row -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("ngay", row[0].toString());
            item.put("doanhThu", row[1]);
            return item;
        }).collect(Collectors.toList());
    }

    // === DOANH THU THEO THÁNG ===
    public List<Map<String, Object>> getRevenueByMonth(int thang, int nam) {
        LocalDate tuDate = LocalDate.of(nam, thang, 1);
        LocalDate denDate = tuDate.plusMonths(1).minusDays(1);
        return getRevenueByDay(tuDate.atStartOfDay(), denDate.atTime(java.time.LocalTime.MAX));
    }

    // === DOANH THU THEO NĂM ===
    public List<Map<String, Object>> getRevenueByYear() {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : donHangRepository.sumRevenueByYear()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("nam", row[0]);
            item.put("doanhThu", row[1]);
            result.add(item);
        }
        return result;
    }

    // === SẢN PHẨM BÁN CHẠY ===
    public List<Map<String, Object>> getBestSellingProducts(int limit) {
        List<Object[]> rows = mucDonHangRepository.findBestSellingProducts(PageRequest.of(0, limit));
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> item = new LinkedHashMap<>();
            Integer maSanPham = (Integer) row[0];
            item.put("maSanPham", maSanPham);
            item.put("tenSanPham", row[1]);
            item.put("urlAnh", row[2]);
            item.put("soLuongDaBan", row[3]);
            sanPhamRepository.findById(maSanPham).ifPresent(sp ->
                item.put("ngayXoa", sp.getNgayXoa())
            );
            result.add(item);
        }
        return result;
    }

    // === THỐNG KÊ ĐƠN HÀNG ===
    public Map<String, Object> getOrderStats() {
        List<Object[]> rows = donHangRepository.countOrdersByStatus();
        long total = 0, pending = 0, completed = 0, cancelled = 0, shipping = 0;
        for (Object[] row : rows) {
            Integer status = (Integer) row[0];
            Long count = (Long) row[1];
            total += count;
            switch (status) {
                case 1 -> pending = count;
                case 2 -> shipping = count;
                case 4 -> shipping = count;   // "Chờ giao hàng" → shipping (đang giao)
                case 5 -> cancelled = count;
                case 6 -> completed = count;  // "Đã giao hàng" → completed (đã giao)
            }
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalOrders", total);
        result.put("pending", pending);
        result.put("shipping", shipping);
        result.put("completed", completed);
        result.put("cancelled", cancelled);
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
        LocalDate homNay = LocalDate.now();
        LocalDate tuDate = homNay.minusDays(days);
        Map<LocalDate, BigDecimal> live = getRevenueByDay(tuDate.atStartOfDay(), homNay.atTime(java.time.LocalTime.MAX))
                .stream().collect(Collectors.toMap(
                        row -> LocalDate.parse(row.get("ngay").toString()),
                        row -> (BigDecimal) row.get("doanhThu")));
        List<Map<String, Object>> result = new ArrayList<>();
        for (int i = days; i >= 0; i--) {
            LocalDate date = homNay.minusDays(i);
            BigDecimal dt = live.getOrDefault(date, BigDecimal.ZERO);
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("ngay", date.toString());
            entry.put("doanhThu", dt);
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
                    m.put("hoTen", o.getTenNguoiNhan());
                    m.put("tongTien", o.getTongTien());
                    m.put("trangThaiDon", o.getTrangThaiDon());
                    m.put("ngayTao", o.getNgayDat());
                    m.put("loaiDonHang", o.getLoaiDonHang());
                    return m;
                }).collect(Collectors.toList());
    }

    // === TỔNG HỢP / REBUILD BẢNG THONG_KE_NGAY ===

    private long countTuKetQua(List<Object[]> rows) {
        return rows.isEmpty() ? 0 : (Long) rows.get(0)[1];
    }

    @Transactional
    public ThongKeNgay tinhLaiNgay(LocalDate ngay) {
        LocalDateTime start = ngay.atStartOfDay();
        LocalDateTime end = ngay.plusDays(1).atStartOfDay().minusNanos(1);
        ThongKeNgay tk = ThongKeNgay.builder()
                .ngay(ngay)
                .doanhThu(donHangRepository.sumRevenueByDateRange(start, end))
                .soDonMoi((int) countTuKetQua(donHangRepository.countDonHangTheoNgay(start, end)))
                .soDonChoXuLy((int) countTuKetQua(donHangRepository.countDonHangTheoTrangThaiVaNgay(1, start, end)))
                .soDonDangGiao((int) countTuKetQua(donHangRepository.countDonHangTheoTrangThaiVaNgay(2, start, end)))
                .soDonChoGiao((int) countTuKetQua(donHangRepository.countDonHangTheoTrangThaiVaNgay(4, start, end)))
                .soDonDaGiao((int) countTuKetQua(donHangRepository.countDonHangTheoTrangThaiVaNgay(6, start, end)))
                .soDonHuy((int) countTuKetQua(donHangRepository.countDonHangTheoTrangThaiVaNgay(5, start, end)))
                .soNguoiDungMoi((int) countTuKetQua(nguoiDungRepository.countNguoiDungTheoNgay(start, end)))
                .soSanPhamMoi((int) countTuKetQua(sanPhamRepository.countSanPhamTheoNgay(start, end)))
                .ngayCapNhat(LocalDateTime.now())
                .build();
        return thongKeNgayRepository.save(tk);
    }

    @Transactional
    public int rebuildThongKe(LocalDate tuNgay, LocalDate denNgay) {
        if (tuNgay.isAfter(denNgay)) {
            LocalDate tmp = tuNgay;
            tuNgay = denNgay;
            denNgay = tmp;
        }
        thongKeNgayRepository.deleteByNgayBetween(tuNgay, denNgay);
        int count = 0;
        for (LocalDate d = tuNgay; !d.isAfter(denNgay); d = d.plusDays(1)) {
            tinhLaiNgay(d);
            count++;
        }
        return count;
    }

    public LocalDate ngayThongKeDauTien() {
        LocalDateTime min = donHangRepository.minNgayDat();
        LocalDateTime minUser = nguoiDungRepository.minNgayTao();
        LocalDateTime minSp = sanPhamRepository.minNgayTao();
        LocalDateTime result = Stream.of(min, minUser, minSp)
                .filter(Objects::nonNull)
                .min(Comparator.naturalOrder())
                .orElse(LocalDate.now().minusDays(30).atStartOfDay());
        return result.toLocalDate();
    }
}
