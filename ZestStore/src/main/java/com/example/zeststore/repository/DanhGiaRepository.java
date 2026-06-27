package com.example.zeststore.repository;

import com.example.zeststore.entity.DanhGia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DanhGiaRepository extends JpaRepository<DanhGia, Integer> {

    List<DanhGia> findBySanPham_MaSanPham(Integer maSanPham);

    List<DanhGia> findByNguoiDung_MaNguoiDung(Integer maNguoiDung);

    Optional<DanhGia> findByNguoiDung_MaNguoiDungAndSanPham_MaSanPhamAndDonHang_MaDonHang(
            Integer maNguoiDung, Integer maSanPham, Integer maDonHang);

    @Query("SELECT AVG(d.soSao) FROM DanhGia d WHERE d.sanPham.maSanPham = :maSanPham AND d.ngayXoa IS NULL")
    Double averageRatingBySanPhamId(@Param("maSanPham") Integer maSanPham);

    @Query("SELECT COUNT(d) FROM DanhGia d WHERE d.sanPham.maSanPham = :maSanPham AND d.ngayXoa IS NULL")
    Long countBySanPhamId(@Param("maSanPham") Integer maSanPham);

    @Query("SELECT d.sanPham.maSanPham, AVG(d.soSao), COUNT(d) FROM DanhGia d " +
           "WHERE d.sanPham.maSanPham IN :ids AND d.ngayXoa IS NULL GROUP BY d.sanPham.maSanPham")
    List<Object[]> avgRatingBySanPhamIds(@Param("ids") List<Integer> ids);
}
