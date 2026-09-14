package com.example.zeststore.service;

import com.example.zeststore.entity.SanPham;
import com.example.zeststore.repository.HanhViNguoiDungRepository;
import com.example.zeststore.repository.MucDonHangRepository;
import com.example.zeststore.repository.SanPhamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final SanPhamRepository sanPhamRepo;
    private final MucDonHangRepository mucDonHangRepo;
    private final HanhViNguoiDungRepository hanhViRepo;

    public List<SanPham> getBestSelling(int limit) {
        List<Object[]> results = mucDonHangRepo.findBestSellingProducts(PageRequest.of(0, limit));
        List<Integer> ids = results.stream()
                .map(r -> (Integer) r[0])
                .collect(Collectors.toList());
        if (ids.isEmpty()) return List.of();
        List<SanPham> products = sanPhamRepo.findAllById(ids);
        Map<Integer, SanPham> map = new LinkedHashMap<>();
        for (SanPham sp : products) map.put(sp.getMaSanPham(), sp);
        List<SanPham> ordered = new ArrayList<>();
        for (Integer id : ids) {
            if (map.containsKey(id)) ordered.add(map.get(id));
        }
        return ordered;
    }

    public List<SanPham> getRelatedProducts(Integer maSanPham, int limit) {
        SanPham product = sanPhamRepo.findById(maSanPham).orElse(null);
        if (product == null || product.getDanhMuc() == null) return List.of();
        List<Integer> catIds = new ArrayList<>();
        catIds.add(product.getDanhMuc().getMaDanhMuc());
        if (product.getDanhMuc().getDanhMucCha() != null)
            catIds.add(product.getDanhMuc().getDanhMucCha().getMaDanhMuc());
        return sanPhamRepo.findByMultipleCategoryIds(catIds, PageRequest.of(0, limit + 1))
                .getContent()
                .stream()
                .filter(s -> !s.getMaSanPham().equals(maSanPham))
                .limit(limit)
                .collect(Collectors.toList());
    }

    public List<SanPham> getPopular(int limit) {
        LocalDateTime tuNgay = LocalDateTime.now().minusDays(30);
        List<Object[]> results = hanhViRepo.findTopSanPhamByHanhDongAndDateRange(
                "view", tuNgay, LocalDateTime.now(), limit);
        List<Integer> ids = results.stream()
                .map(r -> (Integer) r[0])
                .collect(Collectors.toList());
        if (ids.isEmpty()) return sanPhamRepo.findTop10ByTrangThaiAndNgayXoaIsNullOrderByNgayTaoDesc(1);
        List<SanPham> products = sanPhamRepo.findAllById(ids);
        Map<Integer, SanPham> map = new LinkedHashMap<>();
        for (SanPham sp : products) map.put(sp.getMaSanPham(), sp);
        List<SanPham> ordered = new ArrayList<>();
        for (Integer id : ids) {
            if (map.containsKey(id)) ordered.add(map.get(id));
        }
        return ordered;
    }

    public List<SanPham> getPersonalized(Integer maNguoiDung, int limit) {
        List<Integer> viewedCatIds = new ArrayList<>();
        List<Integer> viewedProductIds = new ArrayList<>();
        hanhViRepo.findByNguoiDung_MaNguoiDung(maNguoiDung).forEach(hv -> {
            if (hv.getSanPham() != null) {
                viewedProductIds.add(hv.getSanPham().getMaSanPham());
                if (hv.getSanPham().getDanhMuc() != null)
                    viewedCatIds.add(hv.getSanPham().getDanhMuc().getMaDanhMuc());
            }
        });
        if (viewedCatIds.isEmpty()) return getPopular(limit);
        return sanPhamRepo.findByMultipleCategoryIds(
                viewedCatIds.stream().distinct().collect(Collectors.toList()),
                PageRequest.of(0, limit + viewedProductIds.size())).getContent()
                .stream()
                .filter(s -> !viewedProductIds.contains(s.getMaSanPham()))
                .limit(limit)
                .collect(Collectors.toList());
    }
}
