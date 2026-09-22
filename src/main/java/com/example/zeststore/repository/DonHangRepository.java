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

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM DonHang d WHERE d.maDonHang = :id")
    java.util.Optional<DonHang> findByIdForUpdate(@Param("id") Integer id);

    java.util.Optional<DonHang> findByCheckoutKey(String checkoutKey);

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

    @Query("SELECT d FROM DonHang d WHERE d.ngayDat >= :tuNgay AND d.ngayDat < :denNgay")
    Page<DonHang> findByNgayDatInRange(@Param("tuNgay") LocalDateTime tuNgay,
                                      @Param("denNgay") LocalDateTime denNgay, Pageable pageable);

    @Query("SELECT d FROM DonHang d WHERE d.trangThaiDon = :trangThai AND d.ngayDat >= :tuNgay AND d.ngayDat < :denNgay")
    Page<DonHang> findByTrangThaiDonAndNgayDatInRange(@Param("trangThai") Integer trangThai,
                                                      @Param("tuNgay") LocalDateTime tuNgay,
                                                      @Param("denNgay") LocalDateTime denNgay, Pageable pageable);

    @Query("SELECT d FROM DonHang d LEFT JOIN d.nguoiDung n WHERE "
            + "CAST(d.maDonHang AS string) LIKE %:q% "
            + "OR n.hoTen LIKE %:q% OR n.email LIKE %:q% OR n.soDienThoai LIKE %:q% "
            + "OR d.tenKhachTaiQuay LIKE %:q% OR d.sdtKhachTaiQuay LIKE %:q% "
            + "OR d.tenNguoiNhan LIKE %:q% OR d.sdtNguoiNhan LIKE %:q%")
    Page<DonHang> searchByKeyword(@Param("q") String q, Pageable pageable);

    @Query("SELECT d FROM DonHang d LEFT JOIN d.nguoiDung n WHERE d.loaiDonHang = :loai AND ("
            + "CAST(d.maDonHang AS string) LIKE %:q% "
            + "OR n.hoTen LIKE %:q% OR n.email LIKE %:q% OR n.soDienThoai LIKE %:q% "
            + "OR d.tenKhachTaiQuay LIKE %:q% OR d.sdtKhachTaiQuay LIKE %:q% "
            + "OR d.tenNguoiNhan LIKE %:q% OR d.sdtNguoiNhan LIKE %:q%)")
    Page<DonHang> searchByKeywordAndLoai(@Param("q") String q, @Param("loai") Integer loai, Pageable pageable);

    @Query("SELECT d FROM DonHang d LEFT JOIN d.nguoiDung n WHERE d.loaiDonHang = :loai AND ("
            + "CAST(d.maDonHang AS string) LIKE %:q% "
            + "OR n.hoTen LIKE %:q% OR n.email LIKE %:q% OR n.soDienThoai LIKE %:q% "
            + "OR d.tenKhachTaiQuay LIKE %:q% OR d.sdtKhachTaiQuay LIKE %:q% "
            + "OR d.tenNguoiNhan LIKE %:q% OR d.sdtNguoiNhan LIKE %:q%)"
            + " AND d.ngayDat >= :tuNgay AND d.ngayDat < :denNgay")
    Page<DonHang> searchByKeywordAndLoaiAndNgayDatBetween(@Param("q") String q, @Param("loai") Integer loai, @Param("tuNgay") LocalDateTime tuNgay, @Param("denNgay") LocalDateTime denNgay, Pageable pageable);

    @Query("SELECT d FROM DonHang d LEFT JOIN d.nguoiDung n WHERE d.trangThaiDon = :trangThai AND ("
            + "CAST(d.maDonHang AS string) LIKE %:q% "
            + "OR n.hoTen LIKE %:q% OR n.email LIKE %:q% OR n.soDienThoai LIKE %:q% "
            + "OR d.tenKhachTaiQuay LIKE %:q% OR d.sdtKhachTaiQuay LIKE %:q% "
            + "OR d.tenNguoiNhan LIKE %:q% OR d.sdtNguoiNhan LIKE %:q%)")
    Page<DonHang> searchByKeywordAndTrangThai(@Param("q") String q, @Param("trangThai") Integer trangThai, Pageable pageable);

    @Query("SELECT d FROM DonHang d LEFT JOIN d.nguoiDung n WHERE d.loaiDonHang = :loai AND d.trangThaiDon = :trangThai AND ("
            + "CAST(d.maDonHang AS string) LIKE %:q% "
            + "OR n.hoTen LIKE %:q% OR n.email LIKE %:q% OR n.soDienThoai LIKE %:q% "
            + "OR d.tenKhachTaiQuay LIKE %:q% OR d.sdtKhachTaiQuay LIKE %:q% "
            + "OR d.tenNguoiNhan LIKE %:q% OR d.sdtNguoiNhan LIKE %:q%)")
    Page<DonHang> searchByKeywordAndLoaiAndTrangThai(@Param("q") String q, @Param("loai") Integer loai, @Param("trangThai") Integer trangThai, Pageable pageable);

    @Query("SELECT d FROM DonHang d LEFT JOIN d.nguoiDung n WHERE d.loaiDonHang = :loai AND d.trangThaiDon = :trangThai AND ("
            + "CAST(d.maDonHang AS string) LIKE %:q% "
            + "OR n.hoTen LIKE %:q% OR n.email LIKE %:q% OR n.soDienThoai LIKE %:q% "
            + "OR d.tenKhachTaiQuay LIKE %:q% OR d.sdtKhachTaiQuay LIKE %:q% "
            + "OR d.tenNguoiNhan LIKE %:q% OR d.sdtNguoiNhan LIKE %:q%)"
            + " AND d.ngayDat >= :tuNgay AND d.ngayDat < :denNgay")
    Page<DonHang> searchByKeywordAndLoaiAndTrangThaiAndNgayDatBetween(@Param("q") String q, @Param("loai") Integer loai, @Param("trangThai") Integer trangThai, @Param("tuNgay") LocalDateTime tuNgay, @Param("denNgay") LocalDateTime denNgay, Pageable pageable);

    @Query("SELECT d FROM DonHang d LEFT JOIN d.nguoiDung n WHERE (CAST(d.maDonHang AS string) LIKE %:q% "
            + "OR n.hoTen LIKE %:q% OR n.email LIKE %:q% OR n.soDienThoai LIKE %:q% OR d.tenKhachTaiQuay LIKE %:q% "
            + "OR d.sdtKhachTaiQuay LIKE %:q% OR d.tenNguoiNhan LIKE %:q% OR d.sdtNguoiNhan LIKE %:q%) "
            + "AND d.ngayDat >= :tuNgay AND d.ngayDat < :denNgay")
    Page<DonHang> searchByKeywordAndNgayDatBetween(@Param("q") String q,
                                                   @Param("tuNgay") LocalDateTime tuNgay,
                                                   @Param("denNgay") LocalDateTime denNgay, Pageable pageable);

    @Query("SELECT d FROM DonHang d LEFT JOIN d.nguoiDung n WHERE d.trangThaiDon = :trangThai AND (CAST(d.maDonHang AS string) LIKE %:q% "
            + "OR n.hoTen LIKE %:q% OR n.email LIKE %:q% OR n.soDienThoai LIKE %:q% OR d.tenKhachTaiQuay LIKE %:q% "
            + "OR d.sdtKhachTaiQuay LIKE %:q% OR d.tenNguoiNhan LIKE %:q% OR d.sdtNguoiNhan LIKE %:q%) "
            + "AND d.ngayDat >= :tuNgay AND d.ngayDat < :denNgay")
    Page<DonHang> searchByKeywordAndTrangThaiAndNgayDatBetween(@Param("q") String q,
                                                               @Param("trangThai") Integer trangThai,
                                                               @Param("tuNgay") LocalDateTime tuNgay,
                                                               @Param("denNgay") LocalDateTime denNgay,
                                                               Pageable pageable);

    @Query("SELECT d FROM DonHang d WHERE d.ngayDat BETWEEN :tuNgay AND :denNgay")
    List<DonHang> findByNgayDatBetween(@Param("tuNgay") LocalDateTime tuNgay,
                                       @Param("denNgay") LocalDateTime denNgay);

    @Query("SELECT COUNT(d) FROM DonHang d WHERE d.trangThaiDon = :trangThai")
    Long countByTrangThaiDon(@Param("trangThai") Integer trangThai);

    @Query("SELECT COUNT(d) FROM DonHang d WHERE d.ngayDat BETWEEN :tuNgay AND :denNgay")
    Long countByNgayDatBetween(@Param("tuNgay") LocalDateTime tuNgay,
                               @Param("denNgay") LocalDateTime denNgay);

    @Query("SELECT COALESCE(SUM(t.soTien), 0) FROM ThanhToan t "
            + "WHERE t.donHang IS NOT NULL AND t.trangThaiThanhToan = 2 "
            + "AND t.donHang.trangThaiDon NOT IN (5, 8, 9) "
            + "AND COALESCE(t.thoiGianTt, t.thoiGianTao) BETWEEN :tuNgay AND :denNgay")
    BigDecimal sumRevenueByDateRange(@Param("tuNgay") LocalDateTime tuNgay,
                                     @Param("denNgay") LocalDateTime denNgay);


    @Query("SELECT d.trangThaiDon, COUNT(d) FROM DonHang d GROUP BY d.trangThaiDon")
    List<Object[]> countOrdersByStatus();

    @Query("SELECT d.trangThaiDon, COUNT(d) FROM DonHang d "
            + "WHERE d.ngayDat BETWEEN :tuNgay AND :denNgay GROUP BY d.trangThaiDon")
    List<Object[]> countOrdersByStatusInRange(@Param("tuNgay") LocalDateTime tuNgay,
                                               @Param("denNgay") LocalDateTime denNgay);

    @Query("SELECT FUNCTION('FORMAT', COALESCE(t.thoiGianTt, t.thoiGianTao), 'yyyy-MM-dd'), COALESCE(SUM(t.soTien), 0) "
            + "FROM ThanhToan t WHERE t.donHang IS NOT NULL AND t.trangThaiThanhToan = 2 "
            + "AND t.donHang.trangThaiDon NOT IN (5, 8, 9) "
            + "AND COALESCE(t.thoiGianTt, t.thoiGianTao) BETWEEN :tuNgay AND :denNgay "
            + "GROUP BY FUNCTION('FORMAT', COALESCE(t.thoiGianTt, t.thoiGianTao), 'yyyy-MM-dd') ORDER BY 1")
    List<Object[]> sumRevenueByDay(@Param("tuNgay") LocalDateTime tuNgay,
                                   @Param("denNgay") LocalDateTime denNgay);


    @Query("SELECT FUNCTION('MONTH', COALESCE(t.thoiGianTt, t.thoiGianTao)), COALESCE(SUM(t.soTien), 0) "
            + "FROM ThanhToan t WHERE t.donHang IS NOT NULL AND t.trangThaiThanhToan = 2 "
            + "AND t.donHang.trangThaiDon NOT IN (5, 8, 9) "
            + "AND FUNCTION('YEAR', COALESCE(t.thoiGianTt, t.thoiGianTao)) = :nam "
            + "GROUP BY FUNCTION('MONTH', COALESCE(t.thoiGianTt, t.thoiGianTao)) ORDER BY 1")
    List<Object[]> sumRevenueByMonth(@Param("nam") int nam);


    @Query("SELECT FUNCTION('YEAR', COALESCE(t.thoiGianTt, t.thoiGianTao)), COALESCE(SUM(t.soTien), 0) "
            + "FROM ThanhToan t WHERE t.donHang IS NOT NULL AND t.trangThaiThanhToan = 2 "
            + "AND t.donHang.trangThaiDon NOT IN (5, 8, 9) "
            + "GROUP BY FUNCTION('YEAR', COALESCE(t.thoiGianTt, t.thoiGianTao)) ORDER BY 1")
    List<Object[]> sumRevenueByYear();

    @Query("SELECT COALESCE(t.thoiGianTt, t.thoiGianTao), t.soTien FROM ThanhToan t "
            + "WHERE t.donHang IS NOT NULL AND t.trangThaiThanhToan = 2 "
            + "AND t.donHang.trangThaiDon NOT IN (5, 8, 9) "
            + "AND COALESCE(t.thoiGianTt, t.thoiGianTao) BETWEEN :tuNgay AND :denNgay")
    List<Object[]> findRevenueData(@Param("tuNgay") LocalDateTime tuNgay,
                                    @Param("denNgay") LocalDateTime denNgay);

    @Query("SELECT COUNT(DISTINCT t.donHang.maDonHang) FROM ThanhToan t "
            + "WHERE t.donHang IS NOT NULL AND t.trangThaiThanhToan = 2 "
            + "AND t.donHang.trangThaiDon NOT IN (5, 8, 9) "
            + "AND COALESCE(t.thoiGianTt, t.thoiGianTao) BETWEEN :tuNgay AND :denNgay")
    Long countCompletedOrders(@Param("tuNgay") LocalDateTime tuNgay,
                              @Param("denNgay") LocalDateTime denNgay);

    @Query("SELECT t.phuongThuc, COALESCE(SUM(t.soTien), 0) FROM ThanhToan t "
            + "WHERE t.donHang IS NOT NULL AND t.trangThaiThanhToan = 2 "
            + "AND t.donHang.trangThaiDon NOT IN (5, 8, 9) "
            + "AND COALESCE(t.thoiGianTt, t.thoiGianTao) BETWEEN :tuNgay AND :denNgay "
            + "GROUP BY t.phuongThuc")
    List<Object[]> sumRevenueByPaymentMethod(@Param("tuNgay") LocalDateTime tuNgay,
                                              @Param("denNgay") LocalDateTime denNgay);

    @Query("SELECT MIN(d.ngayDat) FROM DonHang d")
    LocalDateTime minNgayDat();

    @Query("SELECT FUNCTION('FORMAT', d.ngayDat, 'yyyy-MM-dd'), COUNT(d) "
            + "FROM DonHang d WHERE d.ngayDat BETWEEN :tuNgay AND :denNgay "
            + "GROUP BY FUNCTION('FORMAT', d.ngayDat, 'yyyy-MM-dd')")
    List<Object[]> countDonHangTheoNgay(@Param("tuNgay") LocalDateTime tuNgay,
                                        @Param("denNgay") LocalDateTime denNgay);

    @Query("SELECT FUNCTION('FORMAT', d.ngayDat, 'yyyy-MM-dd'), COUNT(d) "
            + "FROM DonHang d WHERE d.trangThaiDon = :trangThai AND d.ngayDat BETWEEN :tuNgay AND :denNgay "
            + "GROUP BY FUNCTION('FORMAT', d.ngayDat, 'yyyy-MM-dd')")
    List<Object[]> countDonHangTheoTrangThaiVaNgay(@Param("trangThai") Integer trangThai,
                                                   @Param("tuNgay") LocalDateTime tuNgay,
                                                   @Param("denNgay") LocalDateTime denNgay);

    @Query("SELECT d FROM DonHang d WHERE d.maDonHangCode = :maDonHangCode AND d.nguoiDung.email = :email")
    java.util.Optional<DonHang> findByMaDonHangCodeAndEmail(@Param("maDonHangCode") String maDonHangCode, @Param("email") String email);

    List<DonHang> findTop10ByOrderByNgayDatDesc();
    @Query("SELECT COUNT(d) FROM DonHang d WHERE d.loaiDonHang = 2 AND d.ngayDat >= :startOfDay")
    Long countTodayPosOrders(@Param("startOfDay") LocalDateTime startOfDay);
}
