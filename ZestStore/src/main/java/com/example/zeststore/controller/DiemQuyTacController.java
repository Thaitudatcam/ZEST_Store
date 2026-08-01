package com.example.zeststore.controller;

import com.example.zeststore.dto.request.DiemQuyTacRequest;
import com.example.zeststore.service.DiemQuyTacService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class DiemQuyTacController {

    private final DiemQuyTacService diemQuyTacService;

    @GetMapping("/api/diem/quy-tac")
    public ResponseEntity<?> getPublic() {
        return ResponseEntity.ok(diemQuyTacService.getRules());
    }

    @GetMapping("/api/admin/diem-quy-tac")
    public ResponseEntity<?> getAdmin() {
        return ResponseEntity.ok(diemQuyTacService.getRules());
    }

    @PutMapping("/api/admin/diem-quy-tac")
    public ResponseEntity<?> update(@Valid @RequestBody DiemQuyTacRequest request) {
        return ResponseEntity.ok(diemQuyTacService.update(request));
    }
}
