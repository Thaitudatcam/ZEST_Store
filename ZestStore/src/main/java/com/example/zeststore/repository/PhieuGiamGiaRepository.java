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

    @Query("SELECT p FROM PhieuGiamGia p WHERE p.trangThai = 1 "
            + "AND p.ngayBatDau <= :now AND p.ngayKetThuc >= :now "
            + "AND (:giaTriDon IS NULL OR p.giaTriDonToiThieu IS NULL OR p.giaTriDonToiThieu <= :giaTriDon)")
    List<PhieuGiamGia> findValidCoupons(@Param("now") LocalDateTime now,
                                         @Param("giaTriDon") BigDecimal giaTriDon);
}
