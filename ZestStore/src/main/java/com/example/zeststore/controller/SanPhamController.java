package com.example.zeststore.controller;

import com.example.zeststore.dto.request.BienTheRequest;
import com.example.zeststore.dto.request.ImageRequest;
import com.example.zeststore.dto.request.SanPhamRequest;
import com.example.zeststore.service.SanPhamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

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
        return ResponseEntity.ok(sanPhamService.getProducts(
                keyword, categoryId, minPrice, maxPrice, page, size, sortBy, sortDir));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<?> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(sanPhamService.getProductDetailBySlug(slug));
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
        return ResponseEntity.ok(sanPhamService.deleteProduct(id));
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
        return ResponseEntity.ok(sanPhamService.deleteVariant(variantId));
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
                                       @Valid @RequestBody ImageRequest request) {
        return ResponseEntity.ok(sanPhamService.addImage(variantId, request.getUrl()));
    }

    @DeleteMapping("/images/{imageId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteImage(@PathVariable Integer imageId) {
        return ResponseEntity.ok(sanPhamService.deleteImage(imageId));
    }
}
