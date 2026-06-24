package com.example.zeststore.repository;

import com.example.zeststore.entity.DonHang;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DonHangRepository extends JpaRepository<DonHang, Integer> {

    List<DonHang> findByLoaiDonHangOrderByNgayDatDesc(Integer loaiDonHang);

    List<DonHang> findByNguoiDung_MaNguoiDungOrderByNgayDatDesc(Integer maNguoiDung);

    List<DonHang> findByTrangThaiDon(Integer trangThaiDon);

    Page<DonHang> findByLoaiDonHang(Integer loaiDonHang, Pageable pageable);

    @Query("SELECT d FROM DonHang d WHERE d.ngayDat BETWEEN :tuNgay AND :denNgay")
    List<DonHang> findByNgayDatBetween(@Param("tuNgay") LocalDateTime tuNgay,
                                        @Param("denNgay") LocalDateTime denNgay);

    @Query("SELECT COUNT(d) FROM DonHang d WHERE d.trangThaiDon = :trangThai")
    Long countByTrangThaiDon(@Param("trangThai") Integer trangThai);

    @Query("SELECT COALESCE(SUM(d.tongTien), 0) FROM DonHang d "
            + "WHERE d.trangThaiDon = 4 AND d.ngayDat BETWEEN :tuNgay AND :denNgay")
    BigDecimal sumRevenueByDateRange(@Param("tuNgay") LocalDateTime tuNgay,
                                      @Param("denNgay") LocalDateTime denNgay);

    @Query(value = "SELECT CONVERT(date, ngay_dat) as ngay, SUM(tong_tien) as doanh_thu "
            + "FROM don_hang WHERE trang_thai_don = 4 AND ngay_dat BETWEEN :tuNgay AND :denNgay "
            + "GROUP BY CONVERT(date, ngay_dat) ORDER BY ngay", nativeQuery = true)
    List<Object[]> sumRevenueGroupByDate(@Param("tuNgay") LocalDateTime tuNgay,
                                          @Param("denNgay") LocalDateTime denNgay);

    List<DonHang> findTop10ByOrderByNgayDatDesc();
}