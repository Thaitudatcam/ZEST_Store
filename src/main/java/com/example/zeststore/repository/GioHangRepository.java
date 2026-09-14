package com.example.zeststore.repository;

import com.example.zeststore.entity.GioHang;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GioHangRepository extends JpaRepository<GioHang, Integer> {
    Optional<GioHang> findByNguoiDung_MaNguoiDung(Integer maNguoiDung);
}
