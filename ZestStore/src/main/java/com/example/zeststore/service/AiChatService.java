package com.example.zeststore.service;

import com.example.zeststore.entity.HoiThoaiAi;
import com.example.zeststore.entity.TinNhanAi;
import com.example.zeststore.repository.HoiThoaiAiRepository;
import com.example.zeststore.repository.TinNhanAiRepository;
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

    public List<HoiThoaiAi> getConversations(Integer maNguoiDung) {
        return hoiThoaiRepo.findByMaNguoiDungOrderByNgayTaoDesc(maNguoiDung);
    }

    public List<TinNhanAi> getMessages(Integer maHoiThoai) {
        return tinNhanRepo.findByMaHoiThoaiOrderByNgayTaoAsc(maHoiThoai);
    }

    @Transactional
    public Map<String, Object> sendMessage(Integer maNguoiDung, String noiDung, Integer maHoiThoai) {
        if (maHoiThoai == null) {
            HoiThoaiAi hoiThoai = HoiThoaiAi.builder()
                    .maNguoiDung(maNguoiDung)
                    .tieuDe(noiDung.length() > 50 ? noiDung.substring(0, 50) + "..." : noiDung)
                    .build();
            hoiThoai = hoiThoaiRepo.save(hoiThoai);
            maHoiThoai = hoiThoai.getMaHoiThoai();
        }

        TinNhanAi userMsg = TinNhanAi.builder()
                .maHoiThoai(maHoiThoai)
                .noiDung(noiDung)
                .nguoiGui("user")
                .build();
        tinNhanRepo.save(userMsg);

        List<TinNhanAi> history = tinNhanRepo.findByMaHoiThoaiOrderByNgayTaoAsc(maHoiThoai);
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content",
                "Bạn là trợ lý AI của ZestStore - cửa hàng thời trang chuyên bán áo polo cao cấp. " +
                "Hãy trả lời bằng tiếng Việt, thân thiện, giúp khách hàng tư vấn sản phẩm, " +
                "gợi ý size, màu sắc, và giải đáp thắc mắc về đơn hàng."));
        for (TinNhanAi msg : history) {
            messages.add(Map.of("role", msg.getNguoiGui(), "content", msg.getNoiDung()));
        }

        String reply = openAiService.chat(messages);

        TinNhanAi aiMsg = TinNhanAi.builder()
                .maHoiThoai(maHoiThoai)
                .noiDung(reply)
                .nguoiGui("ai")
                .build();
        tinNhanRepo.save(aiMsg);

        Map<String, Object> result = new HashMap<>();
        result.put("reply", reply);
        result.put("maHoiThoai", maHoiThoai);
        return result;
    }

    @Transactional
    public void deleteConversation(Integer maHoiThoai) {
        List<TinNhanAi> messages = tinNhanRepo.findByMaHoiThoaiOrderByNgayTaoAsc(maHoiThoai);
        tinNhanRepo.deleteAll(messages);
        hoiThoaiRepo.deleteById(maHoiThoai);
    }
}
