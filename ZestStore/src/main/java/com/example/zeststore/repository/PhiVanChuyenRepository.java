package com.example.zeststore.repository;

import com.example.zeststore.entity.PhiVanChuyen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PhiVanChuyenRepository extends JpaRepository<PhiVanChuyen, Integer> {
    Optional<PhiVanChuyen> findByTenTinhIgnoreCase(String tenTinh);
}
