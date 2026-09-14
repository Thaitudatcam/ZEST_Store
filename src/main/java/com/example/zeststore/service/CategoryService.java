package com.example.zeststore.service;

import com.example.zeststore.entity.DanhMuc;
import com.example.zeststore.exception.BadRequestException;
import com.example.zeststore.exception.DuplicateResourceException;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.DanhMucRepository;
import com.example.zeststore.repository.SanPhamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final DanhMucRepository danhMucRepository;
    private final SanPhamRepository sanPhamRepository;

    public List<DanhMuc> getAll() {
        return danhMucRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllActive() {
        return danhMucRepository.findAll().stream()
                .filter(d -> d.getNgayXoa() == null && (d.getHienThi() == null || d.getHienThi()))
                .map(d -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("maDanhMuc", d.getMaDanhMuc());
                    m.put("tenDanhMuc", d.getTenDanhMuc());
                    m.put("slug", d.getDuongDanSlug());
                    m.put("maDanhMucCha", d.getDanhMucCha() != null ? d.getDanhMucCha().getMaDanhMuc() : null);
                    return m;
                })
                .collect(Collectors.toList());
    }

    public List<DanhMuc> getRootCategories() {
        return danhMucRepository.findByDanhMucChaIsNullAndNgayXoaIsNull();
    }

    public List<Map<String, Object>> getCategoryTree() {
        List<DanhMuc> roots = danhMucRepository.findByDanhMucChaIsNullAndNgayXoaIsNull();
        return roots.stream().map(this::buildTree).collect(Collectors.toList());
    }

    private Map<String, Object> buildTree(DanhMuc category) {
        List<DanhMuc> children = danhMucRepository.findByDanhMucCha_MaDanhMucAndNgayXoaIsNull(category.getMaDanhMuc());
        Map<String, Object> node = new HashMap<>();
        node.put("maDanhMuc", category.getMaDanhMuc());
        node.put("tenDanhMuc", category.getTenDanhMuc());
        node.put("slug", category.getDuongDanSlug());
        node.put("maDanhMucCha", category.getDanhMucCha() != null ? category.getDanhMucCha().getMaDanhMuc() : null);
        node.put("hienThi", category.getHienThi());
        node.put("children", children.stream().map(this::buildTree).collect(Collectors.toList()));
        return node;
    }

    public DanhMuc getById(Integer id) {
        return danhMucRepository.findByMaDanhMucAndNgayXoaIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
    }

    @Transactional
    public DanhMuc create(String tenDanhMuc, String slug, Integer parentId, Boolean hienThi) {
        if (danhMucRepository.findByDuongDanSlugAndNgayXoaIsNull(slug).isPresent()) {
            throw new DuplicateResourceException("Slug already exists: " + slug);
        }
        DanhMuc parent = null;
        if (parentId != null) {
            parent = danhMucRepository.findByMaDanhMucAndNgayXoaIsNull(parentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category", parentId));
        }
        return danhMucRepository.save(DanhMuc.builder()
                .tenDanhMuc(tenDanhMuc)
                .duongDanSlug(slug)
                .danhMucCha(parent)
                .hienThi(hienThi != null ? hienThi : true)
                .build());
    }

    @Transactional
    public DanhMuc update(Integer id, String tenDanhMuc, String slug, Integer parentId, Boolean hienThi) {
        DanhMuc category = getById(id);
        if (tenDanhMuc != null) category.setTenDanhMuc(tenDanhMuc);
        if (slug != null && !slug.equals(category.getDuongDanSlug())) {
            if (danhMucRepository.findByDuongDanSlugAndNgayXoaIsNull(slug).isPresent()) {
                throw new DuplicateResourceException("Slug already exists: " + slug);
            }
            category.setDuongDanSlug(slug);
        }
        if (parentId != null) {
            category.setDanhMucCha(danhMucRepository.findByMaDanhMucAndNgayXoaIsNull(parentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category", parentId)));
        } else if (parentId == null && category.getDanhMucCha() != null) {
            category.setDanhMucCha(null);
        }
        if (hienThi != null) category.setHienThi(hienThi);
        return danhMucRepository.save(category);
    }

    @Transactional
    public Map<String, String> delete(Integer id) {
        DanhMuc category = getById(id);
        if (sanPhamRepository.existsByDanhMuc_MaDanhMucAndNgayXoaIsNull(id)) {
            throw new BadRequestException("Cannot delete category because it is in use by existing products");
        }
        category.setNgayXoa(LocalDateTime.now());
        danhMucRepository.save(category);
        return Map.of("message", "Category deleted");
    }

    @Transactional
    public Map<String, Object> toggleHienThi(Integer id) {
        DanhMuc category = getById(id);
        boolean next = !Boolean.TRUE.equals(category.getHienThi());
        category.setHienThi(next);
        danhMucRepository.save(category);
        Map<String, Object> result = new HashMap<>();
        result.put("maDanhMuc", id);
        result.put("hienThi", next);
        result.put("message", next ? "Đã hiện danh mục" : "Đã ẩn danh mục");
        return result;
    }
}
