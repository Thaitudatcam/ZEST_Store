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
            body.put("max_tokens", 500);
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
}
