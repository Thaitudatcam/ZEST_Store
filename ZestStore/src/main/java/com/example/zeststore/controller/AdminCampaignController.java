package com.example.zeststore.controller;

import com.example.zeststore.entity.*;
import com.example.zeststore.repository.ChuongTrinhQuaTangRepository;
import com.example.zeststore.repository.PhieuGiamGiaRepository;
import com.example.zeststore.service.AutoGrantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/campaigns")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCampaignController {

    private final ChuongTrinhQuaTangRepository campaignRepository;
    private final PhieuGiamGiaRepository phieuGiamGiaRepository;
    private final AutoGrantService autoGrantService;

    @GetMapping
    public ResponseEntity<?> getAll() {
        List<Map<String, Object>> list = campaignRepository.findAll().stream()
                .map(this::toMap)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        String ten = (String) body.get("tenChuongTrinh");
        Integer loaiTrigger = (Integer) body.get("loaiTrigger");
        Integer maPhieuGiamGia = (Integer) body.get("maPhieuGiamGia");
        if (ten == null || loaiTrigger == null || maPhieuGiamGia == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu thông tin bắt buộc"));
        }
        PhieuGiamGia coupon = phieuGiamGiaRepository.findById(maPhieuGiamGia)
                .orElseThrow(() -> new RuntimeException("Coupon not found"));

        LoaiTrigger trigger = LoaiTrigger.fromValue(loaiTrigger);

        if (trigger == LoaiTrigger.DANG_KY_MOI || trigger == LoaiTrigger.QUAY_LAI) {
            List<ChuongTrinhQuaTang> existing = campaignRepository
                    .findByTrangThaiAndLoaiTrigger(1, trigger);
            for (ChuongTrinhQuaTang c : existing) {
                c.setTrangThai(0);
                campaignRepository.save(c);
            }
        }

        ChuongTrinhQuaTang campaign = ChuongTrinhQuaTang.builder()
                .tenChuongTrinh(ten)
                .loaiTrigger(trigger)
                .phieuGiamGia(coupon)
                .soNgayKhongHoatDong(body.get("soNgayKhongHoatDong") != null
                        ? ((Number) body.get("soNgayKhongHoatDong")).intValue() : null)
                .doiTuong(body.get("doiTuong") != null
                        ? DoiTuongEnum.fromValue(((Number) body.get("doiTuong")).intValue()) : null)
                .dieuKien(body.get("dieuKien") != null
                        ? DieuKienEnum.fromValue(((Number) body.get("dieuKien")).intValue()) : null)
                .ngayBatDau(body.get("ngayBatDau") != null
                        ? java.time.LocalDateTime.parse((String) body.get("ngayBatDau")) : null)
                .trangThai(1)
                .build();
        campaign = campaignRepository.save(campaign);
        return ResponseEntity.ok(toMap(campaign));
    }

    @PutMapping("/{id}/toggle-status")
    public ResponseEntity<?> toggleStatus(@PathVariable Integer id) {
        ChuongTrinhQuaTang c = campaignRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaign not found"));
        c.setTrangThai(c.getTrangThai() == 1 ? 0 : 1);
        if (c.getTrangThai() == 1
                && (c.getLoaiTrigger() == LoaiTrigger.DANG_KY_MOI || c.getLoaiTrigger() == LoaiTrigger.QUAY_LAI)) {
            List<ChuongTrinhQuaTang> sameType = campaignRepository
                    .findByTrangThaiAndLoaiTrigger(1, c.getLoaiTrigger());
            for (ChuongTrinhQuaTang other : sameType) {
                if (!other.getMaChuongTrinh().equals(id)) {
                    other.setTrangThai(0);
                    campaignRepository.save(other);
                }
            }
        }
        campaignRepository.save(c);
        return ResponseEntity.ok(Map.of("message", "OK", "trangThai", c.getTrangThai()));
    }

    @PostMapping("/{id}/launch")
    public ResponseEntity<?> launch(@PathVariable Integer id) {
        ChuongTrinhQuaTang c = campaignRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaign not found"));
        if (c.getDaChayXong()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Campaign đã chạy rồi"));
        }
        if (c.getLoaiTrigger() != LoaiTrigger.SU_KIEN) {
            return ResponseEntity.badRequest().body(Map.of("message", "Chỉ có thể launch campaign sự kiện"));
        }
        if (c.getTrangThai() != 1) {
            return ResponseEntity.badRequest().body(Map.of("message", "Campaign đang tắt"));
        }
        autoGrantService.launchCampaign(c);
        return ResponseEntity.ok(Map.of("message", "Đã phát động campaign thành công"));
    }

    private Map<String, Object> toMap(ChuongTrinhQuaTang c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("maChuongTrinh", c.getMaChuongTrinh());
        m.put("tenChuongTrinh", c.getTenChuongTrinh());
        m.put("loaiTrigger", c.getLoaiTrigger().getValue());
        m.put("loaiTriggerText", switch (c.getLoaiTrigger()) {
            case DANG_KY_MOI -> "Đăng ký mới";
            case QUAY_LAI -> "Quay lại";
            case SU_KIEN -> "Sự kiện";
        });
        m.put("maPhieuGiamGia", c.getPhieuGiamGia().getMaPhieuGiamGia());
        m.put("maCode", c.getPhieuGiamGia().getMaCode());
        m.put("soNgayKhongHoatDong", c.getSoNgayKhongHoatDong());
        m.put("doiTuong", c.getDoiTuong() != null ? c.getDoiTuong().getValue() : null);
        m.put("dieuKien", c.getDieuKien() != null ? c.getDieuKien().getValue() : null);
        m.put("ngayBatDau", c.getNgayBatDau() != null ? c.getNgayBatDau().toString() : null);
        m.put("daChayXong", c.getDaChayXong());
        m.put("trangThai", c.getTrangThai());
        m.put("ngayTao", c.getNgayTao() != null ? c.getNgayTao().toString() : null);
        return m;
    }
}
