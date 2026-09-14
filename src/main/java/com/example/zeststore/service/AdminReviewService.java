package com.example.zeststore.service;

import com.example.zeststore.entity.DanhGia;
import com.example.zeststore.repository.DanhGiaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminReviewService {

    private final DanhGiaRepository danhGiaRepository;

    public List<Map<String, Object>> getAllReviews() {
        return danhGiaRepository.findAll().stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("maDanhGia", r.getMaDanhGia());
            m.put("soSao", r.getSoSao());
            m.put("binhLuan", r.getBinhLuan());
            m.put("ngayTao", r.getNgayTao());
            m.put("khachHang", r.getNguoiDung().getHoTen());
            m.put("email", r.getNguoiDung().getEmail());
            m.put("sanPham", r.getSanPham().getTenSanPham());
            m.put("maSanPham", r.getSanPham().getMaSanPham());
            m.put("slug", r.getSanPham().getSlug());
            m.put("hinhAnh", r.getSanPham().getUrlAnhDaiDien());
            m.put("ngayXoa", r.getNgayXoa());
            return m;
        }).collect(Collectors.toList());
    }

    @Transactional
    public void deleteReview(Integer id) {
        DanhGia review = danhGiaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found: " + id));
        review.setNgayXoa(LocalDateTime.now());
        danhGiaRepository.save(review);
    }

    @Transactional
    public void restoreReview(Integer id) {
        DanhGia review = danhGiaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found: " + id));
        review.setNgayXoa(null);
        danhGiaRepository.save(review);
    }
}
