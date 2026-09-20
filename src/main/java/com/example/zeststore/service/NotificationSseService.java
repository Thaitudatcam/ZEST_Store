package com.example.zeststore.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * SSE registry for notifications, keyed by maNguoiDung (the recipient).
 * Modeled on {@link OrderSseService} so an admin/staff client subscribes to
 * their own channel and receives pushed notifications in real time.
 */
@Slf4j
@Service
public class NotificationSseService {

    private final Map<Integer, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter addEmitter(Integer maNguoiDung) {
        SseEmitter emitter = new SseEmitter(300_000L); // 5 min, client reconnects

        emitters.computeIfAbsent(maNguoiDung, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(maNguoiDung, emitter));
        emitter.onTimeout(() -> removeEmitter(maNguoiDung, emitter));
        emitter.onError(e -> removeEmitter(maNguoiDung, emitter));

        return emitter;
    }

    /** Push a notification payload to a single user's channel. */
    public void sendNotification(Integer maNguoiDung, Map<String, Object> payload) {
        List<SseEmitter> userEmitters = emitters.get(maNguoiDung);
        if (userEmitters == null || userEmitters.isEmpty()) return;

        List<SseEmitter> deadEmitters = new java.util.ArrayList<>();

        for (SseEmitter emitter : userEmitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("notification")
                        .data(payload));
            } catch (IOException e) {
                deadEmitters.add(emitter);
                log.debug("Removing disconnected notification SSE emitter for user {}", maNguoiDung);
            } catch (IllegalStateException e) {
                // Some servlet containers expose an unusable emitter as a generic
                // illegal-state failure instead of IOException.
                deadEmitters.add(emitter);
                log.debug("Removing illegal-state notification SSE emitter for user {}", maNguoiDung);
            }
        }

        for (SseEmitter dead : deadEmitters) {
            removeEmitter(maNguoiDung, dead);
        }
    }

    private void removeEmitter(Integer maNguoiDung, SseEmitter emitter) {
        List<SseEmitter> userEmitters = emitters.get(maNguoiDung);
        if (userEmitters != null) {
            userEmitters.remove(emitter);
            if (userEmitters.isEmpty()) {
                emitters.remove(maNguoiDung);
            }
        }
    }
}
