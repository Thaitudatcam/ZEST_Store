package com.example.zeststore.controller;

import com.example.zeststore.entity.DotPhatHanh;
import com.example.zeststore.entity.NguoiDung;
import com.example.zeststore.entity.PhieuGiamGia;
import com.example.zeststore.repository.DotPhatHanhRepository;
import com.example.zeststore.repository.NguoiDungRepository;
import com.example.zeststore.repository.PhieuGiamGiaRepository;
import com.example.zeststore.service.PhieuGiamGiaService;
import com.example.zeststore.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/coupon-batches")
@RequiredArgsConstructor
public class CouponBatchController {

    private final DotPhatHanhRepository dotPhatHanhRepository;
    private final PhieuGiamGiaRepository phieuGiamGiaRepository;
    private final PhieuGiamGiaService phieuGiamGiaService;
    private final UserService userService;
    private final NguoiDungRepository nguoiDungRepository;

    @PostMapping
    public ResponseEntity<?> createBatch(@RequestBody Map<String, Object> body, Authentication auth) {
        Integer adminUserId = userService.getUserIdFromAuth(auth);

        String tenDot = (String) body.get("tenDot");
        Integer kieuGiamGia = Integer.valueOf(body.get("kieuGiamGia").toString());
        BigDecimal giaTriGiam = new BigDecimal(body.get("giaTriGiam").toString());
        Integer soLuong = Integer.valueOf(body.get("soLuong").toString());

        if (soLuong > 500) {
            return ResponseEntity.badRequest().body(Map.of("message", "Số lượng tối đa 500 mã mỗi đợt"));
        }

        DotPhatHanh dotPhatHanh = DotPhatHanh.builder()
                .tenDot(tenDot)
                .kieuGiamGia(kieuGiamGia)
                .giaTriGiam(giaTriGiam)
                .giaTriDonToiThieu(body.get("giaTriDonToiThieu") != null
                        ? new BigDecimal(body.get("giaTriDonToiThieu").toString()) : null)
                .giaTriGiamToiDa(body.get("giaTriGiamToiDa") != null
                        ? new BigDecimal(body.get("giaTriGiamToiDa").toString()) : null)
                .soLuong(soLuong)
                .ngayBatDau(body.get("ngayBatDau") != null
                        ? LocalDateTime.parse(body.get("ngayBatDau").toString()) : null)
                .ngayKetThuc(body.get("ngayKetThuc") != null
                        ? LocalDateTime.parse(body.get("ngayKetThuc").toString()) : null)
                .nguoiTao(nguoiDungRepository.getReferenceById(adminUserId))
                .build();
        dotPhatHanh = dotPhatHanhRepository.save(dotPhatHanh);

        List<String> codes = phieuGiamGiaService.generateBatchVouchers(dotPhatHanh);

        dotPhatHanh.setDaTao(codes.size());
        dotPhatHanhRepository.save(dotPhatHanh);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("maDot", dotPhatHanh.getMaDot());
        result.put("tenDot", dotPhatHanh.getTenDot());
        result.put("soLuong", codes.size());
        result.put("listMaCode", codes);
        return ResponseEntity.ok(result);
    }

    @GetMapping
    public ResponseEntity<?> getAllBatches() {
        List<DotPhatHanh> batches = dotPhatHanhRepository.findAll();
        return ResponseEntity.ok(batches);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBatchDetail(@PathVariable Integer id) {
        DotPhatHanh batch = dotPhatHanhRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Batch not found: " + id));
        return ResponseEntity.ok(batch);
    }

    @GetMapping("/{id}/vouchers")
    public ResponseEntity<?> getBatchVouchers(@PathVariable Integer id) {
        List<PhieuGiamGia> vouchers = phieuGiamGiaRepository.findByDotPhatHanh_MaDot(id);
        List<String> codes = vouchers.stream().map(PhieuGiamGia::getMaCode).collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("maDot", id, "soLuong", codes.size(), "listMaCode", codes));
    }
}
