package com.example.zeststore.controller;

import com.example.zeststore.dto.request.OrderRequest;
import com.example.zeststore.dto.request.StatusUpdateRequest;
import com.example.zeststore.service.DonHangService;
import com.example.zeststore.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class DonHangController {

    private final DonHangService donHangService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<?> getMyOrders(Authentication auth) {
        Integer userId = userService.getUserByEmail(auth.getName()).getMaNguoiDung();
        return ResponseEntity.ok(donHangService.getOrdersByUser(userService.getUserIdFromAuth(auth)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderDetail(@PathVariable Integer id, Authentication auth) {
        return ResponseEntity.ok(donHangService.getOrderDetailForUser(id, userService.getUserIdFromAuth(auth)));
    }

    @PostMapping
    public ResponseEntity<?> placeOrder(Authentication auth, @Valid @RequestBody OrderRequest request) {
        return ResponseEntity.ok(donHangService.placeOrder(userService.getUserIdFromAuth(auth), request));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(Authentication auth, @PathVariable Integer id) {
        return ResponseEntity.ok(donHangService.cancelOrder(id, userService.getUserIdFromAuth(auth)));
    }

    @PutMapping("/{id}/confirm-received")
    public ResponseEntity<?> confirmReceived(Authentication auth, @PathVariable Integer id) {
        return ResponseEntity.ok(donHangService.confirmReceived(id, userService.getUserIdFromAuth(auth)));
    }

    @PostMapping("/{id}/return-request")
    public ResponseEntity<?> requestReturn(Authentication auth, @PathVariable Integer id,
                                            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(donHangService.requestReturn(
                id, userService.getUserIdFromAuth(auth), body.get("lyDo")));
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllOrders() {
        return ResponseEntity.ok(donHangService.getAllOrders());
    }

    @PutMapping("/admin/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateStatus(@PathVariable Integer id, @Valid @RequestBody StatusUpdateRequest request,
                                           Authentication auth) {
        return ResponseEntity.ok(donHangService.updateOrderStatus(
                id, request.getTrangThai(), userService.getUserIdFromAuth(auth)));
    }
}
