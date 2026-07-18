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

    Page<DonHang> findByTrangThaiDon(Integer trangThaiDon, Pageable pageable);

    Page<DonHang> findByLoaiDonHangAndTrangThaiDon(Integer loaiDonHang, Integer trangThaiDon, Pageable pageable);

    @Query("SELECT d FROM DonHang d WHERE d.loaiDonHang = :loai AND d.trangThaiDon = :trangThai AND d.ngayDat >= :tuNgay AND d.ngayDat < :denNgay")
    Page<DonHang> findByLoaiDonHangAndTrangThaiDonAndNgayDatBetween(@Param("loai") Integer loaiDonHang, @Param("trangThai") Integer trangThaiDon, @Param("tuNgay") LocalDateTime tuNgay, @Param("denNgay") LocalDateTime denNgay, Pageable pageable);

    Page<DonHang> findByLoaiDonHang(Integer loaiDonHang, Pageable pageable);

    @Query("SELECT d FROM DonHang d WHERE d.loaiDonHang = :loai AND d.ngayDat >= :tuNgay AND d.ngayDat < :denNgay")
    Page<DonHang> findByLoaiDonHangAndNgayDatBetween(@Param("loai") Integer loaiDonHang, @Param("tuNgay") LocalDateTime tuNgay, @Param("denNgay") LocalDateTime denNgay, Pageable pageable);

    @Query("SELECT d FROM DonHang d WHERE "
            + "CAST(d.maDonHang AS string) LIKE %:q% "
            + "OR d.nguoiDung.hoTen LIKE %:q% "
            + "OR d.nguoiDung.email LIKE %:q% "
            + "OR d.nguoiDung.soDienThoai LIKE %:q%")
    Page<DonHang> searchByKeyword(@Param("q") String q, Pageable pageable);

    @Query("SELECT d FROM DonHang d WHERE d.loaiDonHang = :loai AND ("
            + "CAST(d.maDonHang AS string) LIKE %:q% "
            + "OR d.nguoiDung.hoTen LIKE %:q% "
            + "OR d.nguoiDung.email LIKE %:q% "
            + "OR d.nguoiDung.soDienThoai LIKE %:q%)")
    Page<DonHang> searchByKeywordAndLoai(@Param("q") String q, @Param("loai") Integer loai, Pageable pageable);

    @Query("SELECT d FROM DonHang d WHERE d.loaiDonHang = :loai AND ("
            + "CAST(d.maDonHang AS string) LIKE %:q% "
            + "OR d.nguoiDung.hoTen LIKE %:q% "
            + "OR d.nguoiDung.email LIKE %:q% "
            + "OR d.nguoiDung.soDienThoai LIKE %:q%)"
            + " AND d.ngayDat >= :tuNgay AND d.ngayDat < :denNgay")
    Page<DonHang> searchByKeywordAndLoaiAndNgayDatBetween(@Param("q") String q, @Param("loai") Integer loai, @Param("tuNgay") LocalDateTime tuNgay, @Param("denNgay") LocalDateTime denNgay, Pageable pageable);

    @Query("SELECT d FROM DonHang d WHERE d.trangThaiDon = :trangThai AND ("
            + "CAST(d.maDonHang AS string) LIKE %:q% "
            + "OR d.nguoiDung.hoTen LIKE %:q% "
            + "OR d.nguoiDung.email LIKE %:q% "
            + "OR d.nguoiDung.soDienThoai LIKE %:q%)")
    Page<DonHang> searchByKeywordAndTrangThai(@Param("q") String q, @Param("trangThai") Integer trangThai, Pageable pageable);

    @Query("SELECT d FROM DonHang d WHERE d.loaiDonHang = :loai AND d.trangThaiDon = :trangThai AND ("
            + "CAST(d.maDonHang AS string) LIKE %:q% "
            + "OR d.nguoiDung.hoTen LIKE %:q% "
            + "OR d.nguoiDung.email LIKE %:q% "
            + "OR d.nguoiDung.soDienThoai LIKE %:q%)")
    Page<DonHang> searchByKeywordAndLoaiAndTrangThai(@Param("q") String q, @Param("loai") Integer loai, @Param("trangThai") Integer trangThai, Pageable pageable);

    @Query("SELECT d FROM DonHang d WHERE d.loaiDonHang = :loai AND d.trangThaiDon = :trangThai AND ("
            + "CAST(d.maDonHang AS string) LIKE %:q% "
            + "OR d.nguoiDung.hoTen LIKE %:q% "
            + "OR d.nguoiDung.email LIKE %:q% "
            + "OR d.nguoiDung.soDienThoai LIKE %:q%)"
            + " AND d.ngayDat >= :tuNgay AND d.ngayDat < :denNgay")
    Page<DonHang> searchByKeywordAndLoaiAndTrangThaiAndNgayDatBetween(@Param("q") String q, @Param("loai") Integer loai, @Param("trangThai") Integer trangThai, @Param("tuNgay") LocalDateTime tuNgay, @Param("denNgay") LocalDateTime denNgay, Pageable pageable);

    @Query("SELECT d FROM DonHang d WHERE d.ngayDat BETWEEN :tuNgay AND :denNgay")
    List<DonHang> findByNgayDatBetween(@Param("tuNgay") LocalDateTime tuNgay,
                                       @Param("denNgay") LocalDateTime denNgay);

    @Query("SELECT COUNT(d) FROM DonHang d WHERE d.trangThaiDon = :trangThai")
    Long countByTrangThaiDon(@Param("trangThai") Integer trangThai);

    @Query("SELECT COALESCE(SUM(d.tongTien), 0) FROM DonHang d "
            + "WHERE d.trangThaiDon IN (4, 6) AND d.ngayDat BETWEEN :tuNgay AND :denNgay")
    BigDecimal sumRevenueByDateRange(@Param("tuNgay") LocalDateTime tuNgay,
                                     @Param("denNgay") LocalDateTime denNgay);


    @Query("SELECT d.trangThaiDon, COUNT(d) FROM DonHang d GROUP BY d.trangThaiDon")
    List<Object[]> countOrdersByStatus();

    @Query("SELECT FUNCTION('FORMAT', d.ngayDat, 'yyyy-MM-dd'), COALESCE(SUM(d.tongTien), 0) "
            + "FROM DonHang d WHERE d.trangThaiDon IN (4, 6) AND d.ngayDat BETWEEN :tuNgay AND :denNgay "
            + "GROUP BY FUNCTION('FORMAT', d.ngayDat, 'yyyy-MM-dd') ORDER BY 1")
    List<Object[]> sumRevenueByDay(@Param("tuNgay") LocalDateTime tuNgay,
                                   @Param("denNgay") LocalDateTime denNgay);


    @Query("SELECT FUNCTION('MONTH', d.ngayDat), COALESCE(SUM(d.tongTien), 0) "
            + "FROM DonHang d WHERE d.trangThaiDon IN (4, 6) AND FUNCTION('YEAR', d.ngayDat) = :nam "
            + "GROUP BY FUNCTION('MONTH', d.ngayDat) ORDER BY 1")
    List<Object[]> sumRevenueByMonth(@Param("nam") int nam);


    @Query("SELECT FUNCTION('YEAR', d.ngayDat), COALESCE(SUM(d.tongTien), 0) "
            + "FROM DonHang d WHERE d.trangThaiDon IN (4, 6) "
            + "GROUP BY FUNCTION('YEAR', d.ngayDat) ORDER BY 1")
    List<Object[]> sumRevenueByYear();

    @Query("SELECT d.ngayDat, d.tongTien FROM DonHang d "
            + "WHERE d.trangThaiDon IN (4, 6) AND d.ngayDat BETWEEN :tuNgay AND :denNgay")
    List<Object[]> findRevenueData(@Param("tuNgay") LocalDateTime tuNgay,
                                    @Param("denNgay") LocalDateTime denNgay);

    @Query("SELECT COUNT(d) FROM DonHang d WHERE d.trangThaiDon IN (4, 6) AND d.ngayDat BETWEEN :tuNgay AND :denNgay")
    Long countCompletedOrders(@Param("tuNgay") LocalDateTime tuNgay,
                              @Param("denNgay") LocalDateTime denNgay);

    List<DonHang> findTop10ByOrderByNgayDatDesc();
}