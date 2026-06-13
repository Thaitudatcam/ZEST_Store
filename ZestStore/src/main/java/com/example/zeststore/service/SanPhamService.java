package com.example.zeststore.service;

import com.example.zeststore.dto.request.BienTheRequest;
import com.example.zeststore.dto.request.SanPhamRequest;
import com.example.zeststore.entity.*;
import com.example.zeststore.exception.BadRequestException;
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
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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

    public Page<SanPham> getProducts(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return sanPhamRepository.findByTrangThaiAndNgayXoaIsNull("active", pageable);
    }

    public Page<SanPham> searchProducts(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return sanPhamRepository.searchByKeyword(keyword, pageable);
    }

    public Page<SanPham> filterProducts(Integer categoryId, BigDecimal minPrice, BigDecimal maxPrice,
                                         int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return sanPhamRepository.filterProducts(categoryId, minPrice, maxPrice, pageable);
    }

    public SanPham getBySlug(String slug) {
        return sanPhamRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + slug));
    }

    public SanPham getById(Integer id) {
        return sanPhamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
    }

    public Map<String, Object> getProductDetail(Integer id) {
        SanPham product = getById(id);
        List<BienTheSanPham> variants = bienTheRepository.findBySanPham_MaSanPham(id);
        List<AnhSanPham> images = anhSanPhamRepository.findBySanPham_MaSanPhamAndNgayXoaIsNull(id);
        Double avgRating = danhGiaRepository.averageRatingBySanPhamId(id);
        Long reviewCount = danhGiaRepository.countBySanPhamId(id);

        List<String> sizes = bienTheRepository.findDistinctKichCoBySanPhamId(id);
        List<String> colors = bienTheRepository.findDistinctMauSacBySanPhamId(id);

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
    public SanPham createProduct(SanPhamRequest request) {
        DanhMuc category = danhMucRepository.findById(request.getMaDanhMuc())
                .orElseThrow(() -> new ResourceNotFoundException("Category", request.getMaDanhMuc()));
        return sanPhamRepository.save(SanPham.builder()
                .danhMuc(category)
                .tenSanPham(request.getTenSanPham())
                .slug(request.getSlug())
                .moTa(request.getMoTa())
                .moTaAi(request.getMoTaAi())
                .gia(request.getGia())
                .trangThai(request.getTrangThai() != null ? request.getTrangThai() : "active")
                .build());
    }

    @Transactional
    public SanPham updateProduct(Integer id, SanPhamRequest request) {
        SanPham product = getById(id);
        if (request.getMaDanhMuc() != null) {
            product.setDanhMuc(danhMucRepository.findById(request.getMaDanhMuc())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", request.getMaDanhMuc())));
        }
        if (request.getTenSanPham() != null) product.setTenSanPham(request.getTenSanPham());
        if (request.getSlug() != null) product.setSlug(request.getSlug());
        if (request.getMoTa() != null) product.setMoTa(request.getMoTa());
        if (request.getMoTaAi() != null) product.setMoTaAi(request.getMoTaAi());
        if (request.getGia() != null) product.setGia(request.getGia());
        if (request.getTrangThai() != null) product.setTrangThai(request.getTrangThai());
        return sanPhamRepository.save(product);
    }

    @Transactional
    public void deleteProduct(Integer id) {
        SanPham product = getById(id);
        product.setNgayXoa(LocalDateTime.now());
        sanPhamRepository.save(product);
    }

    public List<BienTheSanPham> getVariants(Integer productId) {
        return bienTheRepository.findBySanPham_MaSanPham(productId);
    }

    @Transactional
    public BienTheSanPham createVariant(Integer productId, BienTheRequest request) {
        SanPham product = getById(productId);
        if (bienTheRepository.findBySku(request.getSku()).isPresent()) {
            throw new BadRequestException("SKU already exists: " + request.getSku());
        }
        return bienTheRepository.save(BienTheSanPham.builder()
                .sanPham(product)
                .sku(request.getSku())
                .kichCo(request.getKichCo())
                .mauSac(request.getMauSac())
                .gia(request.getGia())
                .urlAnh(request.getUrlAnh())
                .tonKho(request.getTonKho() != null ? request.getTonKho() : 0)
                .build());
    }

    @Transactional
    public BienTheSanPham updateVariant(Integer variantId, BienTheRequest request) {
        BienTheSanPham variant = bienTheRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Variant", variantId));
        if (request.getSku() != null) variant.setSku(request.getSku());
        if (request.getKichCo() != null) variant.setKichCo(request.getKichCo());
        if (request.getMauSac() != null) variant.setMauSac(request.getMauSac());
        if (request.getGia() != null) variant.setGia(request.getGia());
        if (request.getTonKho() != null) variant.setTonKho(request.getTonKho());
        if (request.getUrlAnh() != null) variant.setUrlAnh(request.getUrlAnh());
        return bienTheRepository.save(variant);
    }

    @Transactional
    public void deleteVariant(Integer variantId) {
        BienTheSanPham variant = bienTheRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Variant", variantId));
        variant.setNgayXoa(LocalDateTime.now());
        bienTheRepository.save(variant);
    }

    public List<AnhSanPham> getImages(Integer productId) {
        return anhSanPhamRepository.findBySanPham_MaSanPhamAndNgayXoaIsNull(productId);
    }

    @Transactional
    public AnhSanPham addImage(Integer productId, String url, boolean isMain) {
        SanPham product = getById(productId);
        if (isMain) {
            anhSanPhamRepository.findBySanPham_MaSanPhamAndLaAnhChinhTrueAndNgayXoaIsNull(productId)
                    .ifPresent(img -> {
                        img.setLaAnhChinh(false);
                        anhSanPhamRepository.save(img);
                    });
        }
        return anhSanPhamRepository.save(AnhSanPham.builder()
                .sanPham(product)
                .urlAnh(url)
                .laAnhChinh(isMain)
                .build());
    }

    @Transactional
    public void deleteImage(Integer imageId) {
        AnhSanPham image = anhSanPhamRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Image", imageId));
        image.setNgayXoa(LocalDateTime.now());
        anhSanPhamRepository.save(image);
    }
}
