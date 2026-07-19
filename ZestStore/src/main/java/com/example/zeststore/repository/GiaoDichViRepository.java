package com.example.zeststore.repository;

import com.example.zeststore.entity.GiaoDichVi;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GiaoDichViRepository extends JpaRepository<GiaoDichVi, Integer> {

    Page<GiaoDichVi> findByNguoiDung_MaNguoiDung(Integer maNguoiDung, Pageable pageable);
}
