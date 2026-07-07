package com.example.zeststore.service;

import com.example.zeststore.entity.BaoCaoThongKe;
import com.example.zeststore.entity.NguoiDung;
import com.example.zeststore.repository.BaoCaoThongKeRepository;
import com.example.zeststore.repository.DonHangRepository;
import com.example.zeststore.repository.NguoiDungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AiAnalyticsService {

    private final ThongKeService thongKeService;
    private final DonHangRepository donHangRepo;
    private final BaoCaoThongKeRepository baoCaoRepo;
    private final NguoiDungRepository nguoiDungRepo;
    private final OpenAiService openAiService;

    public Map<String, Object> generateInsights(Integer adminUserId) {
        Map<String, Object> stats = thongKeService.getDashboardStats();
        Map<String, Object> orderStats = thongKeService.getOrderStats();
        List<Map<String, Object>> bestSellers = thongKeService.getBestSellingProducts(5);
        List<Map<String, Object>> revenueDay = thongKeService.getRevenueByDate(7);

        StringBuilder data = new StringBuilder();
        data.append("Thống kê tổng quan:\n");
        data.append("- Sản phẩm: ").append(stats.get("totalProducts")).append("\n");
        data.append("- Người dùng: ").append(stats.get("totalUsers")).append("\n");
        data.append("- Đơn hàng: ").append(orderStats.get("totalOrders")).append("\n");
        data.append("- Doanh thu tháng này: ").append(stats.get("monthlyRevenue")).append(" VND\n");
        data.append("- Doanh thu năm: ").append(stats.get("yearlyRevenue")).append(" VND\n");
        data.append("- Đơn chờ xử lý: ").append(orderStats.get("pending")).append("\n");
        data.append("- Đơn đang giao: ").append(orderStats.get("shipping")).append("\n");
        data.append("- Đơn đã giao: ").append(orderStats.get("completed")).append("\n");
        data.append("- Đơn đã hủy: ").append(orderStats.get("cancelled")).append("\n\n");
        data.append("Top 5 sản phẩm bán chạy:\n");
        for (Map<String, Object> sp : bestSellers) {
            data.append("- ").append(sp.get("tenSanPham")).append(": ").append(sp.get("soLuongDaBan")).append(" cái\n");
        }
        data.append("\nDoanh thu 7 ngày gần nhất:\n");
        for (Map<String, Object> d : revenueDay) {
            data.append("- ").append(d.get("ngay")).append(": ").append(d.get("doanhThu")).append(" VND\n");
        }

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content",
                "Bạn là chuyên gia phân tích dữ liệu bán hàng. Hãy phân tích dữ liệu dưới đây và đưa ra nhận xét bằng tiếng Việt, " +
                "ngắn gọn trong 3-5 câu. Nêu bật xu hướng doanh thu, sản phẩm nổi bật, và gợi ý cải thiện."));
        messages.add(Map.of("role", "user", "content", data.toString()));

        String insight = openAiService.chat(messages);

        try {
            NguoiDung admin = nguoiDungRepo.findById(adminUserId).orElse(null);
            if (admin != null) {
                BaoCaoThongKe report = BaoCaoThongKe.builder()
                        .nguoiDung(admin)
                        .tenBaoCao("AI Insights - " + LocalDate.now())
                        .loaiBaoCao("AI_INSIGHT")
                        .duLieuBieuDoJson(insight)
                        .tuNgay(LocalDate.now().minusDays(30))
                        .denNgay(LocalDate.now())
                        .build();
                baoCaoRepo.save(report);
            }
        } catch (Exception ignored) {}

        Map<String, Object> result = new HashMap<>();
        result.put("insight", insight);
        result.put("ngayTao", LocalDateTime.now().toString());
        return result;
    }
}
