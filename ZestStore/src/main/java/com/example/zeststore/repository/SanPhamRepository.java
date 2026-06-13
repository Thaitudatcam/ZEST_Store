package com.example.zeststore.repository;

import com.example.zeststore.entity.SanPham;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface SanPhamRepository extends JpaRepository<SanPham, Integer> {

    Optional<SanPham> findBySlug(String slug);

    Page<SanPham> findByDanhMuc_MaDanhMuc(Integer maDanhMuc, Pageable pageable);

    Page<SanPham> findByTrangThaiAndNgayXoaIsNull(String trangThai, Pageable pageable);

    @Query("SELECT s FROM SanPham s WHERE s.trangThai = 'active' AND s.ngayXoa IS NULL AND "
            + "(:maDanhMuc IS NULL OR s.danhMuc.maDanhMuc = :maDanhMuc) AND "
            + "(:giaMin IS NULL OR s.gia >= :giaMin) AND "
            + "(:giaMax IS NULL OR s.gia <= :giaMax)")
    Page<SanPham> filterProducts(@Param("maDanhMuc") Integer maDanhMuc,
                                  @Param("giaMin") BigDecimal giaMin,
                                  @Param("giaMax") BigDecimal giaMax,
                                  Pageable pageable);

    @Query("SELECT s FROM SanPham s WHERE s.trangThai = 'active' AND s.ngayXoa IS NULL AND "
            + "(:keyword IS NULL OR s.tenSanPham LIKE %:keyword% OR s.moTa LIKE %:keyword%)")
    Page<SanPham> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    List<SanPham> findTop10ByTrangThaiAndNgayXoaIsNullOrderByNgayTaoDesc(String trangThai);

    @Query("SELECT s FROM SanPham s WHERE s.danhMuc.maDanhMuc IN :maDanhMucIds AND s.trangThai = 'active' AND s.ngayXoa IS NULL")
    Page<SanPham> findByMultipleCategoryIds(@Param("maDanhMucIds") List<Integer> maDanhMucIds, Pageable pageable);

    long countByNgayXoaIsNull();
}
