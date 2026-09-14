package com.example.zeststore.repository;

import com.example.zeststore.entity.SanPham;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SanPhamRepository extends JpaRepository<SanPham, Integer> {

    Optional<SanPham> findBySlug(String slug);

    boolean existsByDanhMuc_MaDanhMucAndNgayXoaIsNull(Integer maDanhMuc);

    Page<SanPham> findByDanhMuc_MaDanhMuc(Integer maDanhMuc, Pageable pageable);

    Page<SanPham> findByTrangThaiAndNgayXoaIsNull(Integer trangThai, Pageable pageable);

    @Query("SELECT s FROM SanPham s WHERE s.trangThai = 1 AND s.ngayXoa IS NULL AND "
            + "(:maDanhMuc IS NULL OR s.danhMuc.maDanhMuc = :maDanhMuc)")
    Page<SanPham> filterProductsByCategory(@Param("maDanhMuc") Integer maDanhMuc, Pageable pageable);

    @Query(value = "SELECT DISTINCT s FROM SanPham s JOIN s.bienThes b WHERE s.trangThai = 1 AND s.ngayXoa IS NULL AND "
            + "(:maDanhMuc IS NULL OR s.danhMuc.maDanhMuc = :maDanhMuc) AND "
            + "(:giaMin IS NULL OR b.gia >= :giaMin) AND "
            + "(:giaMax IS NULL OR b.gia <= :giaMax)",
            countQuery = "SELECT COUNT(DISTINCT s) FROM SanPham s JOIN s.bienThes b WHERE s.trangThai = 1 AND s.ngayXoa IS NULL AND "
            + "(:maDanhMuc IS NULL OR s.danhMuc.maDanhMuc = :maDanhMuc) AND "
            + "(:giaMin IS NULL OR b.gia >= :giaMin) AND "
            + "(:giaMax IS NULL OR b.gia <= :giaMax)")
    Page<SanPham> filterProducts(@Param("maDanhMuc") Integer maDanhMuc,
                                  @Param("giaMin") BigDecimal giaMin,
                                  @Param("giaMax") BigDecimal giaMax,
                                  Pageable pageable);

    @Query("SELECT s FROM SanPham s WHERE s.trangThai = 1 AND s.ngayXoa IS NULL AND "
            + "(:keyword IS NULL OR s.tenSanPham LIKE %:keyword% OR s.moTa LIKE %:keyword%)")
    Page<SanPham> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    List<SanPham> findTop10ByTrangThaiAndNgayXoaIsNullOrderByNgayTaoDesc(Integer trangThai);

    @Query("SELECT s FROM SanPham s WHERE s.danhMuc.maDanhMuc IN :maDanhMucIds AND s.trangThai = 1 AND s.ngayXoa IS NULL")
    Page<SanPham> findByMultipleCategoryIds(@Param("maDanhMucIds") List<Integer> maDanhMucIds, Pageable pageable);

    long countByNgayXoaIsNull();

    List<SanPham> findByNgayXoaIsNull();

    Page<SanPham> findByNgayXoaIsNull(Pageable pageable);

    @Query("SELECT s FROM SanPham s WHERE s.ngayXoa IS NULL AND "
            + "(:keyword IS NULL OR s.tenSanPham LIKE %:keyword% OR s.moTa LIKE %:keyword%)")
    Page<SanPham> searchAdminByKeyword(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT s FROM SanPham s WHERE s.ngayXoa IS NULL "
            + "ORDER BY COALESCE(s.ngayCapNhat, s.ngayTao) DESC, s.maSanPham DESC")
    Page<SanPham> findAdminProductsOrderByLastUpdated(Pageable pageable);

    @Query("SELECT s FROM SanPham s WHERE s.ngayXoa IS NULL AND "
            + "(:keyword IS NULL OR s.tenSanPham LIKE %:keyword% OR s.moTa LIKE %:keyword%) "
            + "ORDER BY COALESCE(s.ngayCapNhat, s.ngayTao) DESC, s.maSanPham DESC")
    Page<SanPham> searchAdminProductsOrderByLastUpdated(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT FUNCTION('FORMAT', s.ngayTao, 'yyyy-MM-dd'), COUNT(s) "
            + "FROM SanPham s WHERE s.ngayXoa IS NULL AND s.ngayTao BETWEEN :tuNgay AND :denNgay "
            + "GROUP BY FUNCTION('FORMAT', s.ngayTao, 'yyyy-MM-dd')")
    List<Object[]> countSanPhamTheoNgay(@Param("tuNgay") LocalDateTime tuNgay,
                                        @Param("denNgay") LocalDateTime denNgay);

    @Query("SELECT MIN(s.ngayTao) FROM SanPham s")
    LocalDateTime minNgayTao();
}