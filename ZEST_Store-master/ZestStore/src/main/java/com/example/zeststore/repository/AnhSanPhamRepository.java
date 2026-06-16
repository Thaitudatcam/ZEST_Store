package com.example.zeststore.repository;

import com.example.zeststore.entity.AnhSanPham;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnhSanPhamRepository extends JpaRepository<AnhSanPham, Integer> {

    List<AnhSanPham> findByBienThe_MaBienThe(Integer maBienThe);

    List<AnhSanPham> findByBienThe_MaBienTheOrderByThuTuHienThiAsc(Integer maBienThe);
}