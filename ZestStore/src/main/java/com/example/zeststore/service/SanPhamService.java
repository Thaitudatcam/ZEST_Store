package com.example.zeststore.service;

import com.example.zeststore.dto.request.BienTheRequest;
import com.example.zeststore.dto.request.SanPhamRequest;
import com.example.zeststore.entity.*;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.DuplicateResourceException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SanPhamService {

    private final SanPhamRepository sanPhamRepository;
    private final BienTheSanPhamRepository bienTheRepository;
    private final AnhSanPhamRepository anhSanPhamRepository;
    private final DanhMucRepository danhMucRepository;
    private final DanhGiaRepository danhGiaRepository;
    private final HanhViNguoiDungRepository hanhViRepository;
    private final ThuongHieuRepository thuongHieuRepository;
    private final KichCoRepository kichCoRepository;
    private final MauSacRepository mauSacRepository;

    public Page<SanPham> getProducts(String keyword, Integer categoryId, BigDecimal minPrice,
                                      BigDecimal maxPrice, int page, int size, String sortBy, String sortDir) {
        if (keyword != null) return searchProducts(keyword, page, size);
        if (categoryId != null || minPrice != null || maxPrice != null)
            return filterProducts(categoryId, minPrice, maxPrice, page, size);
        return getProducts(page, size, sortBy, sortDir);
    }

    public Page<SanPham> getProducts(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<SanPham> result = sanPhamRepository.findByTrangThaiAndNgayXoaIsNull(1, pageable);
        populateStock(result);
        return result;
    }

    public Page<SanPham> searchProducts(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<SanPham> result = sanPhamRepository.searchByKeyword(keyword, pageable);
        populateStock(result);
        return result;
    }

    public Page<SanPham> filterProducts(Integer categoryId, BigDecimal minPrice, BigDecimal maxPrice,
                                         int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<SanPham> result = sanPhamRepository.filterProducts(categoryId, minPrice, maxPrice, pageable);
        populateStock(result);
        return result;
    }

    @Transactional(readOnly = true)
    public Page<SanPham> getAdminProducts(String keyword, int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<SanPham> result;
        if (keyword != null && !keyword.isBlank()) {
            result = sanPhamRepository.searchAdminByKeyword(keyword, pageable);
        } else {
            result = sanPhamRepository.findByNgayXoaIsNull(pageable);
        }
        populateStock(result);
        return result;
    }

    public List<Map<String, Object>> searchSuggestions(String keyword, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        Page<SanPham> products = sanPhamRepository.searchByKeyword(keyword, pageable);
        populateStock(products);
        return products.getContent().stream().map(sp -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("maSanPham", sp.getMaSanPham());
            m.put("tenSanPham", sp.getTenSanPham());
            m.put("slug", sp.getSlug());
            m.put("urlAnhDaiDien", sp.getUrlAnhDaiDien());
            m.put("gia", sp.getGiaTrungBinh());
            m.put("tongTonKho", sp.getTongTonKho());
            return m;
        }).collect(Collectors.toList());
    }

    private void populateStock(Page<SanPham> page) {
        if (page.isEmpty()) return;
        List<Integer> ids = page.getContent().stream().map(SanPham::getMaSanPham).collect(Collectors.toList());
        List<Object[]> stockData = bienTheRepository.sumTonKhoBySanPhamIds(ids);
        Map<Integer, Integer> stockMap = stockData.stream()
                .collect(Collectors.toMap(row -> ((Number) row[0]).intValue(), row -> ((Number) row[1]).intValue()));
        page.getContent().forEach(sp -> sp.setTongTonKho(stockMap.getOrDefault(sp.getMaSanPham(), 0)));
        List<Object[]> giaTriData = bienTheRepository.sumGiaTriBySanPhamIds(ids);
        Map<Integer, BigDecimal> giaTriMap = giaTriData.stream()
                .collect(Collectors.toMap(row -> ((Number) row[0]).intValue(),
                        row -> row[1] instanceof BigDecimal ? (BigDecimal) row[1] : BigDecimal.valueOf(((Number) row[1]).doubleValue())));
        page.getContent().forEach(sp -> sp.setTongGiaTri(giaTriMap.getOrDefault(sp.getMaSanPham(), BigDecimal.ZERO)));
        List<Object[]> minGiaData = bienTheRepository.minGiaBySanPhamIds(ids);
        Map<Integer, BigDecimal> minGiaMap = minGiaData.stream()
                .collect(Collectors.toMap(row -> ((Number) row[0]).intValue(),
                        row -> row[1] instanceof BigDecimal ? (BigDecimal) row[1] : BigDecimal.valueOf(((Number) row[1]).doubleValue())));
        page.getContent().forEach(sp -> sp.setGiaThapNhat(minGiaMap.get(sp.getMaSanPham())));
        List<Object[]> ratingData = danhGiaRepository.avgRatingBySanPhamIds(ids);
        Map<Integer, Double> avgRatingMap = ratingData.stream()
                .collect(Collectors.toMap(row -> ((Number) row[0]).intValue(),
                        row -> row[1] != null ? ((Number) row[1]).doubleValue() : 0.0));
        Map<Integer, Long> countMap = ratingData.stream()
                .collect(Collectors.toMap(row -> ((Number) row[0]).intValue(),
                        row -> row[2] != null ? ((Number) row[2]).longValue() : 0L));
        page.getContent().forEach(sp -> {
            sp.setAverageRating(avgRatingMap.get(sp.getMaSanPham()));
            sp.setReviewCount(countMap.get(sp.getMaSanPham()));
        });
    }

    public SanPham getBySlug(String slug) {
        return sanPhamRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + slug));
    }

    public SanPham getById(Integer id) {
        return sanPhamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
    }

    public Map<String, Object> getProductDetailBySlug(String slug) {
        return getProductDetail(getBySlug(slug).getMaSanPham());
    }

    public Map<String, Object> getProductDetail(Integer id) {
        SanPham product = getById(id);
        List<BienTheSanPham> variants = bienTheRepository.findBySanPham_MaSanPham(id);
        List<Integer> variantIds = variants.stream().map(BienTheSanPham::getMaBienThe).collect(Collectors.toList());
        List<AnhSanPham> images = variantIds.isEmpty() ? List.of()
                : anhSanPhamRepository.findByBienThe_MaBienTheIn(variantIds);
        Double avgRating = danhGiaRepository.averageRatingBySanPhamId(id);
        Long reviewCount = danhGiaRepository.countBySanPhamId(id);

        List<?> sizes = bienTheRepository.findDistinctKichCoBySanPhamId(id);
        List<?> colors = bienTheRepository.findDistinctMauSacBySanPhamId(id);

        BigDecimal minGia = variants.stream()
                .filter(v -> v.getGia() != null && v.getGia().compareTo(BigDecimal.ZERO) > 0)
                .map(BienTheSanPham::getGia)
                .min(BigDecimal::compareTo)
                .orElse(null);
        product.setGiaThapNhat(minGia);

        Map<String, Object> result = new HashMap<>();
        result.put("product", product);
        result.put("variants", variants);
        result.put("images", images);
        result.put("averageRating", avgRating != null ? avgRating : 0);
        result.put("reviewCount", reviewCount != null ? reviewCount : 0);
        result.put("sizes", sizes);
        result.put("colors", colors);
        return result;
    }

    @Transactional
    public List<BienTheSanPham> createVariantsBatch(Integer productId, List<BienTheRequest> requests) {
        SanPham product = getById(productId);
        List<BienTheSanPham> created = new java.util.ArrayList<>();
        for (BienTheRequest req : requests) {
            if (bienTheRepository.findBySku(req.getSku()).isPresent()) {
                throw new DuplicateResourceException("SKU already exists: " + req.getSku());
            }
            ThuongHieu thuongHieu = thuongHieuRepository.findById(req.getMaThuongHieu())
                    .orElseThrow(() -> new ResourceNotFoundException("Brand", req.getMaThuongHieu()));
            KichCo kichCo = kichCoRepository.findById(req.getMaKichCo())
                    .orElseThrow(() -> new ResourceNotFoundException("Size", req.getMaKichCo()));
            MauSac mauSac = mauSacRepository.findById(req.getMaMauSac())
                    .orElseThrow(() -> new ResourceNotFoundException("Color", req.getMaMauSac()));
            if (bienTheRepository.findBySanPham_MaSanPhamAndKichCo_MaKichCoAndMauSac_MaMauSac(
                    productId, req.getMaKichCo(), req.getMaMauSac()).isPresent()) {
                throw new DuplicateResourceException("Variant already exists for size " + kichCo.getKichCo() + " and color " + mauSac.getMauSac());
            }
            BienTheSanPham variant = BienTheSanPham.builder()
                    .sanPham(product).thuongHieu(thuongHieu).kichCo(kichCo).mauSac(mauSac)
                    .sku(req.getSku()).gia(req.getGia()).urlAnh(req.getUrlAnh())
                    .tonKho(req.getTonKho() != null ? req.getTonKho() : 0).build();
            created.add(bienTheRepository.save(variant));
        }
        recalculateGiaTrungBinh(product);
        return created;
    }

    @Transactional
    public SanPham createProduct(SanPhamRequest request) {
        if (sanPhamRepository.findBySlug(request.getSlug()).isPresent()) {
            throw new DuplicateResourceException("Slug already exists: " + request.getSlug());
        }
        DanhMuc category = danhMucRepository.findById(request.getMaDanhMuc())
                .orElseThrow(() -> new ResourceNotFoundException("Category", request.getMaDanhMuc()));
        SanPham product = sanPhamRepository.save(SanPham.builder()
                .danhMuc(category)
                .tenSanPham(request.getTenSanPham())
                .slug(request.getSlug())
                .moTa(request.getMoTa())
                .moTaAi(request.getMoTaAi())
                .urlAnhDaiDien(request.getUrlAnhDaiDien())
                .trangThai(request.getTrangThai() != null ? request.getTrangThai() : 1)
                .build());
        product.setMaSanPhamCode(String.format("SP%04d", product.getMaSanPham()));
        return sanPhamRepository.save(product);
    }

    @Transactional
    public SanPham updateProduct(Integer id, SanPhamRequest request) {
        SanPham product = getById(id);
        if (request.getMaDanhMuc() != null) {
            product.setDanhMuc(danhMucRepository.findById(request.getMaDanhMuc())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", request.getMaDanhMuc())));
        }
        if (request.getTenSanPham() != null) product.setTenSanPham(request.getTenSanPham());
        if (request.getSlug() != null && !request.getSlug().equals(product.getSlug())) {
            if (sanPhamRepository.findBySlug(request.getSlug()).isPresent()) {
                throw new DuplicateResourceException("Slug already exists: " + request.getSlug());
            }
            product.setSlug(request.getSlug());
        }
        if (request.getMoTa() != null) product.setMoTa(request.getMoTa());
        if (request.getMoTaAi() != null) product.setMoTaAi(request.getMoTaAi());
        if (request.getUrlAnhDaiDien() != null) product.setUrlAnhDaiDien(request.getUrlAnhDaiDien());
        if (request.getTrangThai() != null) product.setTrangThai(request.getTrangThai());
        return sanPhamRepository.save(product);
    }

    @Transactional
    public Map<String, String> deleteProduct(Integer id) {
        SanPham product = getById(id);
        product.setNgayXoa(LocalDateTime.now());
        sanPhamRepository.save(product);
        return Map.of("message", "Product deleted");
    }

    public List<BienTheSanPham> getVariants(Integer productId) {
        return bienTheRepository.findBySanPham_MaSanPham(productId);
    }

    @Transactional
    public SanPham createProductWithVariants(SanPhamRequest productReq, List<BienTheRequest> variantReqs) {
        SanPham product = createProduct(productReq);
        if (variantReqs != null) {
            for (BienTheRequest req : variantReqs) {
                createVariant(product.getMaSanPham(), req);
            }
        }
        return sanPhamRepository.findById(product.getMaSanPham()).get();
    }

    @Transactional
    public BienTheSanPham createVariant(Integer productId, BienTheRequest request) {
        SanPham product = getById(productId);
        if (bienTheRepository.findBySku(request.getSku()).isPresent()) {
            throw new BadRequestException("SKU already exists: " + request.getSku());
        }
        KichCo kichCo = kichCoRepository.findById(request.getMaKichCo())
                .orElseThrow(() -> new ResourceNotFoundException("Size", request.getMaKichCo()));
        MauSac mauSac = mauSacRepository.findById(request.getMaMauSac())
                .orElseThrow(() -> new ResourceNotFoundException("Color", request.getMaMauSac()));
        if (bienTheRepository.findBySanPham_MaSanPhamAndKichCo_MaKichCoAndMauSac_MaMauSac(
                productId, request.getMaKichCo(), request.getMaMauSac()).isPresent()) {
            throw new DuplicateResourceException("Biến thể đã tồn tại cho size " + kichCo.getKichCo() + " và màu " + mauSac.getMauSac());
        }
        ThuongHieu thuongHieu = thuongHieuRepository.findById(request.getMaThuongHieu())
                .orElseThrow(() -> new ResourceNotFoundException("Brand", request.getMaThuongHieu()));
        BienTheSanPham variant = bienTheRepository.save(BienTheSanPham.builder()
                .sanPham(product)
                .thuongHieu(thuongHieu)
                .kichCo(kichCo)
                .mauSac(mauSac)
                .sku(request.getSku())
                .gia(request.getGia())
                .urlAnh(request.getUrlAnh())
                .tonKho(request.getTonKho() != null ? request.getTonKho() : 0)
                .build());
        recalculateGiaTrungBinh(product);
        return variant;
    }

    @Transactional
    public BienTheSanPham updateVariant(Integer variantId, BienTheRequest request) {
        BienTheSanPham variant = bienTheRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Variant", variantId));
        if (request.getSku() != null) variant.setSku(request.getSku());
        if (request.getMaThuongHieu() != null) {
            variant.setThuongHieu(thuongHieuRepository.findById(request.getMaThuongHieu())
                    .orElseThrow(() -> new ResourceNotFoundException("Brand", request.getMaThuongHieu())));
        }
        if (request.getMaKichCo() != null) {
            variant.setKichCo(kichCoRepository.findById(request.getMaKichCo())
                    .orElseThrow(() -> new ResourceNotFoundException("Size", request.getMaKichCo())));
        }
        if (request.getMaMauSac() != null) {
            variant.setMauSac(mauSacRepository.findById(request.getMaMauSac())
                    .orElseThrow(() -> new ResourceNotFoundException("Color", request.getMaMauSac())));
        }
        if (request.getGia() != null) variant.setGia(request.getGia());
        if (request.getTonKho() != null) variant.setTonKho(request.getTonKho());
        if (request.getUrlAnh() != null) variant.setUrlAnh(request.getUrlAnh());
        variant = bienTheRepository.save(variant);
        recalculateGiaTrungBinh(variant.getSanPham());
        return variant;
    }

    @Transactional
    public Map<String, String> deleteVariant(Integer variantId) {
        BienTheSanPham variant = bienTheRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Variant", variantId));
        variant.setNgayXoa(LocalDateTime.now());
        bienTheRepository.save(variant);
        return Map.of("message", "Variant deleted");
    }

    public List<AnhSanPham> getImages(Integer variantId) {
        return anhSanPhamRepository.findByBienThe_MaBienTheOrderByThuTuHienThiAsc(variantId);
    }

    @Transactional
    public AnhSanPham addImage(Integer variantId, String url) {
        BienTheSanPham variant = bienTheRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Variant", variantId));
        return anhSanPhamRepository.save(AnhSanPham.builder()
                .bienThe(variant)
                .urlAnh(url)
                .build());
    }

    @Transactional
    public Map<String, String> deleteImage(Integer imageId) {
        anhSanPhamRepository.deleteById(imageId);
        return Map.of("message", "Image deleted");
    }

    @Transactional
    public Map<String, Object> toggleStatus(Integer id) {
        SanPham product = getById(id);
        product.setTrangThai(Integer.valueOf(1).equals(product.getTrangThai()) ? 0 : 1);
        sanPhamRepository.save(product);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("maSanPham", product.getMaSanPham());
        result.put("trangThai", product.getTrangThai());
        result.put("message", "Cập nhật trạng thái thành công");
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllVariantsFlat() {
        List<SanPham> products = sanPhamRepository.findByNgayXoaIsNull();
        List<Map<String, Object>> result = new java.util.ArrayList<>();
        for (SanPham p : products) {
            List<BienTheSanPham> variants = bienTheRepository.findBySanPham_MaSanPhamAndNgayXoaIsNull(p.getMaSanPham());
            if (variants.isEmpty()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("maSanPham", p.getMaSanPham());
                row.put("tenSanPham", p.getTenSanPham());
                row.put("slug", p.getSlug());
                row.put("urlAnhDaiDien", p.getUrlAnhDaiDien());
                row.put("trangThai", p.getTrangThai());
                row.put("mauSac", "-");
                row.put("kichCo", "-");
                row.put("gia", p.getGiaTrungBinh() != null ? p.getGiaTrungBinh() : 0);
                row.put("tonKho", 0);
                row.put("sku", "-");
                result.add(row);
            } else {
                for (BienTheSanPham v : variants) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("maSanPham", p.getMaSanPham());
                    row.put("tenSanPham", p.getTenSanPham());
                    row.put("slug", p.getSlug());
                    row.put("urlAnhDaiDien", p.getUrlAnhDaiDien() != null ? p.getUrlAnhDaiDien() : v.getUrlAnh());
                    row.put("trangThai", p.getTrangThai());
                    row.put("mauSac", v.getMauSac() != null ? v.getMauSac().getMauSac() : "-");
                    row.put("maMauSac", v.getMauSac() != null ? v.getMauSac().getMaMauSac() : null);
                    row.put("maMauHex", v.getMauSac() != null ? v.getMauSac().getMaMauHex() : null);
                    row.put("kichCo", v.getKichCo() != null ? v.getKichCo().getKichCo() : "-");
                    row.put("maKichCo", v.getKichCo() != null ? v.getKichCo().getMaKichCo() : null);
                    row.put("gia", v.getGia() != null ? v.getGia() : 0);
                    row.put("tonKho", v.getTonKho() != null ? v.getTonKho() : 0);
                    row.put("sku", v.getSku() != null ? v.getSku() : "-");
                    result.add(row);
                }
            }
        }
        return result;
    }

    private void recalculateGiaTrungBinh(SanPham product) {
        List<BienTheSanPham> allVariants = bienTheRepository.findBySanPham_MaSanPham(product.getMaSanPham());
        List<BienTheSanPham> withPrice = allVariants.stream().filter(v -> v.getGia() != null).toList();
        if (withPrice.isEmpty()) {
            product.setGiaTrungBinh(null);
        } else {
            BigDecimal sum = withPrice.stream().map(BienTheSanPham::getGia).reduce(BigDecimal.ZERO, BigDecimal::add);
            product.setGiaTrungBinh(sum.divide(BigDecimal.valueOf(withPrice.size()), 0, RoundingMode.HALF_UP));
        }
        sanPhamRepository.save(product);
    }
}