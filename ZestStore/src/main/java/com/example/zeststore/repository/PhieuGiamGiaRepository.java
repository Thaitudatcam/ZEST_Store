package com.example.zeststore.repository;

import com.example.zeststore.entity.PhieuGiamGia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PhieuGiamGiaRepository extends JpaRepository<PhieuGiamGia, Integer> {

    Optional<PhieuGiamGia> findByMaCode(String maCode);

    List<PhieuGiamGia> findByTrangThai(Integer trangThai);

    @Query("SELECT p FROM PhieuGiamGia p WHERE p.trangThai = 1 AND p.ngayXoa IS NULL "
            + "AND (p.ngayBatDau IS NULL OR p.ngayBatDau <= :now) "
            + "AND (p.ngayKetThuc IS NULL OR p.ngayKetThuc >= :now) "
            + "AND (:giaTriDon IS NULL OR p.giaTriDonToiThieu IS NULL OR p.giaTriDonToiThieu <= :giaTriDon) "
            + "AND (p.soLuong IS NULL OR p.soLuong > 0)")
    List<PhieuGiamGia> findValidCoupons(@Param("now") LocalDateTime now,
                                         @Param("giaTriDon") BigDecimal giaTriDon);
    List<PhieuGiamGia> findByNgayXoaIsNull();

    @Query("""
        SELECT p FROM PhieuGiamGia p
        WHERE (:ngayBatDau IS NULL OR p.ngayBatDau >= :ngayBatDau)
        AND (:ngayKetThuc IS NULL OR p.ngayKetThuc <= :ngayKetThuc)
        AND (:kieuGiamGia IS NULL OR p.kieuGiamGia = :kieuGiamGia)
        AND (:giaTriGiam IS NULL OR p.giaTriGiam = :giaTriGiam)
        AND p.ngayXoa IS NULL
        """)
    List<PhieuGiamGia> filterPhieuGiamGia(
            @Param("ngayBatDau") LocalDateTime ngayBatDau,
            @Param("ngayKetThuc") LocalDateTime ngayKetThuc,
            @Param("kieuGiamGia") Integer kieuGiamGia,  // 1 = phần trăm, 2 = tiền mặt
            @Param("giaTriGiam") BigDecimal giaTriGiam
    );
    long countByNgayXoaIsNull();
}
