package com.example.zeststore.controller;

import com.example.zeststore.dto.request.BienTheRequest;
import com.example.zeststore.dto.request.SanPhamRequest;
import com.example.zeststore.service.SanPhamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class SanPhamController {

    private final SanPhamService sanPhamService;

    @GetMapping
    public ResponseEntity<?> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "ngayTao") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice) {

        if (keyword != null) {
            return ResponseEntity.ok(sanPhamService.searchProducts(keyword, page, size));
        }
        if (categoryId != null || minPrice != null || maxPrice != null) {
            return ResponseEntity.ok(sanPhamService.filterProducts(categoryId, minPrice, maxPrice, page, size));
        }
        return ResponseEntity.ok(sanPhamService.getProducts(page, size, sortBy, sortDir));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<?> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(sanPhamService.getProductDetail(
                sanPhamService.getBySlug(slug).getMaSanPham()));
    }

    @GetMapping("/detail/{id}")
    public ResponseEntity<?> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(sanPhamService.getProductDetail(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> create(@Valid @RequestBody SanPhamRequest request) {
        return ResponseEntity.ok(sanPhamService.createProduct(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> update(@PathVariable Integer id, @Valid @RequestBody SanPhamRequest request) {
        return ResponseEntity.ok(sanPhamService.updateProduct(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        sanPhamService.deleteProduct(id);
        return ResponseEntity.ok(Map.of("message", "Product deleted"));
    }

    @GetMapping("/{id}/variants")
    public ResponseEntity<?> getVariants(@PathVariable Integer id) {
        return ResponseEntity.ok(sanPhamService.getVariants(id));
    }

    @PostMapping("/{id}/variants")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createVariant(@PathVariable Integer id,
                                            @Valid @RequestBody BienTheRequest request) {
        return ResponseEntity.ok(sanPhamService.createVariant(id, request));
    }

    @PutMapping("/variants/{variantId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateVariant(@PathVariable Integer variantId,
                                            @Valid @RequestBody BienTheRequest request) {
        return ResponseEntity.ok(sanPhamService.updateVariant(variantId, request));
    }

    @DeleteMapping("/variants/{variantId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteVariant(@PathVariable Integer variantId) {
        sanPhamService.deleteVariant(variantId);
        return ResponseEntity.ok(Map.of("message", "Variant deleted"));
    }

    @GetMapping("/{id}/images/{variantId}")
    public ResponseEntity<?> getImages(@PathVariable Integer id,
                                       @PathVariable Integer variantId) {
        return ResponseEntity.ok(sanPhamService.getImages(variantId));
    }

    @PostMapping("/{id}/images/{variantId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addImage(@PathVariable Integer id,
                                       @PathVariable Integer variantId,
                                       @RequestBody Map<String, Object> body) {
        String url = (String) body.get("url");
        return ResponseEntity.ok(sanPhamService.addImage(variantId, url));
    }

    @DeleteMapping("/images/{imageId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteImage(@PathVariable Integer imageId) {
        sanPhamService.deleteImage(imageId);
        return ResponseEntity.ok(Map.of("message", "Image deleted"));
    }
}