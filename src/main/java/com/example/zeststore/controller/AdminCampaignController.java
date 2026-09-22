package com.example.zeststore.controller;

import com.example.zeststore.entity.*;
import com.example.zeststore.repository.BienTheSanPhamRepository;
import com.example.zeststore.repository.ChuongTrinhQuaTangRepository;
import com.example.zeststore.repository.PhieuGiamGiaRepository;
import com.example.zeststore.repository.SanPhamRepository;
import com.example.zeststore.service.AutoGrantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashSet;
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
    private final SanPhamRepository sanPhamRepository;
    private final BienTheSanPhamRepository bienTheSanPhamRepository;
    private final AutoGrantService autoGrantService;

    @GetMapping
    public ResponseEntity<?> getAll() {
        List<Map<String, Object>> list = campaignRepository.findAll().stream()
                .map(this::toMap)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOne(@PathVariable Integer id) {
        ChuongTrinhQuaTang c = campaignRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaign not found"));
        return ResponseEntity.ok(toMap(c));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        String ten = (String) body.get("tenChuongTrinh");
        if (ten == null || ten.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu tên chương trình"));
        }
        // loaiTrigger optional — mặc định SU_KIEN khi form mới không gửi lên
        Integer loaiTrigger = body.get("loaiTrigger") != null
                ? ((Number) body.get("loaiTrigger")).intValue() : LoaiTrigger.SU_KIEN.getValue();
        // maPhieuGiamGia optional — chương trình có thể chưa gắn mã giảm giá
        PhieuGiamGia coupon = null;
        if (body.get("maPhieuGiamGia") != null) {
            Integer maPhieuGiamGia = ((Number) body.get("maPhieuGiamGia")).intValue();
            coupon = phieuGiamGiaRepository.findById(maPhieuGiamGia)
                    .orElseThrow(() -> new RuntimeException("Coupon not found"));
        }

        LoaiTrigger trigger = LoaiTrigger.fromValue(loaiTrigger);
        Integer kieuGiamGia = body.get("kieuGiamGia") != null
                ? ((Number) body.get("kieuGiamGia")).intValue() : null;
        BigDecimal giaTriGiam = toBigDecimal(body.get("giaTriGiam"));
        java.time.LocalDateTime ngayBatDau = body.get("ngayBatDau") != null
                ? java.time.LocalDateTime.parse((String) body.get("ngayBatDau")) : null;
        java.time.LocalDateTime ngayKetThuc = body.get("ngayKetThuc") != null
                ? java.time.LocalDateTime.parse((String) body.get("ngayKetThuc")) : null;
        validateDiscountDefinition(kieuGiamGia, giaTriGiam, ngayBatDau, ngayKetThuc);

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
                .kieuGiamGia(kieuGiamGia)
                .giaTriGiam(giaTriGiam)
                .sanPhamApDung(new HashSet<>(findSanPhams(body.get("maSanPhamIds"))))
                .bienTheApDung(new HashSet<>(findBienThes(body.get("maBienTheIds"))))
                .soNgayKhongHoatDong(body.get("soNgayKhongHoatDong") != null
                        ? ((Number) body.get("soNgayKhongHoatDong")).intValue() : null)
                .doiTuong(body.get("doiTuong") != null
                        ? DoiTuongEnum.fromValue(((Number) body.get("doiTuong")).intValue()) : null)
                .dieuKien(body.get("dieuKien") != null
                        ? DieuKienEnum.fromValue(((Number) body.get("dieuKien")).intValue()) : null)
                .ngayBatDau(ngayBatDau)
                .ngayKetThuc(ngayKetThuc)
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

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        ChuongTrinhQuaTang c = campaignRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaign not found"));

        if (body.containsKey("tenChuongTrinh")) {
            c.setTenChuongTrinh((String) body.get("tenChuongTrinh"));
        }
        if (body.containsKey("maPhieuGiamGia")) {
            PhieuGiamGia coupon = phieuGiamGiaRepository.findById(((Number) body.get("maPhieuGiamGia")).intValue())
                    .orElseThrow(() -> new RuntimeException("Coupon not found"));
            c.setPhieuGiamGia(coupon);
        }
        if (body.containsKey("soNgayKhongHoatDong")) {
            c.setSoNgayKhongHoatDong(body.get("soNgayKhongHoatDong") != null
                    ? ((Number) body.get("soNgayKhongHoatDong")).intValue() : null);
        }
        if (body.containsKey("doiTuong")) {
            c.setDoiTuong(body.get("doiTuong") != null
                    ? DoiTuongEnum.fromValue(((Number) body.get("doiTuong")).intValue()) : null);
        }
        if (body.containsKey("dieuKien")) {
            c.setDieuKien(body.get("dieuKien") != null
                    ? DieuKienEnum.fromValue(((Number) body.get("dieuKien")).intValue()) : null);
        }
        if (body.containsKey("ngayBatDau")) {
            c.setNgayBatDau(body.get("ngayBatDau") != null
                    ? java.time.LocalDateTime.parse((String) body.get("ngayBatDau")) : null);
        }
        if (body.containsKey("ngayKetThuc")) {
            c.setNgayKetThuc(body.get("ngayKetThuc") != null
                    ? java.time.LocalDateTime.parse((String) body.get("ngayKetThuc")) : null);
        }
        if (body.containsKey("trangThai")) {
            c.setTrangThai(((Number) body.get("trangThai")).intValue());
        }
        if (body.containsKey("kieuGiamGia")) {
            c.setKieuGiamGia(body.get("kieuGiamGia") != null
                    ? ((Number) body.get("kieuGiamGia")).intValue() : null);
        }
        if (body.containsKey("giaTriGiam")) {
            c.setGiaTriGiam(toBigDecimal(body.get("giaTriGiam")));
        }
        if (body.containsKey("maSanPhamIds")) {
            c.setSanPhamApDung(new HashSet<>(findSanPhams(body.get("maSanPhamIds"))));
        }
        if (body.containsKey("maBienTheIds")) {
            c.setBienTheApDung(new HashSet<>(findBienThes(body.get("maBienTheIds"))));
        }

        validateDiscountDefinition(c.getKieuGiamGia(), c.getGiaTriGiam(), c.getNgayBatDau(), c.getNgayKetThuc());

        campaignRepository.save(c);
        return ResponseEntity.ok(toMap(c));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        ChuongTrinhQuaTang c = campaignRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaign not found"));
        campaignRepository.delete(c);
        return ResponseEntity.ok(Map.of("message", "Đã xóa chương trình"));
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
        if (c.getPhieuGiamGia() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Chương trình chưa gắn mã giảm giá"));
        }
        if (c.getTrangThai() != 1) {
            return ResponseEntity.badRequest().body(Map.of("message", "Campaign đang tắt"));
        }
        autoGrantService.launchCampaign(c);
        return ResponseEntity.ok(Map.of("message", "Đã phát động campaign thành công"));
    }

    private static BigDecimal toBigDecimal(Object v) {
        if (v == null) return null;
        if (v instanceof BigDecimal b) return b;
        if (v instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        String s = v.toString().trim();
        return s.isEmpty() ? null : new BigDecimal(s);
    }

    private static void validateDiscountDefinition(Integer type, BigDecimal value,
                                                     java.time.LocalDateTime start,
                                                     java.time.LocalDateTime end) {
        if (type == null || (type != 1 && type != 2)) {
            throw new IllegalArgumentException("Kiểu giảm giá không hợp lệ");
        }
        if (value == null || value.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Giá trị giảm phải lớn hơn 0");
        }
        if (type == 1 && value.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new IllegalArgumentException("Phần trăm giảm không được vượt quá 100");
        }
        if (start != null && end != null && !start.isBefore(end)) {
            throw new IllegalArgumentException("Ngày bắt đầu phải nhỏ hơn ngày kết thúc");
        }
    }

    @SuppressWarnings("unchecked")
    private List<SanPham> findSanPhams(Object ids) {
        if (!(ids instanceof List<?> list) || list.isEmpty()) return List.of();
        List<Integer> intIds = list.stream()
                .filter(o -> o instanceof Number)
                .map(o -> ((Number) o).intValue())
                .toList();
        return intIds.isEmpty() ? List.of() : sanPhamRepository.findAllById(intIds);
    }

    @SuppressWarnings("unchecked")
    private List<BienTheSanPham> findBienThes(Object ids) {
        if (!(ids instanceof List<?> list) || list.isEmpty()) return List.of();
        List<Integer> intIds = list.stream()
                .filter(o -> o instanceof Number)
                .map(o -> ((Number) o).intValue())
                .toList();
        return intIds.isEmpty() ? List.of() : bienTheSanPhamRepository.findAllById(intIds);
    }

    private Map<String, Object> toMap(ChuongTrinhQuaTang c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("maChuongTrinh", c.getMaChuongTrinh());
        m.put("tenChuongTrinh", c.getTenChuongTrinh());
        m.put("loaiTrigger", c.getLoaiTrigger() != null ? c.getLoaiTrigger().getValue() : null);
        m.put("loaiTriggerText", c.getLoaiTrigger() == null ? "—" : switch (c.getLoaiTrigger()) {
            case DANG_KY_MOI -> "Đăng ký mới";
            case QUAY_LAI -> "Quay lại";
            case SU_KIEN -> "Sự kiện";
        });
        m.put("maPhieuGiamGia", c.getPhieuGiamGia() != null ? c.getPhieuGiamGia().getMaPhieuGiamGia() : null);
        m.put("maCode", c.getPhieuGiamGia() != null ? c.getPhieuGiamGia().getMaCode() : null);
        m.put("kieuGiamGia", c.getKieuGiamGia());
        m.put("giaTriGiam", c.getGiaTriGiam());
        m.put("maSanPhamIds", c.getSanPhamApDung() != null
                ? c.getSanPhamApDung().stream().map(SanPham::getMaSanPham).toList() : List.of());
        m.put("maBienTheIds", c.getBienTheApDung() != null
                ? c.getBienTheApDung().stream().map(BienTheSanPham::getMaBienThe).toList() : List.of());
        m.put("soNgayKhongHoatDong", c.getSoNgayKhongHoatDong());
        m.put("doiTuong", c.getDoiTuong() != null ? c.getDoiTuong().getValue() : null);
        m.put("dieuKien", c.getDieuKien() != null ? c.getDieuKien().getValue() : null);
        m.put("ngayBatDau", c.getNgayBatDau() != null ? c.getNgayBatDau().toString() : null);
        m.put("ngayKetThuc", c.getNgayKetThuc() != null ? c.getNgayKetThuc().toString() : null);
        m.put("daChayXong", c.getDaChayXong());
        m.put("trangThai", c.getTrangThai());
        m.put("ngayTao", c.getNgayTao() != null ? c.getNgayTao().toString() : null);
        return m;
    }
}
