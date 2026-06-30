package com.example.zeststore.service;

import com.example.zeststore.entity.*;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class YeuThichService {

    private final DanhSachYeuThichRepository danhSachYeuThichRepository;
    private final MucYeuThichRepository mucYeuThichRepository;
    private final SanPhamRepository sanPhamRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final BienTheSanPhamRepository bienTheRepository;
    private final DanhGiaRepository danhGiaRepository;

    public DanhSachYeuThich getOrCreateWishlist(Integer userId) {
        return danhSachYeuThichRepository.findByNguoiDung_MaNguoiDung(userId)
                .orElseGet(() -> {
                    NguoiDung user = nguoiDungRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User", userId));
                    return danhSachYeuThichRepository.save(
                            DanhSachYeuThich.builder().nguoiDung(user).build());
                });
    }

    public List<SanPham> getWishlistItems(Integer userId) {
        DanhSachYeuThich wishlist = getOrCreateWishlist(userId);
        List<SanPham> products = mucYeuThichRepository.findByDanhSachYeuThich_MaDsYeuThich(wishlist.getMaDsYeuThich())
                .stream().map(MucYeuThich::getSanPham).toList();
        if (products.isEmpty()) return products;
        List<Integer> ids = products.stream().map(SanPham::getMaSanPham).toList();
        List<Object[]> stockData = bienTheRepository.sumTonKhoBySanPhamIds(ids);
        Map<Integer, Integer> stockMap = stockData.stream()
                .collect(Collectors.toMap(row -> ((Number) row[0]).intValue(), row -> ((Number) row[1]).intValue()));
        products.forEach(sp -> sp.setTongTonKho(stockMap.getOrDefault(sp.getMaSanPham(), 0)));
        List<Object[]> giaTriData = bienTheRepository.sumGiaTriBySanPhamIds(ids);
        Map<Integer, BigDecimal> giaTriMap = giaTriData.stream()
                .collect(Collectors.toMap(row -> ((Number) row[0]).intValue(),
                        row -> row[1] instanceof BigDecimal ? (BigDecimal) row[1] : BigDecimal.valueOf(((Number) row[1]).doubleValue())));
        products.forEach(sp -> sp.setTongGiaTri(giaTriMap.getOrDefault(sp.getMaSanPham(), BigDecimal.ZERO)));
        List<Object[]> minGiaData = bienTheRepository.minGiaBySanPhamIds(ids);
        Map<Integer, BigDecimal> minGiaMap = minGiaData.stream()
                .collect(Collectors.toMap(row -> ((Number) row[0]).intValue(),
                        row -> row[1] instanceof BigDecimal ? (BigDecimal) row[1] : BigDecimal.valueOf(((Number) row[1]).doubleValue())));
        products.forEach(sp -> sp.setGiaThapNhat(minGiaMap.get(sp.getMaSanPham())));
        List<Object[]> ratingData = danhGiaRepository.avgRatingBySanPhamIds(ids);
        Map<Integer, Double> avgRatingMap = ratingData.stream()
                .collect(Collectors.toMap(row -> ((Number) row[0]).intValue(),
                        row -> row[1] != null ? ((Number) row[1]).doubleValue() : 0.0));
        Map<Integer, Long> countMap = ratingData.stream()
                .collect(Collectors.toMap(row -> ((Number) row[0]).intValue(),
                        row -> row[2] != null ? ((Number) row[2]).longValue() : 0L));
        products.forEach(sp -> {
            sp.setAverageRating(avgRatingMap.get(sp.getMaSanPham()));
            sp.setReviewCount(countMap.get(sp.getMaSanPham()));
        });
        return products;
    }

    public boolean isInWishlist(Integer userId, Integer productId) {
        return mucYeuThichRepository
                .existsByDanhSachYeuThich_NguoiDung_MaNguoiDungAndSanPham_MaSanPham(userId, productId);
    }

    @Transactional
    public MucYeuThich addItem(Integer userId, Integer productId) {
        DanhSachYeuThich wishlist = getOrCreateWishlist(userId);
        SanPham product = sanPhamRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

        if (mucYeuThichRepository.existsByDanhSachYeuThich_NguoiDung_MaNguoiDungAndSanPham_MaSanPham(
                userId, productId)) {
            throw new BadRequestException("Product already in wishlist");
        }

        return mucYeuThichRepository.save(MucYeuThich.builder()
                .danhSachYeuThich(wishlist)
                .sanPham(product)
                .build());
    }

    @Transactional
    public Map<String, String> removeItem(Integer userId, Integer productId) {
        DanhSachYeuThich wishlist = getOrCreateWishlist(userId);
        MucYeuThich item = mucYeuThichRepository
                .findByDanhSachYeuThich_MaDsYeuThichAndSanPham_MaSanPham(
                        wishlist.getMaDsYeuThich(), productId)
                .orElseThrow(() -> new ResourceNotFoundException("Wishlist item not found"));
        mucYeuThichRepository.delete(item);
        return Map.of("message", "Item removed from wishlist");
    }
}
