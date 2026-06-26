package com.example.zeststore.repository;

import com.example.zeststore.entity.DanhMuc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface DanhMucRepository extends JpaRepository<DanhMuc, Integer> {
    List<DanhMuc> findByDanhMucChaIsNull();

    List<DanhMuc> findByDanhMucCha_MaDanhMuc(Integer maDanhMucCha);

    Optional<DanhMuc> findByDuongDanSlug(String slug);

    List<DanhMuc> findByNgayXoaIsNull();

    @Query("SELECT COUNT(s) FROM SanPham s WHERE s.danhMuc.maDanhMuc = :categoryId AND s.ngayXoa IS NULL")
    long countProductsByCategoryId(@Param("categoryId") Integer categoryId);
}
