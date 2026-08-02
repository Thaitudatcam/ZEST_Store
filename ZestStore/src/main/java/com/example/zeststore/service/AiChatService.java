package com.example.zeststore.service;

import com.example.zeststore.entity.HoiThoaiAi;
import com.example.zeststore.entity.TinNhanAi;
import com.example.zeststore.repository.HoiThoaiAiRepository;
import com.example.zeststore.repository.TinNhanAiRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AiChatService {

    private final OpenAiService openAiService;
    private final HoiThoaiAiRepository hoiThoaiRepo;
    private final TinNhanAiRepository tinNhanRepo;
    private final SanPhamService sanPhamService;
    private final ObjectMapper objectMapper;

    public List<HoiThoaiAi> getConversations(Integer maNguoiDung) {
        return hoiThoaiRepo.findByMaNguoiDungOrderByNgayTaoDesc(maNguoiDung);
    }

    public List<TinNhanAi> getMessages(Integer maHoiThoai) {
        return tinNhanRepo.findByMaHoiThoaiOrderByNgayTaoAsc(maHoiThoai);
    }

    @Transactional
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
        if (noiDung != null && !noiDung.isBlank()) {
            try {
                matchedProducts = sanPhamService.searchSuggestions(noiDung, 5);
            } catch (Exception e) {
                // ignore search errors
            }
        }

        List<TinNhanAi> history = tinNhanRepo.findByMaHoiThoaiOrderByNgayTaoAsc(maHoiThoai);

        StringBuilder systemContent = new StringBuilder();
        systemContent.append("Bạn là trợ lý AI của ZestStore - cửa hàng thời trang chuyên bán áo polo cao cấp. ");
        systemContent.append("Hãy trả lời bằng tiếng Việt, thân thiện, giúp khách hàng tư vấn sản phẩm, ");
        systemContent.append("gợi ý size, màu sắc, và giải đáp thắc mắc về đơn hàng.");

        if (!matchedProducts.isEmpty()) {
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
        } else {
            systemContent.append("\n\nQUY TẮC BẮT BUỘC:\n");
            systemContent.append("1. HIỆN TẠI KHÔNG có sản phẩm nào trong cửa hàng khớp với yêu cầu của khách.\n");
            systemContent.append("2. TUYỆT ĐỐI không được bịa ra, hư cấu bất kỳ sản phẩm, giá cả, mã sản phẩm nào.\n");
            systemContent.append("3. Hãy lịch sự thông báo cửa hàng chưa có sản phẩm phù hợp, mời khách mô tả lại nhu cầu khác, hoặc gợi ý khách tham khảo danh mục sản phẩm có sẵn.");
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
        tinNhanRepo.save(aiMsg);

        Map<String, Object> result = new HashMap<>();
        result.put("reply", reply);
        result.put("maHoiThoai", maHoiThoai);
        result.put("products", matchedProducts);
        return result;
    }

    @Transactional
    public void deleteConversation(Integer maHoiThoai) {
        List<TinNhanAi> messages = tinNhanRepo.findByMaHoiThoaiOrderByNgayTaoAsc(maHoiThoai);
        tinNhanRepo.deleteAll(messages);
        hoiThoaiRepo.deleteById(maHoiThoai);
    }
}
