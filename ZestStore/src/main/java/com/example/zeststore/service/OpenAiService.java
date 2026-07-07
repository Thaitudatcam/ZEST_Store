package com.example.zeststore.service;

import com.example.zeststore.config.AiConfig;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OpenAiService {

    private final AiConfig aiConfig;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public String chat(List<Map<String, String>> messages) {
        try {
            String url = "https://api.openai.com/v1/chat/completions";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(aiConfig.getApiKey());

            ObjectNode body = objectMapper.createObjectNode();
            body.put("model", aiConfig.getModel() != null ? aiConfig.getModel() : "gpt-4o-mini");

            ArrayNode messagesNode = body.putArray("messages");
            for (Map<String, String> msg : messages) {
                ObjectNode msgNode = messagesNode.addObject();
                msgNode.put("role", msg.get("role"));
                msgNode.put("content", msg.get("content"));
            }

            HttpEntity<String> request = new HttpEntity<>(objectMapper.writeValueAsString(body), headers);
            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    url, HttpMethod.POST, request, JsonNode.class);

            if (response.getBody() != null) {
                return response.getBody()
                        .path("choices").get(0)
                        .path("message").path("content")
                        .asText();
            }
            return "Xin lỗi, tôi không thể trả lời ngay lúc này.";
        } catch (Exception e) {
            e.printStackTrace();
            return "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.";
        }
    }
}
