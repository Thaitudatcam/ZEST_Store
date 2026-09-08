package com.example.zeststore.controller;

import com.example.zeststore.entity.ThuocTinh;
import com.example.zeststore.service.ThuocTinhService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/thuoc-tinh")
@RequiredArgsConstructor
public class ThuocTinhController {

    private final ThuocTinhService thuocTinhService;

    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam(required = false) String loai) {
        if (loai != null && !loai.isBlank()) {
            return ResponseEntity.ok(thuocTinhService.getByLoai(loai));
        }
        return ResponseEntity.ok(thuocTinhService.getAll());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> create(@RequestBody Map<String, String> body) {
        String loai = body.get("loaiThuocTinh");
        String giaTri = body.get("giaTri");
        if (loai == null || loai.isBlank() || giaTri == null || giaTri.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Thiếu loaiThuocTinh hoặc giaTri"));
        }
        ThuocTinh created = thuocTinhService.create(loai.trim(), giaTri.trim());
        return ResponseEntity.ok(created);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        thuocTinhService.delete(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
