package com.example.zeststore.controller;

import com.example.zeststore.dto.request.OrderRequest;
import com.example.zeststore.dto.request.RefundRequest;
import com.example.zeststore.dto.request.ReturnRequest;
import com.example.zeststore.dto.request.StatusUpdateRequest;
import com.example.zeststore.service.DonHangService;
import com.example.zeststore.service.OrderSseService;
import com.example.zeststore.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import jakarta.servlet.http.HttpServletRequest;

import java.time.LocalDate;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class DonHangController {

    private final DonHangService donHangService;
    private final UserService userService;
    private final OrderSseService orderSseService;
    private static final Logger log = LoggerFactory.getLogger(DonHangController.class);
    private final ConcurrentHashMap<String, LookupWindow> lookupWindows = new ConcurrentHashMap<>();

    @GetMapping
    public ResponseEntity<?> getMyOrders(Authentication auth) {
        return ResponseEntity.ok(donHangService.getOrdersByUser(userService.getUserIdFromAuth(auth)));
    }

    @GetMapping("/lookup")
    public ResponseEntity<?> lookupOrder(@RequestParam String maDonHangCode, @RequestParam String email,
                                         HttpServletRequest request) {
        String code = maDonHangCode == null ? "" : maDonHangCode.trim();
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase(java.util.Locale.ROOT);
        if (code.isBlank() || code.length() > 20 || normalizedEmail.isBlank() || normalizedEmail.length() > 254) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mã đơn hàng hoặc email không hợp lệ"));
        }
        String key = request.getRemoteAddr() == null ? "unknown" : request.getRemoteAddr();
        if (lookupWindows.size() > 10_000) lookupWindows.clear();
        LookupWindow window = lookupWindows.computeIfAbsent(key, ignored -> new LookupWindow());
        if (!window.allow()) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("message", "Bạn tra cứu quá nhiều lần. Vui lòng thử lại sau một phút"));
        }
        return ResponseEntity.ok(donHangService.lookupOrder(code, normalizedEmail));
    }

    private static final class LookupWindow {
        private long startedAt = System.currentTimeMillis();
        private int attempts;

        synchronized boolean allow() {
            long now = System.currentTimeMillis();
            if (now - startedAt >= 60_000) {
                startedAt = now;
                attempts = 0;
            }
            return ++attempts <= 10;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderDetail(@PathVariable Integer id, Authentication auth) {
        return ResponseEntity.ok(donHangService.getOrderDetailForUser(id, userService.getUserIdFromAuth(auth)));
    }

    @PostMapping
    public ResponseEntity<?> placeOrder(Authentication auth, @Valid @RequestBody OrderRequest request) {
        return ResponseEntity.ok(donHangService.placeOrder(userService.getUserIdFromAuth(auth), request));
    }

    @GetMapping("/admin/{id}/detail")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<?> getOrderDetailAdmin(@PathVariable Integer id) {
        return ResponseEntity.ok(donHangService.getOrderDetail(id));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(Authentication auth, @PathVariable Integer id) {
        return ResponseEntity.ok(donHangService.cancelOrder(id, userService.getUserIdFromAuth(auth)));
    }

    @PutMapping("/{id}/confirm-received")
    public ResponseEntity<?> confirmReceived(Authentication auth, @PathVariable Integer id) {
        return ResponseEntity.ok(donHangService.confirmReceived(id, userService.getUserIdFromAuth(auth)));
    }

    @PutMapping("/{id}/return-request")
    public ResponseEntity<?> requestReturn(Authentication auth, @PathVariable Integer id,
                                            @Valid @RequestBody ReturnRequest request) {
        return ResponseEntity.ok(donHangService.requestReturn(
                id, userService.getUserIdFromAuth(auth), request.getLyDo()));
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<?> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Integer loaiDonHang,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Integer trangThai,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tuNgay,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate denNgay) {
        return ResponseEntity.ok(donHangService.getAllOrders(page, size, loaiDonHang, q, trangThai, tuNgay, denNgay));
    }

    @GetMapping("/admin/detail/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<?> getAdminOrderDetail(@PathVariable Integer id) {
        return ResponseEntity.ok(donHangService.getOrderDetail(id));
    }

    @GetMapping(value = "/{orderId}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamOrderStatus(@PathVariable Integer orderId, Authentication auth) {
        // The stream contains status notes and recipient information.  Customers
        // may subscribe only to their own order; staff can monitor any order.
        if (!authHasRole(auth, "ADMIN") && !authHasRole(auth, "STAFF")) {
            donHangService.getOrderDetailForUser(orderId, userService.getUserIdFromAuth(auth));
        }
        SseEmitter emitter = orderSseService.addEmitter(orderId);
        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data(Map.of("orderId", orderId, "message", "Connected")));
        } catch (Exception e) {
            emitter.completeWithError(e);
        }
        return emitter;
    }

    @PutMapping("/admin/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<?> updateStatus(@PathVariable Integer id, @Valid @RequestBody StatusUpdateRequest request,
                                           Authentication auth) {
        return ResponseEntity.ok(donHangService.updateOrderStatus(
                id, request.getTrangThai(), request.getGhiChu(), request.isThongBaoKhachHang(), userService.getUserIdFromAuth(auth)));
    }

    @PutMapping("/admin/{id}/refund")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<?> recordRefund(@PathVariable Integer id, @Valid @RequestBody RefundRequest request,
                                          Authentication auth) {
        return ResponseEntity.ok(donHangService.recordRefund(
                id, request.getMaGiaoDichHoanTien(), request.getGhiChu(), userService.getUserIdFromAuth(auth)));
    }

    @PutMapping("/admin/{id}/inventory-reconciliation")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<?> reconcileLegacyInventory(@PathVariable Integer id,
                                                        @RequestBody Map<String, Boolean> body) {
        Boolean stockWasDeducted = body.get("stockWasDeducted");
        if (stockWasDeducted == null) {
            throw new IllegalArgumentException("stockWasDeducted is required");
        }
        return ResponseEntity.ok(donHangService.reconcileLegacyInventory(id, stockWasDeducted));
    }

    @GetMapping("/admin/{id}/print")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<?> getPrintData(@PathVariable Integer id, Authentication auth) {
        return ResponseEntity.ok(donHangService.getOrderPrintData(id, authHasRole(auth, "ADMIN")));
    }

    @PostMapping("/admin/{id}/print")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<?> registerPrint(@PathVariable Integer id, Authentication auth) {
        return ResponseEntity.ok(donHangService.registerPrint(id, authHasRole(auth, "ADMIN")));
    }

    private boolean authHasRole(Authentication auth, String role) {
        if (auth == null) return false;
        String prefix = "ROLE_" + role;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(prefix) || a.getAuthority().equals(role));
    }
}
