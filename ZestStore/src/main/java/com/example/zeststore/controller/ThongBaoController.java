package com.example.zeststore.controller;

import com.example.zeststore.service.NotificationSseService;
import com.example.zeststore.service.ThongBaoService;
import com.example.zeststore.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

/**
 * Admin/Staff notification endpoints.
 * <ul>
 *   <li>REST: list, unread count, mark read</li>
 *   <li>SSE: {@code GET /api/notifications/stream} for realtime push</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','STAFF')")
public class ThongBaoController {

    private final ThongBaoService thongBaoService;
    private final UserService userService;
    private final NotificationSseService notificationSseService;

    @GetMapping
    public ResponseEntity<?> list(Authentication auth) {
        Integer userId = userService.getUserIdFromAuth(auth);
        return ResponseEntity.ok(thongBaoService.getByUser(userId));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> unreadCount(Authentication auth) {
        Integer userId = userService.getUserIdFromAuth(auth);
        return ResponseEntity.ok(thongBaoService.countUnread(userId));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Integer id, Authentication auth) {
        Integer userId = userService.getUserIdFromAuth(auth);
        thongBaoService.markAsRead(id, userId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllRead(Authentication auth) {
        Integer userId = userService.getUserIdFromAuth(auth);
        int updated = thongBaoService.markAllRead(userId);
        return ResponseEntity.ok(Map.of("success", true, "updated", updated));
    }

    /**
     * Realtime channel for the signed-in user. Clients subscribe with EventSource
     * and listen for the named event {@code "notification"}.
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(Authentication auth) {
        Integer userId = userService.getUserIdFromAuth(auth);
        SseEmitter emitter = notificationSseService.addEmitter(userId);
        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data(Map.of("userId", userId, "message", "Connected")));
        } catch (Exception e) {
            emitter.completeWithError(e);
        }
        return emitter;
    }
}
