package com.example.zeststore.controller;

import com.example.zeststore.service.YeuCauTraHangService;
import com.example.zeststore.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class YeuCauTraHangController {

    private final YeuCauTraHangService yeuCauTraHangService;
    private final UserService userService;

    @GetMapping("/api/return-requests")
    public ResponseEntity<?> getMyRequests(Authentication auth) {
        return ResponseEntity.ok(yeuCauTraHangService.getUserRequests(
                userService.getUserIdFromAuth(auth)));
    }

    @GetMapping("/api/admin/return-requests")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<?> getAllRequests(
            @RequestParam(required = false) Integer trangThai) {
        if (trangThai != null) {
            return ResponseEntity.ok(yeuCauTraHangService.getRequestsByStatus(trangThai));
        }
        return ResponseEntity.ok(yeuCauTraHangService.getAllRequests());
    }

    @GetMapping("/api/admin/return-requests/count")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<?> countPending() {
        return ResponseEntity.ok(Map.of("count", yeuCauTraHangService.countByTrangThai(1)));
    }

    @GetMapping("/api/admin/return-requests/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<?> getRequestDetail(@PathVariable Integer id) {
        return ResponseEntity.ok(yeuCauTraHangService.getRequestById(id));
    }

    @PutMapping("/api/admin/return-requests/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<?> approveReturn(Authentication auth, @PathVariable Integer id) {
        return ResponseEntity.ok(yeuCauTraHangService.approveReturn(
                id, userService.getUserIdFromAuth(auth)));
    }

    @PutMapping("/api/admin/return-requests/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<?> rejectReturn(Authentication auth, @PathVariable Integer id,
                                           @RequestBody(required = false) Map<String, String> body) {
        return ResponseEntity.ok(yeuCauTraHangService.rejectReturn(
                id, userService.getUserIdFromAuth(auth),
                body != null ? body.get("lyDoTuChoi") : null));
    }
}
