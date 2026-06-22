package com.example.zeststore.controller;

import com.example.zeststore.dto.request.CategoryRequest;
import com.example.zeststore.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(categoryService.getCategoryTree());
    }

    @GetMapping("/roots")
    public ResponseEntity<?> getRoots() {
        return ResponseEntity.ok(categoryService.getRootCategories());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(categoryService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> create(@Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(categoryService.create(
                request.getTenDanhMuc(), request.getSlug(), request.getMaDanhMucCha()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> update(@PathVariable Integer id, @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(categoryService.update(
                id, request.getTenDanhMuc(), request.getSlug(), request.getMaDanhMucCha()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        return ResponseEntity.ok(categoryService.delete(id));
    }
}
