package com.example.zeststore.controller;

import com.example.zeststore.entity.NguoiDung;
import com.example.zeststore.repository.NguoiDungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final NguoiDungRepository nguoiDungRepository;

    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        List<Map<String, Object>> users = nguoiDungRepository.findAll().stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("maNguoiDung", u.getMaNguoiDung());
            m.put("hoTen", u.getHoTen());
            m.put("email", u.getEmail());
            m.put("soDienThoai", u.getSoDienThoai());
            m.put("trangThai", u.getTrangThai());
            m.put("vaiTro", u.getVaiTro() != null ? u.getVaiTro().getTenVaiTro() : null);
            m.put("ngayTao", u.getNgayTao());
            m.put("gioiTinh", u.getGioiTinh());
            m.put("ngaySinh", u.getNgaySinh());
            m.put("anhDaiDien", u.getAnhDaiDien());
            m.put("ngayDangNhapCuoi", u.getNgayDangNhapCuoi());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }
}
