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

    long countByXuatXuAndNgayXoaIsNull(String xuatXu);
    long countByLoaiAo_MaThuocTinhAndNgayXoaIsNull(Integer maThuocTinh);
    long countByKieuDang_MaThuocTinhAndNgayXoaIsNull(Integer maThuocTinh);
    long countByChatLieu_MaThuocTinhAndNgayXoaIsNull(Integer maThuocTinh);
    long countByCoAo_MaThuocTinhAndNgayXoaIsNull(Integer maThuocTinh);
    long countByTayAo_MaThuocTinhAndNgayXoaIsNull(Integer maThuocTinh);
    long countByVaiAo_MaThuocTinhAndNgayXoaIsNull(Integer maThuocTinh);

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

    @Query(value = "SELECT s FROM SanPham s WHERE s.ngayXoa IS NULL AND "
            + "(:keyword IS NULL OR s.tenSanPham LIKE %:keyword% OR s.moTa LIKE %:keyword%) AND "
            + "(:maDanhMuc IS NULL OR s.danhMuc.maDanhMuc = :maDanhMuc) AND "
            + "(:trangThai IS NULL OR s.trangThai = :trangThai) AND "
            + "((:maThuongHieu IS NULL AND :giaMin IS NULL AND :giaMax IS NULL) OR EXISTS ("
            + "SELECT 1 FROM BienTheSanPham b WHERE b.sanPham = s AND b.ngayXoa IS NULL AND "
            + "(:maThuongHieu IS NULL OR b.thuongHieu.maThuongHieu = :maThuongHieu) AND "
            + "(:giaMin IS NULL OR b.gia >= :giaMin) AND (:giaMax IS NULL OR b.gia <= :giaMax))) "
            + "ORDER BY COALESCE(s.ngayCapNhat, s.ngayTao) DESC, s.maSanPham DESC",
            countQuery = "SELECT COUNT(s) FROM SanPham s WHERE s.ngayXoa IS NULL AND "
            + "(:keyword IS NULL OR s.tenSanPham LIKE %:keyword% OR s.moTa LIKE %:keyword%) AND "
            + "(:maDanhMuc IS NULL OR s.danhMuc.maDanhMuc = :maDanhMuc) AND "
            + "(:trangThai IS NULL OR s.trangThai = :trangThai) AND "
            + "((:maThuongHieu IS NULL AND :giaMin IS NULL AND :giaMax IS NULL) OR EXISTS ("
            + "SELECT 1 FROM BienTheSanPham b WHERE b.sanPham = s AND b.ngayXoa IS NULL AND "
            + "(:maThuongHieu IS NULL OR b.thuongHieu.maThuongHieu = :maThuongHieu) AND "
            + "(:giaMin IS NULL OR b.gia >= :giaMin) AND (:giaMax IS NULL OR b.gia <= :giaMax)))")
    Page<SanPham> filterAdminProducts(@Param("keyword") String keyword,
                                      @Param("maDanhMuc") Integer maDanhMuc,
                                      @Param("maThuongHieu") Integer maThuongHieu,
                                      @Param("trangThai") Integer trangThai,
                                      @Param("giaMin") BigDecimal giaMin,
                                      @Param("giaMax") BigDecimal giaMax,
                                      Pageable pageable);

    @Query("SELECT FUNCTION('FORMAT', s.ngayTao, 'yyyy-MM-dd'), COUNT(s) "
            + "FROM SanPham s WHERE s.ngayXoa IS NULL AND s.ngayTao BETWEEN :tuNgay AND :denNgay "
            + "GROUP BY FUNCTION('FORMAT', s.ngayTao, 'yyyy-MM-dd')")
    List<Object[]> countSanPhamTheoNgay(@Param("tuNgay") LocalDateTime tuNgay,
                                        @Param("denNgay") LocalDateTime denNgay);

    @Query("SELECT MIN(s.ngayTao) FROM SanPham s")
    LocalDateTime minNgayTao();
}
