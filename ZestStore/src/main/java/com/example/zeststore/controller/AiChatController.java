package com.example.zeststore.controller;

import com.example.zeststore.service.AiChatService;
import com.example.zeststore.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiChatController {

    private final AiChatService aiChatService;
    private final UserService userService;

    @GetMapping("/conversations")
    public ResponseEntity<?> getConversations(Authentication auth) {
        Integer userId = userService.getUserIdFromAuth(auth);
        return ResponseEntity.ok(aiChatService.getConversations(userId));
    }

    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<?> getMessages(@PathVariable Integer id) {
        return ResponseEntity.ok(aiChatService.getMessages(id));
    }

    @PostMapping("/chat")
    public ResponseEntity<?> sendMessage(Authentication auth, @RequestBody Map<String, Object> body) {
        Integer userId = userService.getUserIdFromAuth(auth);
        String noiDung = (String) body.get("noiDung");
        Integer maHoiThoai = body.get("maHoiThoai") != null ? (Integer) body.get("maHoiThoai") : null;
        String hinhAnh = (String) body.get("hinhAnh");
        return ResponseEntity.ok(aiChatService.sendMessage(userId, noiDung, maHoiThoai, hinhAnh));
    }

    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<?> deleteConversation(@PathVariable Integer id) {
        aiChatService.deleteConversation(id);
        return ResponseEntity.ok(Map.of("message", "Xóa hội thoại thành công"));
    }
}
