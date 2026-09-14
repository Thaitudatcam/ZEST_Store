package com.example.zeststore.service;

import com.example.zeststore.config.AiConfig;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;



@Slf4j
@Service
@RequiredArgsConstructor
public class OpenAiService {

    private final AiConfig aiConfig;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public String chat(ArrayNode messagesNode) {
        return chat(messagesNode, 500);
    }

    public String chat(ArrayNode messagesNode, int maxTokens) {
        try {
            String key = aiConfig.getApiKey();
            if (key == null || key.isBlank()) {
                log.error("OpenAI API key is null or blank!");
                return "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.";
            }
            String url = "https://api.openai.com/v1/chat/completions";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(key);

            ObjectNode body = objectMapper.createObjectNode();
            body.put("model", aiConfig.getModel() != null ? aiConfig.getModel() : "gpt-4o-mini");
            body.put("max_tokens", maxTokens);
            body.put("temperature", 0.3);
            body.set("messages", messagesNode);

            String jsonBody = objectMapper.writeValueAsString(body);
            log.debug("OpenAI request body: {}", jsonBody);

            HttpEntity<String> request = new HttpEntity<>(jsonBody, headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.POST, request, String.class);

            log.debug("OpenAI response status: {}", response.getStatusCode());

            if (response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode respError = root.path("error");
                if (!respError.isMissingNode()) {
                    log.error("OpenAI API error: {}", respError);
                    return "Xin lỗi, tôi không thể trả lời ngay lúc này.";
                }
                String content = root.path("choices").get(0)
                        .path("message").path("content")
                        .asText();
                if (content != null && !content.isEmpty()) {
                    return content;
                }
            }
            log.warn("OpenAI returned empty response");
            return "Xin lỗi, tôi không thể trả lời ngay lúc này.";
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            log.error("OpenAI HTTP error: {} - {} - body: {}", e.getStatusCode(), e.getMessage(), e.getResponseBodyAsString(), e);
            return "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.";
        } catch (Exception e) {
            log.error("OpenAI call failed: {} - {}", e.getClass().getSimpleName(), e.getMessage(), e);
            return "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.";
        }
    }

    public String classifyIntent(String userMessage) {
        if (userMessage == null || userMessage.isBlank()) return "OTHER";
        try {
            ArrayNode messages = objectMapper.createArrayNode();
            ObjectNode system = messages.addObject();
            system.put("role", "system");
            system.put("content",
                    "Bạn là bộ phân loại ý định của khách hàng. Đọc kỹ câu và chỉ trả lời ĐÚNG MỘT TỪ trong ngoặc.\n"
                    + "Trả về (PRODUCT) nếu khách ĐANG CÓ NHU CẦU tìm mua, xem, tư vấn, gợi ý, hỏi giá, hỏi size/màu, so sánh, hay chọn MỘT SẢN PHẨM CỤ THỂ nào đó trong cửa hàng.\n"
                    + "Trả về (STATS) nếu khách hỏi về số liệu, thống kê, số lượng, thống kê doanh thu, số sản phẩm đã bán, số đơn hàng, sản phẩm bán chạy, sản phẩm được đánh giá 5 sao, số lượng cụ thể của shop. Ví dụ: 'tháng này bán được bao nhiêu sản phẩm?', 'có bao nhiêu sản phẩm đánh giá 5 sao?', 'doanh thu tháng này bao nhiêu?'.\n"
                    + "Trả về (OTHER) nếu câu chỉ là chào hỏi, cảm ơn, hỏi về chính sách đổi trả, trả hàng, vận chuyển, thanh toán, khuyến mãi chung, hoặc bất kỳ câu hỏi chung không nhằm mua một sản phẩm cụ thể và không hỏi về số liệu thống kê.\n"
                    + "Ví dụ: 'có áo polo trắng không?' -> (PRODUCT). 'hello' -> (OTHER). 'có bao nhiêu sản phẩm 5 sao?' -> (STATS). 'tháng này bán bao nhiêu?' -> (STATS). 'tôi muốn trả hàng' -> (OTHER). 'giá áo polo này bao nhiêu?' -> (PRODUCT).\n"
                    + "Ưu tiên: nếu câu vừa có ý tìm mua sản phẩm cụ thể vừa muốn số liệu, hãy chọn (PRODUCT).");
            ObjectNode user = messages.addObject();
            user.put("role", "user");
            user.put("content", userMessage);

            String result = chat(messages, 10);
            if (result == null) return "OTHER";
            if (result.contains("PRODUCT")) return "PRODUCT";
            if (result.contains("STATS")) return "STATS";
            return "OTHER";
        } catch (Exception e) {
            log.warn("Intent classification failed, defaulting to OTHER: {}", e.getMessage());
            return "OTHER";
        }
    }
}
