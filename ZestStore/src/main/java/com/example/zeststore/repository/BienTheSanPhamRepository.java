package com.example.zeststore.repository;

import com.example.zeststore.entity.BienTheSanPham;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BienTheSanPhamRepository extends JpaRepository<BienTheSanPham, Integer> {

    List<BienTheSanPham> findBySanPham_MaSanPham(Integer maSanPham);

    Optional<BienTheSanPham> findBySku(String sku);

    @Query("SELECT b FROM BienTheSanPham b WHERE UPPER(b.sku) = UPPER(:sku)")
    Optional<BienTheSanPham> findBySkuIgnoreCase(@Param("sku") String sku);

    Optional<BienTheSanPham> findBySanPham_MaSanPhamAndKichCo_MaKichCoAndMauSac_MaMauSac(
            Integer maSanPham, Integer maKichCo, Integer maMauSac);

    @Query("SELECT DISTINCT b.kichCo FROM BienTheSanPham b WHERE b.sanPham.maSanPham = :maSanPham AND b.ngayXoa IS NULL")
    List<Object> findDistinctKichCoBySanPhamId(@Param("maSanPham") Integer maSanPham);

    @Query("SELECT DISTINCT b.mauSac FROM BienTheSanPham b WHERE b.sanPham.maSanPham = :maSanPham AND b.ngayXoa IS NULL")
    List<Object> findDistinctMauSacBySanPhamId(@Param("maSanPham") Integer maSanPham);

    List<BienTheSanPham> findBySanPham_MaSanPhamAndNgayXoaIsNull(Integer maSanPham);

    @Query("SELECT b.sanPham.maSanPham, COALESCE(SUM(b.tonKho), 0) FROM BienTheSanPham b "
            + "WHERE b.sanPham.maSanPham IN :maSanPhamIds AND b.ngayXoa IS NULL "
            + "GROUP BY b.sanPham.maSanPham")
    List<Object[]> sumTonKhoBySanPhamIds(@Param("maSanPhamIds") List<Integer> maSanPhamIds);

    @Query("SELECT b.sanPham.maSanPham, COALESCE(SUM(b.gia * b.tonKho), 0) FROM BienTheSanPham b "
            + "WHERE b.sanPham.maSanPham IN :maSanPhamIds AND b.ngayXoa IS NULL "
            + "GROUP BY b.sanPham.maSanPham")
    List<Object[]> sumGiaTriBySanPhamIds(@Param("maSanPhamIds") List<Integer> maSanPhamIds);

    @Query("SELECT b.sanPham.maSanPham, MIN(b.gia) FROM BienTheSanPham b "
            + "WHERE b.sanPham.maSanPham IN :maSanPhamIds AND b.ngayXoa IS NULL AND b.gia > 0 "
            + "GROUP BY b.sanPham.maSanPham")
    List<Object[]> minGiaBySanPhamIds(@Param("maSanPhamIds") List<Integer> maSanPhamIds);
}