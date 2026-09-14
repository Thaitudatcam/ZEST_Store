package com.example.zeststore.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
public class OrderSseService {

    private final Map<Integer, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter addEmitter(Integer orderId) {
        SseEmitter emitter = new SseEmitter(300_000L);

        emitters.computeIfAbsent(orderId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(orderId, emitter));
        emitter.onTimeout(() -> removeEmitter(orderId, emitter));
        emitter.onError(e -> removeEmitter(orderId, emitter));

        return emitter;
    }

    public void sendOrderUpdate(Integer orderId, Map<String, Object> payload) {
        List<SseEmitter> orderEmitters = emitters.get(orderId);
        if (orderEmitters == null || orderEmitters.isEmpty()) return;

        List<SseEmitter> deadEmitters = new java.util.ArrayList<>();

        for (SseEmitter emitter : orderEmitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("order-update")
                        .data(payload));
            } catch (IOException e) {
                deadEmitters.add(emitter);
            }
        }

        for (SseEmitter dead : deadEmitters) {
            removeEmitter(orderId, dead);
        }
    }

    public void sendOrderStatusUpdate(Integer orderId, Integer trangThaiMoi, Integer trangThaiCu,
                                       String nguoiCapNhat, String ghiChu) {
        Map<String, Object> payload = new java.util.LinkedHashMap<>();
        payload.put("orderId", orderId);
        payload.put("trangThaiMoi", trangThaiMoi);
        payload.put("trangThaiCu", trangThaiCu);
        payload.put("nguoiCapNhat", nguoiCapNhat);
        payload.put("ghiChu", ghiChu);
        payload.put("thoiGian", java.time.LocalDateTime.now().toString());
        sendOrderUpdate(orderId, payload);
    }

    private void removeEmitter(Integer orderId, SseEmitter emitter) {
        List<SseEmitter> orderEmitters = emitters.get(orderId);
        if (orderEmitters != null) {
            orderEmitters.remove(emitter);
            if (orderEmitters.isEmpty()) {
                emitters.remove(orderId);
            }
        }
    }
}
