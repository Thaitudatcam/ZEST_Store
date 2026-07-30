package com.example.zeststore.service;

import com.example.zeststore.repository.DonHangRepository;
import com.example.zeststore.repository.NguoiDungRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminAiService {

    private final ThongKeService thongKeService;
    private final OpenAiService openAiService;
    private final DonHangRepository donHangRepo;
    private final NguoiDungRepository nguoiDungRepo;
    private final ObjectMapper objectMapper;

    public Map<String, Object> ask(String question, Integer adminUserId) {
        String lower = question.toLowerCase();

        Map<String, Object> stats = thongKeService.getDashboardStats();
        Map<String, Object> orderStats = thongKeService.getOrderStats();
        List<Map<String, Object>> bestSellers = thongKeService.getBestSellingProducts(5);
        List<Map<String, Object>> revenueDay = thongKeService.getRevenueByDate(7);

        StringBuilder data = new StringBuilder();
        data.append("Thống kê tổng quan hiện tại:\n");
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

        String lienKet = guessLink(lower);

        ArrayNode messages = objectMapper.createArrayNode();
        ObjectNode sysNode = messages.addObject();
        sysNode.put("role", "system");
        sysNode.put("content", "Bạn là trợ lý AI cho admin ZestStore. Trả lời ngắn gọn 2-4 câu bằng tiếng Việt dựa trên dữ liệu thực tế được cung cấp. Nếu câu hỏi không liên quan đến bán hàng, hãy lịch sự từ chối và gợi ý hỏi về doanh thu, đơn hàng, sản phẩm.");
        ObjectNode userNode = messages.addObject();
        userNode.put("role", "user");
        userNode.put("content", "Dữ liệu cửa hàng:\n" + data + "\n\nCâu hỏi: " + question);

        String answer = openAiService.chat(messages);

        Map<String, Object> result = new HashMap<>();
        result.put("answer", answer);
        result.put("lienKet", lienKet);
        return result;
    }

    private String guessLink(String question) {
        if (question.contains("don hang") || question.contains("đơn hàng") || question.contains("order"))
            return "/admin/orders/online";
        if (question.contains("san pham") || question.contains("sản phẩm") || question.contains("product") || question.contains("ban chay") || question.contains("bán chạy"))
            return "/admin/products";
        if (question.contains("khach") || question.contains("khách") || question.contains("nguoi dung") || question.contains("người dùng") || question.contains("customer"))
            return "/admin/customers";
        if (question.contains("doanh thu") || question.contains("thong ke") || question.contains("thống kê") || question.contains("revenue") || question.contains("stat"))
            return "/admin/thong-ke";
        if (question.contains("tra hang") || question.contains("trả hàng") || question.contains("return"))
            return "/admin/returns";
        return "/admin/thong-ke";
    }
}
