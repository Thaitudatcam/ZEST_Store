package com.example.zeststore.service;

import com.example.zeststore.repository.DanhMucRepository;
import com.example.zeststore.repository.ThuongHieuRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProductAiService {

    private final OpenAiService openAiService;
    private final DanhMucRepository danhMucRepo;
    private final ThuongHieuRepository thuongHieuRepo;
    private final ObjectMapper objectMapper;

    public String generateDescription(String tenSanPham, Integer maDanhMuc, Integer maThuongHieu) {
        String tenDanhMuc = "";
        if (maDanhMuc != null) {
            tenDanhMuc = danhMucRepo.findById(maDanhMuc)
                    .map(d -> d.getTenDanhMuc()).orElse("");
        }
        String tenThuongHieu = "";
        if (maThuongHieu != null) {
            tenThuongHieu = thuongHieuRepo.findById(maThuongHieu)
                    .map(t -> t.getTenThuongHieu()).orElse("");
        }

        StringBuilder prompt = new StringBuilder();
        prompt.append("Hãy viết mô tả sản phẩm thời trang bằng tiếng Việt, 2-3 câu, ");
        prompt.append("nêu bật đặc điểm, phong cách, chất liệu. ");
        prompt.append("Chỉ trả về phần mô tả, không thêm lời dẫn.");
        prompt.append("\n\nTên sản phẩm: ").append(tenSanPham);
        if (!tenDanhMuc.isEmpty()) prompt.append("\nDanh mục: ").append(tenDanhMuc);
        if (!tenThuongHieu.isEmpty()) prompt.append("\nThương hiệu: ").append(tenThuongHieu);

        ArrayNode messages = objectMapper.createArrayNode();
        ObjectNode userNode = messages.addObject();
        userNode.put("role", "user");
        userNode.put("content", prompt.toString());

        return openAiService.chat(messages);
    }
}
