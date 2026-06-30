package com.example.zeststore.repository;

import com.example.zeststore.entity.MucDonHang;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MucDonHangRepository extends JpaRepository<MucDonHang, Integer> {
    List<MucDonHang> findByDonHang_MaDonHang(Integer maDonHang);

    @Query("SELECT m.bienThe.sanPham.maSanPham, m.bienThe.sanPham.tenSanPham, "
            + "m.bienThe.sanPham.urlAnhDaiDien, SUM(m.soLuong) as totalSold "
            + "FROM MucDonHang m "
            + "WHERE m.donHang.trangThaiDon IN (4, 6) "
            + "GROUP BY m.bienThe.sanPham.maSanPham, m.bienThe.sanPham.tenSanPham, m.bienThe.sanPham.urlAnhDaiDien "
            + "ORDER BY totalSold DESC")
    List<Object[]> findBestSellingProducts(Pageable pageable);
}
