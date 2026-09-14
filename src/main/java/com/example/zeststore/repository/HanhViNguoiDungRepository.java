package com.example.zeststore.repository;

import com.example.zeststore.entity.HanhViNguoiDung;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface HanhViNguoiDungRepository extends JpaRepository<HanhViNguoiDung, Integer> {

    List<HanhViNguoiDung> findByNguoiDung_MaNguoiDung(Integer maNguoiDung);

    List<HanhViNguoiDung> findBySanPham_MaSanPham(Integer maSanPham);

    long countByHanhDongAndSanPham_MaSanPham(String hanhDong, Integer maSanPham);

    @Query("SELECT h.sanPham.maSanPham, COUNT(h) as cnt FROM HanhViNguoiDung h "
            + "WHERE h.hanhDong = :hanhDong AND h.ngayTao BETWEEN :tuNgay AND :denNgay "
            + "GROUP BY h.sanPham.maSanPham ORDER BY cnt DESC")
    List<Object[]> findTopSanPhamByHanhDongAndDateRange(@Param("hanhDong") String hanhDong,
                                                         @Param("tuNgay") LocalDateTime tuNgay,
                                                         @Param("denNgay") LocalDateTime denNgay,
                                                         @Param("limit") Integer limit);
}
