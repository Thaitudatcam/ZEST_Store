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
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
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
    private final MucGioHangRepository mucGioHangRepository;
    private final PosCartRepository posCartRepository;
    private final ThuocTinhRepository thuocTinhRepository;
    private final InventoryService inventoryService;
    private final CampaignDiscountService campaignDiscountService;

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
        populateDiscount(result);
        return result;
    }

    public Page<SanPham> searchProducts(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<SanPham> result = sanPhamRepository.searchByKeyword(keyword, pageable);
        populateStock(result);
        populateDiscount(result);
        return result;
    }

    public Page<SanPham> filterProducts(Integer categoryId, BigDecimal minPrice, BigDecimal maxPrice,
                                         int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<SanPham> result;
        if (minPrice != null || maxPrice != null) {
            result = sanPhamRepository.filterProducts(categoryId, minPrice, maxPrice, pageable);
        } else {
            result = sanPhamRepository.filterProductsByCategory(categoryId, pageable);
        }
        populateStock(result);
        populateDiscount(result);
        return result;
    }

    /** Gán % giảm giá chương trình lên SP ở các trang bán hàng (không dùng cho admin/POS). */
    private void populateDiscount(Page<SanPham> page) {
        if (page.isEmpty()) return;
        Map<Integer, BigDecimal> minPriceMap = new HashMap<>();
        for (SanPham sp : page.getContent()) {
            if (sp.getGiaThapNhat() != null) minPriceMap.put(sp.getMaSanPham(), sp.getGiaThapNhat());
        }
        if (minPriceMap.isEmpty()) return;
        Map<Integer, BigDecimal> pctMap = campaignDiscountService.pctByProductIds(minPriceMap);
        page.getContent().forEach(sp -> sp.setPhanTramGiamGia(pctMap.get(sp.getMaSanPham())));
    }

    private static final Set<String> SEARCH_STOP_WORDS = Set.of(
            "tôi", "mình", "muốn", "mua", "cần", "có", "không", "bạn", "cho",
            "hãy", "giúp", "tư", "vấn", "gợi", "ý", "thì", "mà", "và", "của",
            "một", "những", "các", "loại", "thích", "hợp", "nhé", "ạ", "ơi",
            "được", "bị", "ra", "rồi", "nào", "với", "hộ", "em", "màu", "cỡ",
            "size", "giá", "khoảng", "dưới", "trên", "khoang", "từ", "đến", "đ",
            "mặc", "thoải", "mái", "chất", "liệu", "vải", "sản", "phẩm", "xin", "chào", "gửi"
    );

    private List<String> extractSearchKeywords(String input) {
        if (input == null || input.isBlank()) return List.of();
        String normalized = input.toLowerCase(Locale.ROOT)
                .replaceAll("[?!.,:;\"'()\\[\\]]+", " ");
        String[] words = normalized.split("\\s+");
        List<String> tokens = new ArrayList<>();
        for (String w : words) {
            String word = w.trim();
            if (word.isEmpty() || SEARCH_STOP_WORDS.contains(word)) continue;
            tokens.add(word);
        }
        return tokens;
    }

    public List<Map<String, Object>> searchSuggestions(String keyword, int limit) {
        List<String> tokens = extractSearchKeywords(keyword);

        Set<Integer> seen = new LinkedHashSet<>();
        List<SanPham> results = new ArrayList<>();
        if (!tokens.isEmpty()) {
            for (String token : tokens) {
                Pageable pageable = PageRequest.of(0, limit);
                Page<SanPham> page = sanPhamRepository.searchByKeyword(token, pageable);
                for (SanPham sp : page.getContent()) {
                    if (seen.add(sp.getMaSanPham())) results.add(sp);
                }
                if (results.size() >= limit) break;
            }
        }

        // Không tìm thấy từ khóa nào -> trả về sản phẩm đang bán mới nhất
        if (results.isEmpty()) {
            List<SanPham> fallback = sanPhamRepository
                    .findTop10ByTrangThaiAndNgayXoaIsNullOrderByNgayTaoDesc(1);
            results.addAll(fallback);
        }

        List<SanPham> top = results.size() > limit
                ? results.subList(0, limit) : results;

        List<Integer> ids = top.stream().map(SanPham::getMaSanPham).collect(Collectors.toList());
        Map<Integer, BigDecimal> minGiaMap = Map.of();
        Map<Integer, Integer> stockMap = Map.of();
        if (!ids.isEmpty()) {
            minGiaMap = bienTheRepository.minGiaBySanPhamIds(ids).stream()
                    .collect(Collectors.toMap(row -> ((Number) row[0]).intValue(),
                            row -> row[1] instanceof BigDecimal ? (BigDecimal) row[1] : BigDecimal.valueOf(((Number) row[1]).doubleValue())));
            stockMap = bienTheRepository.sumTonKhoBySanPhamIds(ids).stream()
                    .collect(Collectors.toMap(row -> ((Number) row[0]).intValue(),
                            row -> ((Number) row[1]).intValue()));
        }
        Map<Integer, BigDecimal> finalMinGiaMap = minGiaMap;
        Map<Integer, Integer> finalStockMap = stockMap;
        top.forEach(sp -> {
            sp.setGiaThapNhat(finalMinGiaMap.get(sp.getMaSanPham()));
            sp.setTongTonKho(finalStockMap.getOrDefault(sp.getMaSanPham(), 0));
        });

        List<Integer> topIds = top.stream().map(SanPham::getMaSanPham).collect(Collectors.toList());
        Map<Integer, List<String>> colorsMap = new HashMap<>();
        Map<Integer, List<String>> sizesMap = new HashMap<>();
        Map<Integer, String> brandMap = new HashMap<>();
        if (!topIds.isEmpty()) {
            List<BienTheSanPham> allVariants = bienTheRepository.findBySanPham_MaSanPhamIn(topIds);
            for (BienTheSanPham bt : allVariants) {
                if (bt.getMauSac() != null) {
                    colorsMap.computeIfAbsent(bt.getSanPham().getMaSanPham(), k -> new ArrayList<>())
                            .add(bt.getMauSac().getMauSac());
                }
                if (bt.getKichCo() != null) {
                    sizesMap.computeIfAbsent(bt.getSanPham().getMaSanPham(), k -> new ArrayList<>())
                            .add(bt.getKichCo().getKichCo());
                }
                if (bt.getThuongHieu() != null && !brandMap.containsKey(bt.getSanPham().getMaSanPham())) {
                    brandMap.put(bt.getSanPham().getMaSanPham(), bt.getThuongHieu().getTenThuongHieu());
                }
            }
        }

        return top.stream().map(sp -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("maSanPham", sp.getMaSanPham());
            m.put("maSanPhamCode", sp.getMaSanPhamCode());
            m.put("tenSanPham", sp.getTenSanPham());
            m.put("slug", sp.getSlug());
            m.put("urlAnhDaiDien", sp.getUrlAnhDaiDien());
            m.put("gia", sp.getGiaThapNhat() != null ? sp.getGiaThapNhat() : sp.getGiaTrungBinh());
            m.put("giaThapNhat", sp.getGiaThapNhat());
            m.put("tongTonKho", sp.getTongTonKho());
            m.put("chatLieu", sp.getChatLieu() != null ? sp.getChatLieu().getGiaTri() : null);
            m.put("mauSac", colorsMap.getOrDefault(sp.getMaSanPham(), Collections.emptyList()).stream().distinct().toList());
            m.put("kichCo", sizesMap.getOrDefault(sp.getMaSanPham(), Collections.emptyList()).stream().distinct().toList());
            m.put("thuongHieu", brandMap.get(sp.getMaSanPham()));
            return m;
        }).collect(Collectors.toList());
    }

    private static final Set<String> MOST_EXPENSIVE_KEYWORDS = Set.of(
            "đắt", "đắt nhất", "giá cao", "giá cao nhất", "mắc", "mắc nhất", "cao cấp nhất"
    );
    private static final Set<String> CHEAPEST_KEYWORDS = Set.of(
            "rẻ", "rẻ nhất", "giá rẻ", "giá thấp", "giá thấp nhất", "hời", "hời nhất", "tiết kiệm nhất"
    );

    private static final Map<String, Integer> VIETNAMESE_NUMBERS = Map.ofEntries(
            Map.entry("một", 1), Map.entry("hai", 2), Map.entry("ba", 3),
            Map.entry("bốn", 4), Map.entry("bon", 4), Map.entry("năm", 5),
            Map.entry("sáu", 6), Map.entry("sau", 6), Map.entry("bảy", 7),
            Map.entry("bay", 7), Map.entry("tám", 8), Map.entry("tam", 8),
            Map.entry("chín", 9), Map.entry("chin", 9), Map.entry("mười", 10)
    );

    private int extractQuantity(String keyword) {
        String lower = keyword.toLowerCase(Locale.ROOT);
        for (var entry : VIETNAMESE_NUMBERS.entrySet()) {
            if (lower.contains(entry.getKey())) return Math.min(entry.getValue(), 10);
        }
        String digits = lower.replaceAll("[^0-9]", "");
        if (!digits.isEmpty()) {
            int n = Integer.parseInt(digits);
            return Math.max(1, Math.min(n, 10));
        }
        return 1;
    }

    public List<Map<String, Object>> searchByPriceQuery(String keyword, int defaultLimit) {
        if (keyword == null || keyword.isBlank()) return List.of();
        String normalized = keyword.toLowerCase(Locale.ROOT).trim();
        boolean isMostExpensive = MOST_EXPENSIVE_KEYWORDS.stream().anyMatch(normalized::contains);
        boolean isCheapest = CHEAPEST_KEYWORDS.stream().anyMatch(normalized::contains);
        if (!isMostExpensive && !isCheapest) return List.of();

        int limit = extractQuantity(keyword);
        List<SanPham> results;
        if (isMostExpensive) {
            results = sanPhamRepository.findTopByPriceDesc(PageRequest.of(0, limit));
        } else {
            results = sanPhamRepository.findTopByPriceAsc(PageRequest.of(0, limit));
        }
        if (results.isEmpty()) return List.of();

        List<Integer> ids = results.stream().map(SanPham::getMaSanPham).collect(Collectors.toList());
        Map<Integer, BigDecimal> minGiaMap = bienTheRepository.minGiaBySanPhamIds(ids).stream()
                .collect(Collectors.toMap(row -> ((Number) row[0]).intValue(),
                        row -> row[1] instanceof BigDecimal ? (BigDecimal) row[1] : BigDecimal.valueOf(((Number) row[1]).doubleValue())));
        Map<Integer, Integer> stockMap = bienTheRepository.sumTonKhoBySanPhamIds(ids).stream()
                .collect(Collectors.toMap(row -> ((Number) row[0]).intValue(),
                        row -> ((Number) row[1]).intValue()));
        results.forEach(sp -> {
            sp.setGiaThapNhat(minGiaMap.get(sp.getMaSanPham()));
            sp.setTongTonKho(stockMap.getOrDefault(sp.getMaSanPham(), 0));
        });

        List<Integer> topIds = results.stream().map(SanPham::getMaSanPham).collect(Collectors.toList());
        Map<Integer, List<String>> colorsMap = new HashMap<>();
        Map<Integer, List<String>> sizesMap = new HashMap<>();
        Map<Integer, String> brandMap = new HashMap<>();
        List<BienTheSanPham> allVariants = bienTheRepository.findBySanPham_MaSanPhamIn(topIds);
        for (BienTheSanPham bt : allVariants) {
            if (bt.getMauSac() != null) {
                colorsMap.computeIfAbsent(bt.getSanPham().getMaSanPham(), k -> new ArrayList<>())
                        .add(bt.getMauSac().getMauSac());
            }
            if (bt.getKichCo() != null) {
                sizesMap.computeIfAbsent(bt.getSanPham().getMaSanPham(), k -> new ArrayList<>())
                        .add(bt.getKichCo().getKichCo());
            }
            if (bt.getThuongHieu() != null && !brandMap.containsKey(bt.getSanPham().getMaSanPham())) {
                brandMap.put(bt.getSanPham().getMaSanPham(), bt.getThuongHieu().getTenThuongHieu());
            }
        }

        return results.stream().map(sp -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("maSanPham", sp.getMaSanPham());
            m.put("maSanPhamCode", sp.getMaSanPhamCode());
            m.put("tenSanPham", sp.getTenSanPham());
            m.put("slug", sp.getSlug());
            m.put("urlAnhDaiDien", sp.getUrlAnhDaiDien());
            m.put("gia", sp.getGiaThapNhat() != null ? sp.getGiaThapNhat() : sp.getGiaTrungBinh());
            m.put("giaThapNhat", sp.getGiaThapNhat());
            m.put("tongTonKho", sp.getTongTonKho());
            m.put("chatLieu", sp.getChatLieu() != null ? sp.getChatLieu().getGiaTri() : null);
            m.put("mauSac", colorsMap.getOrDefault(sp.getMaSanPham(), Collections.emptyList()).stream().distinct().toList());
            m.put("kichCo", sizesMap.getOrDefault(sp.getMaSanPham(), Collections.emptyList()).stream().distinct().toList());
            m.put("thuongHieu", brandMap.get(sp.getMaSanPham()));
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
        List<Object[]> brandData = bienTheRepository.findBrandNamesBySanPhamIds(ids);
        Map<Integer, List<String>> brandMap = new HashMap<>();
        for (Object[] row : brandData) {
            int maSp = ((Number) row[0]).intValue();
            brandMap.computeIfAbsent(maSp, k -> new ArrayList<>()).add((String) row[1]);
        }
        page.getContent().forEach(sp -> sp.setTenThuongHieu(String.join(", ", brandMap.getOrDefault(sp.getMaSanPham(), List.of()))));
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
        List<BienTheSanPham> variants = bienTheRepository.findBySanPham_MaSanPhamAndNgayXoaIsNull(id);
        variants.forEach(v -> v.setTonKhoKhaDung(Math.max(0, v.getTonKho() - inventoryService.reserved(v.getMaBienThe(), null, null))));
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
        campaignDiscountService.applyToVariants(variants);
        product.setPhanTramGiamGia(variants.stream()
                .map(BienTheSanPham::getPhanTramGiamGia)
                .filter(java.util.Objects::nonNull)
                .max(BigDecimal::compareTo)
                .orElse(null));

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
            ThuongHieu thuongHieu = thuongHieuRepository.findById(req.getMaThuongHieu())
                    .orElseThrow(() -> new ResourceNotFoundException("Brand", req.getMaThuongHieu()));
            KichCo kichCo = kichCoRepository.findById(req.getMaKichCo())
                    .orElseThrow(() -> new ResourceNotFoundException("Size", req.getMaKichCo()));
            MauSac mauSac = mauSacRepository.findById(req.getMaMauSac())
                    .orElseThrow(() -> new ResourceNotFoundException("Color", req.getMaMauSac()));
            if (bienTheRepository.findBySanPham_MaSanPhamAndKichCo_MaKichCoAndMauSac_MaMauSacAndNgayXoaIsNull(
                    productId, req.getMaKichCo(), req.getMaMauSac()).isPresent()) {
                throw new DuplicateResourceException("Variant already exists for size " + kichCo.getKichCo() + " and color " + mauSac.getMauSac());
            }
            BienTheSanPham variant = BienTheSanPham.builder()
                    .sanPham(product).thuongHieu(thuongHieu).kichCo(kichCo).mauSac(mauSac)
                    .sku(generateSku(product, mauSac, kichCo)).gia(req.getGia()).urlAnh(req.getUrlAnh())
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
        DanhMuc category = danhMucRepository.findByMaDanhMucAndNgayXoaIsNull(request.getMaDanhMuc())
                .orElseThrow(() -> new ResourceNotFoundException("Category", request.getMaDanhMuc()));
        SanPham product = sanPhamRepository.save(SanPham.builder()
                .danhMuc(category)
                .tenSanPham(request.getTenSanPham())
                .slug(request.getSlug())
                .moTa(request.getMoTa())
                .moTaAi(request.getMoTaAi())
                .urlAnhDaiDien(request.getUrlAnhDaiDien())
                .xuatXu(request.getXuatXu())
                .loaiAo(resolveThuocTinh(request.getMaLoaiAo()))
                .kieuDang(resolveThuocTinh(request.getMaKieuDang()))
                .chatLieu(resolveThuocTinh(request.getMaChatLieu()))
                .coAo(resolveThuocTinh(request.getMaCoAo()))
                .tayAo(resolveThuocTinh(request.getMaTayAo()))
                .vaiAo(resolveThuocTinh(request.getMaVaiAo()))
                .trangThai(request.getTrangThai() != null ? request.getTrangThai() : 1)
                .build());
        product.setMaSanPhamCode(String.format("SP%04d", product.getMaSanPham()));
        return sanPhamRepository.save(product);
    }

    @Transactional
    public SanPham updateProduct(Integer id, SanPhamRequest request) {
        SanPham product = getById(id);
        if (request.getMaDanhMuc() != null) {
            product.setDanhMuc(danhMucRepository.findByMaDanhMucAndNgayXoaIsNull(request.getMaDanhMuc())
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
        if (request.getXuatXu() != null) product.setXuatXu(request.getXuatXu());
        if (request.getMaLoaiAo() != null) product.setLoaiAo(resolveThuocTinh(request.getMaLoaiAo()));
        if (request.getMaKieuDang() != null) product.setKieuDang(resolveThuocTinh(request.getMaKieuDang()));
        if (request.getMaChatLieu() != null) product.setChatLieu(resolveThuocTinh(request.getMaChatLieu()));
        if (request.getMaCoAo() != null) product.setCoAo(resolveThuocTinh(request.getMaCoAo()));
        if (request.getMaTayAo() != null) product.setTayAo(resolveThuocTinh(request.getMaTayAo()));
        if (request.getMaVaiAo() != null) product.setVaiAo(resolveThuocTinh(request.getMaVaiAo()));
        if (request.getTrangThai() != null) product.setTrangThai(request.getTrangThai());
        return sanPhamRepository.save(product);
    }

    private ThuocTinh resolveThuocTinh(Integer maThuocTinh) {
        if (maThuocTinh == null) return null;
        return thuocTinhRepository.findById(maThuocTinh).orElse(null);
    }

    @Transactional
    public Map<String, String> deleteProduct(Integer id) {
        SanPham product = getById(id);
        product.setNgayXoa(LocalDateTime.now());
        sanPhamRepository.save(product);
        return Map.of("message", "Product deleted");
    }

    public List<BienTheSanPham> getVariants(Integer productId) {
        List<BienTheSanPham> variants = bienTheRepository.findBySanPham_MaSanPham(productId);
        variants.forEach(v -> v.setTonKhoKhaDung(Math.max(0, v.getTonKho() - inventoryService.reserved(v.getMaBienThe(), null, null))));
        campaignDiscountService.applyToVariants(variants);
        return variants;
    }

    @Transactional
    public SanPham createProductWithVariants(SanPhamRequest productReq, List<BienTheRequest> variantReqs) {
        if (variantReqs == null || variantReqs.isEmpty()) {
            throw new BadRequestException("Sản phẩm phải có ít nhất một biến thể");
        }
        SanPham product = createProduct(productReq);
        for (BienTheRequest req : variantReqs) {
            createVariant(product.getMaSanPham(), req);
        }
        return sanPhamRepository.findById(product.getMaSanPham()).get();
    }

    @Transactional
    public BienTheSanPham createVariant(Integer productId, BienTheRequest request) {
        SanPham product = getById(productId);
        KichCo kichCo = kichCoRepository.findById(request.getMaKichCo())
                .orElseThrow(() -> new ResourceNotFoundException("Size", request.getMaKichCo()));
        MauSac mauSac = mauSacRepository.findById(request.getMaMauSac())
                .orElseThrow(() -> new ResourceNotFoundException("Color", request.getMaMauSac()));
        if (bienTheRepository.findBySanPham_MaSanPhamAndKichCo_MaKichCoAndMauSac_MaMauSacAndNgayXoaIsNull(
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
                .sku(generateSku(product, mauSac, kichCo))
                .gia(request.getGia())
                .giaNhap(request.getGiaNhap() != null ? request.getGiaNhap() : BigDecimal.ZERO)
                .urlAnh(request.getUrlAnh())
                .tonKho(request.getTonKho() != null ? request.getTonKho() : 0)
                .build());
        recalculateGiaTrungBinh(product);
        return variant;
    }

    private String generateSku(SanPham product, MauSac mauSac, KichCo kichCo) {
        String baseSku = String.format("SP%03d", product.getMaSanPham())
                + "-" + skuPart(mauSac.getMauSac())
                + "-" + skuPart(kichCo.getKichCo());
        String sku = baseSku;
        int suffix = 2;
        while (bienTheRepository.findBySku(sku).isPresent()) {
            sku = baseSku + "-" + suffix++;
        }
        return sku;
    }

    private String skuPart(String value) {
        String normalized = Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9]+", "-")
                .replaceAll("(^-+|-+$)", "");
        return normalized.isBlank() ? "NA" : normalized;
    }

    @Transactional
    public BienTheSanPham updateVariant(Integer variantId, BienTheRequest request) {
        BienTheSanPham variant = inventoryService.lockVariant(variantId);
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
        if (request.getGiaNhap() != null) variant.setGiaNhap(request.getGiaNhap());
        if (request.getTonKho() != null) {
            if (request.getVersion() == null || request.getVersion() != variant.getVersion())
                throw new org.springframework.orm.ObjectOptimisticLockingFailureException(BienTheSanPham.class, variantId);
            if (request.getTonKho() < inventoryService.reserved(variantId, null, null))
                throw new BadRequestException("Tồn kho không được thấp hơn số hàng đang giữ cho đơn/POS");
            variant.setTonKho(request.getTonKho());
        }
        if (request.getUrlAnh() != null) variant.setUrlAnh(request.getUrlAnh());
        variant = bienTheRepository.save(variant);
        recalculateGiaTrungBinh(variant.getSanPham());
        return variant;
    }

    @Transactional
    public Map<String, String> deleteVariant(Integer variantId) {
        BienTheSanPham variant = inventoryService.lockVariant(variantId);
        assertNoReservation(variantId);
        variant.setNgayXoa(LocalDateTime.now());
        bienTheRepository.save(variant);
        mucGioHangRepository.findByBienThe_MaBienThe(variantId).forEach(mucGioHangRepository::delete);
        posCartRepository.findByBienThe_MaBienThe(variantId).forEach(posCartRepository::delete);
        return Map.of("message", "Variant deleted");
    }

    @Transactional
    public Map<String, Object> deleteVariantsByColor(Integer productId, Integer colorId) {
        List<BienTheSanPham> variants = bienTheRepository
                .findBySanPham_MaSanPhamAndMauSac_MaMauSacAndNgayXoaIsNull(productId, colorId);
        if (variants.isEmpty()) {
            throw new ResourceNotFoundException("No variants found for color " + colorId);
        }
        variants.sort(java.util.Comparator.comparing(BienTheSanPham::getMaBienThe));
        for (BienTheSanPham v : variants) {
            inventoryService.lockVariant(v.getMaBienThe());
            assertNoReservation(v.getMaBienThe());
            v.setNgayXoa(LocalDateTime.now());
        }
        bienTheRepository.saveAll(variants);
        for (BienTheSanPham v : variants) {
            mucGioHangRepository.findByBienThe_MaBienThe(v.getMaBienThe()).forEach(mucGioHangRepository::delete);
            posCartRepository.findByBienThe_MaBienThe(v.getMaBienThe()).forEach(posCartRepository::delete);
        }
        recalculateGiaTrungBinh(getById(productId));
        return Map.of("message", "Deleted " + variants.size() + " variants", "deletedCount", variants.size());
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
        AnhSanPham image = anhSanPhamRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Image", imageId));
        image.setNgayXoa(LocalDateTime.now());
        anhSanPhamRepository.save(image);
        return Map.of("message", "Image hidden");
    }

    @Transactional
    public Map<String, String> toggleImage(Integer imageId) {
        AnhSanPham image = anhSanPhamRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Image", imageId));
        image.setNgayXoa(image.getNgayXoa() == null ? LocalDateTime.now() : null);
        anhSanPhamRepository.save(image);
        return Map.of("message", image.getNgayXoa() == null ? "Đã hiện ảnh" : "Đã ẩn ảnh");
    }

    @Transactional
    public Map<String, String> toggleVariant(Integer variantId) {
        BienTheSanPham variant = inventoryService.lockVariant(variantId);
        if (variant.getNgayXoa() == null) assertNoReservation(variantId);
        variant.setNgayXoa(variant.getNgayXoa() == null ? LocalDateTime.now() : null);
        bienTheRepository.save(variant);
        return Map.of("message", variant.getNgayXoa() == null ? "Đã hiện biến thể" : "Đã ẩn biến thể");
    }

    private void assertNoReservation(Integer variantId) {
        if (inventoryService.reserved(variantId, null, null) > 0)
            throw new BadRequestException("Biến thể đang được giữ cho đơn/POS, chưa thể xóa hoặc ẩn");
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

    @Transactional
    public Map<String, Object> toggleVariantStatus(Integer variantId) {
        BienTheSanPham v = bienTheRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biến thể"));
        v.setTrangThai(Integer.valueOf(1).equals(v.getTrangThai()) ? 0 : 1);
        bienTheRepository.save(v);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("maBienThe", v.getMaBienThe());
        result.put("trangThai", v.getTrangThai());
        result.put("message", "Cập nhật trạng thái biến thể thành công");
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllVariantsFlat() {
        List<SanPham> products = sanPhamRepository.findByNgayXoaIsNull();
        List<Map<String, Object>> result = new java.util.ArrayList<>();
        for (SanPham p : products) {
            List<BienTheSanPham> variants = bienTheRepository.findBySanPham_MaSanPhamAndNgayXoaIsNull(p.getMaSanPham());
            // Giá KM đợt cho quầy: gia = giá đã trừ, giaGoc = giá gốc
            campaignDiscountService.applyToVariants(variants);
            if (variants.isEmpty()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("maBienThe", null);
                row.put("maSanPham", p.getMaSanPham());
                row.put("tenSanPham", p.getTenSanPham());
                row.put("slug", p.getSlug());
                row.put("urlAnhDaiDien", p.getUrlAnhDaiDien());
                row.put("trangThai", p.getTrangThai());
                row.put("mauSac", "-");
                row.put("kichCo", "-");
                row.put("gia", p.getGiaTrungBinh() != null ? p.getGiaTrungBinh() : 0);
                row.put("giaNhap", 0);
                row.put("tonKho", 0);
                row.put("sku", "-");
                result.add(row);
            } else {
                for (BienTheSanPham v : variants) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    BigDecimal giaGoc = v.getGia() != null ? v.getGia() : BigDecimal.ZERO;
                    BigDecimal giaBan = CampaignDiscountService.discountedPrice(giaGoc, v.getPhanTramGiamGia());
                    row.put("maBienThe", v.getMaBienThe());
                    row.put("maSanPham", p.getMaSanPham());
                    row.put("tenSanPham", p.getTenSanPham());
                    row.put("slug", p.getSlug());
                    row.put("urlAnhDaiDien", p.getUrlAnhDaiDien() != null ? p.getUrlAnhDaiDien() : v.getUrlAnh());
                    row.put("trangThai", v.getTrangThai() != null ? v.getTrangThai() : p.getTrangThai());
                    row.put("mauSac", v.getMauSac() != null ? v.getMauSac().getMauSac() : "-");
                    row.put("maMauSac", v.getMauSac() != null ? v.getMauSac().getMaMauSac() : null);
                    row.put("maMauHex", v.getMauSac() != null ? v.getMauSac().getMaMauHex() : null);
                    row.put("kichCo", v.getKichCo() != null ? v.getKichCo().getKichCo() : "-");
                    row.put("maKichCo", v.getKichCo() != null ? v.getKichCo().getMaKichCo() : null);
                    row.put("gia", giaBan);
                    row.put("giaGoc", giaGoc);
                    row.put("phanTramGiamGia", v.getPhanTramGiamGia());
                    row.put("giaNhap", v.getGiaNhap() != null ? v.getGiaNhap() : 0);
                    row.put("tonKho", v.getTonKho() != null ? v.getTonKho() : 0);
                    row.put("tonKhoKhaDung", Math.max(0, (v.getTonKho() != null ? v.getTonKho() : 0) - inventoryService.reserved(v.getMaBienThe(), null, null)));
                    row.put("sku", v.getSku() != null ? v.getSku() : "-");
                    result.add(row);
                }
            }
        }
        result.sort(java.util.Comparator.comparingInt((Map<String, Object> row) -> {
            Object variantId = row.get("maBienThe");
            Object productId = row.get("maSanPham");
            return ((Number) (variantId != null ? variantId : productId)).intValue();
        }).reversed());
        return result;
    }

    @Transactional(readOnly = true)
    public Page<SanPham> filterAdminProducts(String keyword, Integer categoryId, Integer brandId,
                                              Integer status, BigDecimal minPrice, BigDecimal maxPrice,
                                              int page, int size) {
        Page<SanPham> result = sanPhamRepository.filterAdminProducts(
                keyword == null || keyword.isBlank() ? null : keyword.trim().replaceAll("\\s+", " "),
                categoryId, brandId, status, minPrice, maxPrice, PageRequest.of(page, size));
        populateStock(result);
        return result;
    }

    private void recalculateGiaTrungBinh(SanPham product) {
        List<BienTheSanPham> allVariants = bienTheRepository.findBySanPham_MaSanPhamAndNgayXoaIsNull(product.getMaSanPham());
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
