package com.example.zeststore.repository;

import com.example.zeststore.entity.NguoiDung;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface NguoiDungRepository extends JpaRepository<NguoiDung, Integer> {
    Optional<NguoiDung> findByEmail(String email);

    Optional<NguoiDung> findByEmailMoiChoXacThuc(String emailMoiChoXacThuc);

    Optional<NguoiDung> findBySoDienThoai(String soDienThoai);

    boolean existsByEmail(String email);

    boolean existsByEmailMoiChoXacThuc(String emailMoiChoXacThuc);

    boolean existsBySoDienThoai(String soDienThoai);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM NguoiDung u WHERE u.maNguoiDung = :id")
    Optional<NguoiDung> findByIdForUpdate(@Param("id") Integer id);

    @Query("SELECT u FROM NguoiDung u WHERE u.trangThai = 1 AND (LOWER(u.hoTen) LIKE LOWER(CONCAT('%', :q, '%')) OR u.soDienThoai LIKE CONCAT('%', :q, '%') OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<NguoiDung> searchCustomers(@Param("q") String query);

    @Query("SELECT u FROM NguoiDung u WHERE u.trangThai = 1 AND EXISTS (SELECT 1 FROM DonHang d WHERE d.nguoiDung.maNguoiDung = u.maNguoiDung AND d.trangThaiDon IN (4, 6))")
    List<NguoiDung> findCustomersDaMuaHang();

    /** Active users whose role is one of the given names (e.g. ADMIN, STAFF) — used to fan-out notifications. */
    List<NguoiDung> findByVaiTro_TenVaiTroInAndTrangThai(List<String> tenVaiTro, Integer trangThai);

    @Query("SELECT FUNCTION('FORMAT', n.ngayTao, 'yyyy-MM-dd'), COUNT(n) "
            + "FROM NguoiDung n WHERE n.ngayTao BETWEEN :tuNgay AND :denNgay "
            + "GROUP BY FUNCTION('FORMAT', n.ngayTao, 'yyyy-MM-dd')")
    List<Object[]> countNguoiDungTheoNgay(@Param("tuNgay") LocalDateTime tuNgay,
                                          @Param("denNgay") LocalDateTime denNgay);

    @Query("SELECT MIN(n.ngayTao) FROM NguoiDung n")
    LocalDateTime minNgayTao();
}
