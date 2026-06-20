package com.example.zeststore.controller;

import com.example.zeststore.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        String tenDanhMuc = (String) body.get("tenDanhMuc");
        String slug = (String) body.get("slug");
        Integer parentId = (Integer) body.get("maDanhMucCha");
        return ResponseEntity.ok(categoryService.create(tenDanhMuc, slug, parentId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        String tenDanhMuc = (String) body.get("tenDanhMuc");
        String slug = (String) body.get("slug");
        Integer parentId = (Integer) body.get("maDanhMucCha");
        return ResponseEntity.ok(categoryService.update(id, tenDanhMuc, slug, parentId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        categoryService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Category deleted"));
    }
}
