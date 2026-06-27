package com.example.zeststore.service;

import com.example.zeststore.dto.request.DanhGiaRequest;
import com.example.zeststore.entity.*;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DanhGiaService {

    private final DanhGiaRepository danhGiaRepository;
    private final SanPhamRepository sanPhamRepository;
    private final DonHangRepository donHangRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final BienTheSanPhamRepository bienTheRepository;

    public List<DanhGia> getReviewsByProduct(Integer productId) {
        return danhGiaRepository.findBySanPham_MaSanPham(productId);
    }

    public List<DanhGia> getReviewsByUser(Integer userId) {
        return danhGiaRepository.findByNguoiDung_MaNguoiDung(userId);
    }

    public Map<String, Object> getProductReviews(Integer productId) {
        return Map.of(
                "reviews", getReviewsByProduct(productId),
                "averageRating", getAverageRating(productId),
                "reviewCount", getReviewCount(productId)
        );
    }

    @Transactional
    public DanhGia addReview(Integer userId, DanhGiaRequest request) {
        NguoiDung user = nguoiDungRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        SanPham product = sanPhamRepository.findById(request.getMaSanPham())
                .orElseThrow(() -> new ResourceNotFoundException("Product", request.getMaSanPham()));

        if (request.getMaDonHang() != null) {
            DonHang order = donHangRepository.findById(request.getMaDonHang())
                    .orElseThrow(() -> new ResourceNotFoundException("Order", request.getMaDonHang()));
            Optional<DanhGia> existing = danhGiaRepository
                    .findByNguoiDung_MaNguoiDungAndSanPham_MaSanPhamAndDonHang_MaDonHang(
                            userId, request.getMaSanPham(), request.getMaDonHang());
            if (existing.isPresent()) {
                throw new BadRequestException("You have already reviewed this product for this order");
            }
        }

        BienTheSanPham bienThe = request.getMaBienThe() != null
                ? bienTheRepository.findById(request.getMaBienThe())
                        .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", request.getMaBienThe()))
                : null;

        return danhGiaRepository.save(DanhGia.builder()
                .nguoiDung(user)
                .sanPham(product)
                .donHang(null)
                .bienThe(bienThe)
                .soSao(request.getSoSao())
                .binhLuan(request.getBinhLuan())
                .build());
    }

    public Double getAverageRating(Integer productId) {
        Double avg = danhGiaRepository.averageRatingBySanPhamId(productId);
        return avg != null ? avg : 0.0;
    }

    public Long getReviewCount(Integer productId) {
        Long count = danhGiaRepository.countBySanPhamId(productId);
        return count != null ? count : 0;
    }
}
