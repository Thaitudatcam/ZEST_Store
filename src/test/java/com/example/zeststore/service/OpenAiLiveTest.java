package com.example.zeststore.service;

import com.example.zeststore.config.AiConfig;
import com.example.zeststore.config.RestTemplateConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import java.util.Properties;
import static org.junit.jupiter.api.Assertions.*;

@EnabledIfEnvironmentVariable(named = "ZEST_RUN_AI_LIVE", matches = "true")
class OpenAiLiveTest {
    @Test void configuredJavaClientCanAnswerProductQuestion() throws Exception {
        Properties props = new Properties();
        try (var input = getClass().getResourceAsStream("/application-local.properties")) {
            assertNotNull(input);
            props.load(input);
        }
        var config = new AiConfig();
        config.setApiKey(props.getProperty("ai.openai.api-key"));
        config.setModel("gpt-4o-mini");
        var mapper = new ObjectMapper();
        var service = new OpenAiService(config, new RestTemplateConfig().restTemplate(), mapper);
        var messages = mapper.createArrayNode();
        messages.addObject().put("role", "system").put("content", "Bạn là trợ lý ZestStore. Sản phẩm rẻ nhất là Áo Polo Xanh Đen Phối Cổ Thêu, 199.000đ, mã SP0027. Trả lời ngắn bằng tiếng Việt.");
        messages.addObject().put("role", "user").put("content", "sản phẩm rẻ nhất");
        String reply = service.chat(messages);
        assertNotNull(reply);
        assertFalse(reply.contains("Xin lỗi"), "Java OpenAI client returned an error fallback; inspect HTTP/connection log");
        assertTrue(reply.contains("199") || reply.contains("SP0027"));
    }
}
