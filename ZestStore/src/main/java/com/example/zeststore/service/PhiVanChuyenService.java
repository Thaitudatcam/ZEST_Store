package com.example.zeststore.service;

import com.example.zeststore.entity.PhiVanChuyen;
import com.example.zeststore.exception.ResourceNotFoundException;
import com.example.zeststore.repository.PhiVanChuyenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PhiVanChuyenService {

    private final PhiVanChuyenRepository repository;

    @Transactional(readOnly = true)
    public List<PhiVanChuyen> getAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public PhiVanChuyen getById(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PhiVanChuyen", id));
    }

    @Transactional(readOnly = true)
    public PhiVanChuyen getByTenTinh(String tenTinh) {
        return repository.findByTenTinhIgnoreCase(tenTinh)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public BigDecimal getPhiByTenTinh(String tenTinh) {
        return repository.findByTenTinhIgnoreCase(tenTinh)
                        .map(PhiVanChuyen::getPhiVanChuyen)
                        .orElse(BigDecimal.valueOf(30000));
    }

    @Transactional
    public PhiVanChuyen create(PhiVanChuyen entity) {
        return repository.save(entity);
    }

    @Transactional
    public PhiVanChuyen update(Integer id, PhiVanChuyen entity) {
        PhiVanChuyen existing = getById(id);
        existing.setTenTinh(entity.getTenTinh());
        existing.setPhiVanChuyen(entity.getPhiVanChuyen());
        return repository.save(existing);
    }

    @Transactional
    public void delete(Integer id) {
        PhiVanChuyen existing = getById(id);
        repository.delete(existing);
    }
}
