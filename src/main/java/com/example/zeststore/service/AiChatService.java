package com.example.zeststore.service;

import com.example.zeststore.entity.HoiThoaiAi;
import com.example.zeststore.entity.TinNhanAi;
import com.example.zeststore.repository.DanhGiaRepository;
import com.example.zeststore.repository.DonHangRepository;
import com.example.zeststore.repository.HoiThoaiAiRepository;
import com.example.zeststore.repository.MucDonHangRepository;
import com.example.zeststore.repository.TinNhanAiRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiChatService {

    private final OpenAiService openAiService;
    private final HoiThoaiAiRepository hoiThoaiRepo;
    private final TinNhanAiRepository tinNhanRepo;
    private final SanPhamService sanPhamService;
    private final DonHangRepository donHangRepo;
    private final MucDonHangRepository mucDonHangRepo;
    private final DanhGiaRepository danhGiaRepo;
    private final ObjectMapper objectMapper;

    public List<HoiThoaiAi> getConversations(Integer maNguoiDung) {
        return hoiThoaiRepo.findByMaNguoiDungOrderByNgayTaoDesc(maNguoiDung);
    }

    public List<Map<String, Object>> getMessages(Integer maHoiThoai) {
        return tinNhanRepo.findByMaHoiThoaiOrderByNgayTaoAsc(maHoiThoai)
                .stream().map(this::toMessageMap).collect(Collectors.toList());
    }

    private Map<String, Object> toMessageMap(TinNhanAi msg) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("maTinNhan", msg.getMaTinNhan());
        m.put("maHoiThoai", msg.getMaHoiThoai());
        m.put("noiDung", msg.getNoiDung());
        m.put("hinhAnh", msg.getHinhAnh());
        m.put("nguoiGui", msg.getNguoiGui());
        m.put("ngayTao", msg.getNgayTao());
        if (msg.getSanPham() != null && !msg.getSanPham().isBlank()) {
            try {
                m.put("products", objectMapper.readValue(msg.getSanPham(),
                        new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {}));
            } catch (Exception e) {
                m.put("products", Collections.emptyList());
            }
        } else {
            m.put("products", Collections.emptyList());
        }
        return m;
    }

    public Map<String, Object> sendMessage(Integer maNguoiDung, String noiDung, Integer maHoiThoai, String hinhAnh) {
        if (maHoiThoai == null) {
            String tieuDe = (noiDung != null && !noiDung.isBlank())
                    ? (noiDung.length() > 50 ? noiDung.substring(0, 50) + "..." : noiDung)
                    : "Ảnh sản phẩm";
            HoiThoaiAi hoiThoai = HoiThoaiAi.builder()
                    .maNguoiDung(maNguoiDung)
                    .tieuDe(tieuDe)
                    .build();
            hoiThoai = hoiThoaiRepo.save(hoiThoai);
            maHoiThoai = hoiThoai.getMaHoiThoai();
        }

        TinNhanAi userMsg = TinNhanAi.builder()
                .maHoiThoai(maHoiThoai)
                .noiDung(noiDung != null ? noiDung : "")
                .hinhAnh(hinhAnh)
                .nguoiGui("user")
                .build();
        tinNhanRepo.save(userMsg);

        List<Map<String, Object>> matchedProducts = new ArrayList<>();
        String intent = "OTHER";
        String statsContext = "";
        if (noiDung != null && !noiDung.isBlank()) {
            intent = openAiService.classifyIntent(noiDung);
        }
        if ("PRODUCT".equals(intent)) {
            try {
                matchedProducts = sanPhamService.searchSuggestions(noiDung, 5);
            } catch (Exception e) {
                // ignore search errors
            }
        } else if ("STATS".equals(intent)) {
            statsContext = buildStatsContext();
        }

        List<TinNhanAi> history = tinNhanRepo.findByMaHoiThoaiOrderByNgayTaoAsc(maHoiThoai);

        StringBuilder systemContent = new StringBuilder();
        systemContent.append("Bạn là trợ lý AI của ZestStore - cửa hàng thời trang chuyên bán áo polo cao cấp. ");
        systemContent.append("Hãy trả lời bằng tiếng Việt, thân thiện, giúp khách hàng tư vấn sản phẩm, ");
        systemContent.append("gợi ý size, màu sắc, và giải đáp thắc mắc về đơn hàng.");

        if ("STATS".equals(intent)) {
            systemContent.append("\n\nDỮ LIỆU THỐNG KÊ THẬT CỦA CỬA HÀNG HIỆN TẠI:\n").append(statsContext);
            systemContent.append("\nQUY TẮC BẮT BUỘC:\n");
            systemContent.append("1. Hãy trả lời dựa CHỈ trên dữ liệu thống kê thực tế ở trên.\n");
            systemContent.append("2. TUYỆT ĐỐI không được bịa ra, hư cấu số liệu, số lượng, doanh thu nào không có trong dữ liệu.\n");
            systemContent.append("3. Nếu số liệu câu hỏi hỏi đến không nằm trong dữ liệu, hãy lịch sự nói hiện tại chưa có thông tin đó hoặc đề nghị hỏi về doanh thu, số sản phẩm bán được, số đơn hàng.\n");
        } else if (!matchedProducts.isEmpty()) {
            systemContent.append("\n\nDANH SÁCH SẢN PHẨM THẬT ĐANG BÁN TRONG CỬA HÀNG, phù hợp với yêu cầu của khách:\n");
            for (int i = 0; i < matchedProducts.size(); i++) {
                Map<String, Object> p = matchedProducts.get(i);
                systemContent.append((i + 1) + ". ").append(p.get("tenSanPham"))
                    .append(" - Giá: ").append(p.get("gia")).append("đ");
                if (p.get("tongTonKho") != null) {
                    systemContent.append(" - Tồn kho: ").append(p.get("tongTonKho"));
                }
                systemContent.append("\n");
            }
            systemContent.append("\nQUY TẮC BẮT BUỘC:\n");
            systemContent.append("1. CHỈ được gợi ý, tư vấn NHỮNG sản phẩm nằm trong DANH SÁCH trên.\n");
            systemContent.append("2. TUYỆT ĐỐI không được bịa ra, hư cấu, hoặc nhắc đến bất kỳ tên sản phẩm, giá, mã sản phẩm nào không có trong danh sách.\n");
            systemContent.append("3. DANH SÁCH trên là các sản phẩm THẬT đang bán, KHỚP với yêu cầu của khách. BẮT BUỘC phải gợi ý ít nhất 1-2 sản phẩm trong danh sách này.\n");
            systemContent.append("4. TUYỆT ĐỐI không được nói 'không có sản phẩm', 'cửa hàng chưa có', 'không tìm thấy', hay 'không khớp' khi danh sách đã có sản phẩm. Nếu khách nói 'không có áo polo trắng' nhưng danh sách có áo polo trắng, hãy trả lời rằng áo polo trắng CÓ SẴN.\n");
            systemContent.append("5. Nếu khách hỏi về một sản phẩm cụ thể không có trong danh sách, lịch sự gợi ý sản phẩm TƯƠNG TỰ trong danh sách.\n");
            systemContent.append("6. Không được gợi ý sản phẩm có tồn kho bằng 0.\n");
        } else if ("PRODUCT".equals(intent)) {
            systemContent.append("\n\nQUY TẮC BẮT BUỘC:\n");
            systemContent.append("1. HIỆN TẠI KHÔNG có sản phẩm nào trong cửa hàng khớp với yêu cầu của khách.\n");
            systemContent.append("2. TUYỆT ĐỐI không được bịa ra, hư cấu bất kỳ sản phẩm, giá cả, mã sản phẩm nào.\n");
            systemContent.append("3. Hãy lịch sự thông báo cửa hàng chưa có sản phẩm phù hợp, mời khách mô tả lại nhu cầu khác, hoặc gợi ý khách tham khảo danh mục sản phẩm có sẵn.");
        } else {
            systemContent.append("\n\nQUY TẮC BẮT BUỘC:\n");
            systemContent.append("1. Đây là câu chào hỏi hoặc câu hỏi chung, KHÔNG liên quan đến việc tìm mua sản phẩm cụ thể.\n");
            systemContent.append("2. Hãy trả lời thân thiện, tự nhiên theo đúng nội dung câu hỏi, KHÔNG được cố ép gợi ý sản phẩm.\n");
            systemContent.append("3. Nếu khách hỏi chào hỏi (hello, xin chào...), hãy chào lại và hỏi xem khách cần tư vấn gì.\n");
            systemContent.append("4. Chỉ khi khách thực sự nhắc đến nhu cầu mua sản phẩm, hãy mời khách nói rõ sản phẩm họ cần.\n");
        }

        ArrayNode messagesNode = objectMapper.createArrayNode();
        ObjectNode systemNode = messagesNode.addObject();
        systemNode.put("role", "system");
        systemNode.put("content", systemContent.toString());

        for (TinNhanAi msg : history) {
            String role = "ai".equals(msg.getNguoiGui()) ? "assistant" : msg.getNguoiGui();
            ObjectNode msgNode = messagesNode.addObject();
            msgNode.put("role", role);

            if (msg.getHinhAnh() != null && !msg.getHinhAnh().isEmpty()) {
                ArrayNode contentArray = msgNode.putArray("content");
                ObjectNode textPart = contentArray.addObject();
                textPart.put("type", "text");
                textPart.put("text", msg.getNoiDung() != null ? msg.getNoiDung() : "");
                ObjectNode imagePart = contentArray.addObject();
                imagePart.put("type", "image_url");
                ObjectNode imageUrl = imagePart.putObject("image_url");
                imageUrl.put("url", msg.getHinhAnh());
            } else {
                msgNode.put("content", msg.getNoiDung() != null ? msg.getNoiDung() : "");
            }
        }

        String reply = openAiService.chat(messagesNode);

        TinNhanAi aiMsg = TinNhanAi.builder()
                .maHoiThoai(maHoiThoai)
                .noiDung(reply)
                .nguoiGui("ai")
                .build();
        if (!matchedProducts.isEmpty()) {
            try {
                aiMsg.setSanPham(objectMapper.writeValueAsString(matchedProducts));
            } catch (Exception e) {
                // ignore serialization errors
            }
        }
        tinNhanRepo.save(aiMsg);

        Map<String, Object> result = new HashMap<>();
        result.put("reply", reply);
        result.put("maHoiThoai", maHoiThoai);
        result.put("products", matchedProducts);
        return result;
    }

    private String buildStatsContext() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfMonth = now.toLocalDate().withDayOfMonth(1).atStartOfDay();
        LocalDateTime startOfYear = now.toLocalDate().withDayOfYear(1).atStartOfDay();
        LocalDateTime endNow = now;

        StringBuilder sb = new StringBuilder();
        try {
            Long productsSoldMonth = mucDonHangRepo.countProductsSoldInRange(startOfMonth, endNow);
            Long productsSoldYear = mucDonHangRepo.countProductsSoldInRange(startOfYear, endNow);
            Long ordersThisMonth = donHangRepo.countByNgayDatBetween(startOfMonth, endNow);
            BigDecimal revenueThisMonth = donHangRepo.sumRevenueByDateRange(startOfMonth, endNow);
            BigDecimal revenueThisYear = donHangRepo.sumRevenueByDateRange(startOfYear, endNow);
            Long fiveStarAll = danhGiaRepo.countBySoSaoAndNgayXoaIsNull(5);
            Long allReviews = danhGiaRepo.countAllReviews();
            Long fiveStarThisMonth = danhGiaRepo.countFiveStarReviewsInRange(startOfMonth, endNow);

            sb.append("- Số sản phẩm bán được tháng này: ").append(productsSoldMonth == null ? 0 : productsSoldMonth).append("\n");
            sb.append("- Số sản phẩm bán được từ đầu năm đến nay: ").append(productsSoldYear == null ? 0 : productsSoldYear).append("\n");
            sb.append("- Số đơn hàng tháng này: ").append(ordersThisMonth == null ? 0 : ordersThisMonth).append("\n");
            sb.append("- Doanh thu tháng này: ").append(revenueThisMonth == null ? "0" : revenueThisMonth).append(" VND\n");
            sb.append("- Doanh thu từ đầu năm đến nay: ").append(revenueThisYear == null ? "0" : revenueThisYear).append(" VND\n");
            sb.append("- Số sản phẩm được đánh giá 5 sao: ").append(fiveStarAll == null ? 0 : fiveStarAll).append("\n");
            sb.append("- Trong đó 5 sao được thêm tháng này: ").append(fiveStarThisMonth == null ? 0 : fiveStarThisMonth).append("\n");
            sb.append("- Tổng số lượt đánh giá: ").append(allReviews == null ? 0 : allReviews).append("\n");

            List<Object[]> best = mucDonHangRepo.findBestSellingProductsInRange(startOfMonth, endNow, PageRequest.of(0, 5));
            if (!best.isEmpty()) {
                sb.append("- Top sản phẩm bán chạy tháng này:\n");
                for (Object[] row : best) {
                    sb.append("  + ").append(row[1]).append(": ").append(row[3]).append(" cái\n");
                }
            } else {
                sb.append("- Chưa có dữ liệu sản phẩm bán chạy tháng này.\n");
            }
        } catch (Exception e) {
            sb.append("- Đang tạm thời không truy xuất được số liệu chi tiết, hãy trả lời chung chung.\n");
        }
        return sb.toString();
    }

    @Transactional
    public void deleteConversation(Integer maHoiThoai) {
        List<TinNhanAi> messages = tinNhanRepo.findByMaHoiThoaiOrderByNgayTaoAsc(maHoiThoai);
        tinNhanRepo.deleteAll(messages);
        hoiThoaiRepo.deleteById(maHoiThoai);
    }
}
