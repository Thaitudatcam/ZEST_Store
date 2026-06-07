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

    Optional<BienTheSanPham> findBySanPham_MaSanPhamAndKichCoAndMauSac(
            Integer maSanPham, String kichCo, String mauSac);

    @Query("SELECT DISTINCT b.kichCo FROM BienTheSanPham b WHERE b.sanPham.maSanPham = :maSanPham AND b.ngayXoa IS NULL")
    List<String> findDistinctKichCoBySanPhamId(@Param("maSanPham") Integer maSanPham);

    @Query("SELECT DISTINCT b.mauSac FROM BienTheSanPham b WHERE b.sanPham.maSanPham = :maSanPham AND b.ngayXoa IS NULL")
    List<String> findDistinctMauSacBySanPhamId(@Param("maSanPham") Integer maSanPham);
}
