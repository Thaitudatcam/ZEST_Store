package com.example.zeststore.controller;

import com.example.zeststore.entity.DiemTichLuy;
import com.example.zeststore.entity.LichSuDiem;
import com.example.zeststore.service.DiemService;
import com.example.zeststore.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/diem")
@RequiredArgsConstructor
public class DiemController {

    private final DiemService diemService;
    private final UserService userService;

    @GetMapping("/so-du")
    public ResponseEntity<?> getSoDu(Authentication auth) {
        Integer userId = userService.getUserIdFromAuth(auth);
        DiemTichLuy viDiem = diemService.getSoDiem(userId);
        return ResponseEntity.ok(Map.of(
                "soDiem", viDiem.getSoDiem(),
                "tongTichLuy", viDiem.getTongTichLuy(),
                "tongSuDung", viDiem.getTongSuDung()
        ));
    }

    @GetMapping("/lich-su")
    public ResponseEntity<?> getLichSu(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {
        Integer userId = userService.getUserIdFromAuth(auth);
        Page<LichSuDiem> lichSu = diemService.getLichSuDiem(userId, org.springframework.data.domain.PageRequest.of(page, size));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("content", lichSu.getContent());
        result.put("totalPages", lichSu.getTotalPages());
        result.put("number", lichSu.getNumber());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/admin/{maNguoiDung}")
    public ResponseEntity<?> getSoDiemCuaNguoiDung(@PathVariable Integer maNguoiDung) {
        DiemTichLuy viDiem = diemService.getSoDiem(maNguoiDung);
        return ResponseEntity.ok(Map.of(
                "soDiem", viDiem.getSoDiem(),
                "tongTichLuy", viDiem.getTongTichLuy(),
                "tongSuDung", viDiem.getTongSuDung()
        ));
    }

    @PostMapping("/tinh-tien-giam")
    public ResponseEntity<?> tinhTienGiam(@RequestBody Map<String, Integer> body) {
        Integer soDiem = body.get("soDiem");
        int tienGiam = diemService.tinhTienGiam(soDiem);
        return ResponseEntity.ok(Map.of("tienGiam", tienGiam));
    }
}
