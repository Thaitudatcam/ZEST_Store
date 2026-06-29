package com.example.zeststore.controller;

import com.example.zeststore.entity.TinNhanHoTro;
import com.example.zeststore.repository.TinNhanHoTroRepository;
import com.example.zeststore.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatHoTroController {

    private final TinNhanHoTroRepository repository;
    private final UserService userService;

    @GetMapping("/messages")
    public ResponseEntity<?> getMyMessages(Authentication auth) {
        Integer userId = userService.getUserIdFromAuth(auth);
        List<TinNhanHoTro> messages = repository.findByNguoiDung_MaNguoiDungOrderByNgayTaoAsc(userId);
        repository.findByNguoiDung_MaNguoiDungAndDaDocFalse(userId)
                .stream().filter(m -> "ADMIN".equals(m.getVaiTro()))
                .forEach(m -> { m.setDaDoc(true); repository.save(m); });
        return ResponseEntity.ok(messages);
    }

    @PutMapping("/read")
    public ResponseEntity<?> markRead(Authentication auth) {
        Integer userId = userService.getUserIdFromAuth(auth);
        repository.findByNguoiDung_MaNguoiDungAndDaDocFalse(userId)
                .stream().filter(m -> "ADMIN".equals(m.getVaiTro()))
                .forEach(m -> { m.setDaDoc(true); repository.save(m); });
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/messages")
    public ResponseEntity<?> sendMessage(Authentication auth, @RequestBody Map<String, String> body) {
        Integer userId = userService.getUserIdFromAuth(auth);
        TinNhanHoTro msg = TinNhanHoTro.builder()
                .nguoiDung(userService.getUserById(userId))
                .noiDung(body.get("noiDung"))
                .vaiTro("USER")
                .build();
        return ResponseEntity.ok(repository.save(msg));
    }

    @GetMapping("/unread")
    public ResponseEntity<?> getUnreadCount(Authentication auth) {
        Integer userId = userService.getUserIdFromAuth(auth);
        long count = repository.countByNguoiDung_MaNguoiDungAndVaiTroAndDaDocFalse(userId, "ADMIN");
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/admin/conversations")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getConversations() {
        List<Integer> userIds = repository.findDistinctUserIdsByOrderByLatestMessageDesc();
        return ResponseEntity.ok(userIds);
    }

    @GetMapping("/admin/unread-counts")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUnreadCounts() {
        List<Object[]> rows = repository.countUnreadForAdmin();
        Map<Integer, Long> counts = new java.util.HashMap<>();
        for (Object[] row : rows) {
            counts.put((Integer) row[0], (Long) row[1]);
        }
        return ResponseEntity.ok(counts);
    }

    @GetMapping("/admin/messages/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUserMessages(@PathVariable Integer userId) {
        List<TinNhanHoTro> messages = repository.findByNguoiDung_MaNguoiDungOrderByNgayTaoAsc(userId);
        repository.findByNguoiDung_MaNguoiDungAndDaDocFalse(userId)
                .stream().filter(m -> "USER".equals(m.getVaiTro()))
                .forEach(m -> { m.setDaDoc(true); repository.save(m); });
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/admin/reply/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> reply(Authentication auth, @PathVariable Integer userId, @RequestBody Map<String, String> body) {
        Integer adminId = userService.getUserIdFromAuth(auth);
        TinNhanHoTro msg = TinNhanHoTro.builder()
                .nguoiDung(userService.getUserById(userId))
                .noiDung(body.get("noiDung"))
                .vaiTro("ADMIN")
                .build();
        return ResponseEntity.ok(repository.save(msg));
    }

    @DeleteMapping("/messages/{maTinNhan}")
    public ResponseEntity<?> deleteMessage(Authentication auth, @PathVariable Integer maTinNhan) {
        Integer userId = userService.getUserIdFromAuth(auth);
        TinNhanHoTro msg = repository.findById(maTinNhan).orElse(null);
        if (msg == null) return ResponseEntity.notFound().build();
        if ("USER".equals(msg.getVaiTro())) {
            if (!msg.getNguoiDung().getMaNguoiDung().equals(userId))
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } else if ("ADMIN".equals(msg.getVaiTro())) {
            boolean isAdmin = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            if (!isAdmin) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        msg.setDaXoa(true);
        return ResponseEntity.ok(repository.save(msg));
    }
}
