package com.example.zeststore.repository;

import com.example.zeststore.entity.DanhSachYeuThich;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DanhSachYeuThichRepository extends JpaRepository<DanhSachYeuThich, Integer> {
    Optional<DanhSachYeuThich> findByNguoiDung_MaNguoiDung(Integer maNguoiDung);
}
