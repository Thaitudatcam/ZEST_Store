package com.example.zeststore.service;

import com.example.zeststore.entity.DanhMuc;
import com.example.zeststore.exception.DuplicateResourceException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.DanhMucRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final DanhMucRepository danhMucRepository;

    public List<DanhMuc> getAll() {
        return danhMucRepository.findAll();
    }

    public List<DanhMuc> getRootCategories() {
        return danhMucRepository.findByDanhMucChaIsNull();
    }

    public List<Map<String, Object>> getCategoryTree() {
        List<DanhMuc> roots = danhMucRepository.findByDanhMucChaIsNull();
        return roots.stream().map(this::buildTree).collect(Collectors.toList());
    }

    private Map<String, Object> buildTree(DanhMuc category) {
        List<DanhMuc> children = danhMucRepository.findByDanhMucCha_MaDanhMuc(category.getMaDanhMuc());
        return Map.of(
                "maDanhMuc", category.getMaDanhMuc(),
                "tenDanhMuc", category.getTenDanhMuc(),
                "slug", category.getDuongDanSlug(),
                "children", children.stream().map(this::buildTree).collect(Collectors.toList())
        );
    }

    public DanhMuc getById(Integer id) {
        return danhMucRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
    }

    @Transactional
    public DanhMuc create(String tenDanhMuc, String slug, Integer parentId) {
        if (danhMucRepository.findByDuongDanSlug(slug).isPresent()) {
            throw new DuplicateResourceException("Slug already exists: " + slug);
        }
        DanhMuc parent = null;
        if (parentId != null) {
            parent = danhMucRepository.findById(parentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category", parentId));
        }
        return danhMucRepository.save(DanhMuc.builder()
                .tenDanhMuc(tenDanhMuc)
                .duongDanSlug(slug)
                .danhMucCha(parent)
                .build());
    }

    @Transactional
    public DanhMuc update(Integer id, String tenDanhMuc, String slug, Integer parentId) {
        DanhMuc category = getById(id);
        if (tenDanhMuc != null) category.setTenDanhMuc(tenDanhMuc);
        if (slug != null && !slug.equals(category.getDuongDanSlug())) {
            if (danhMucRepository.findByDuongDanSlug(slug).isPresent()) {
                throw new DuplicateResourceException("Slug already exists: " + slug);
            }
            category.setDuongDanSlug(slug);
        }
        if (parentId != null) {
            category.setDanhMucCha(danhMucRepository.findById(parentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category", parentId)));
        } else if (parentId == null && category.getDanhMucCha() != null) {
            category.setDanhMucCha(null);
        }
        return danhMucRepository.save(category);
    }

    @Transactional
    public Map<String, String> delete(Integer id) {
        DanhMuc category = getById(id);
        category.setNgayXoa(LocalDateTime.now());
        danhMucRepository.save(category);
        return Map.of("message", "Category deleted");
    }
}
