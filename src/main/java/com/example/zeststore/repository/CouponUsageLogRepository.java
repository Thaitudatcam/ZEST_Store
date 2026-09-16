package com.example.zeststore.repository;

import com.example.zeststore.entity.CouponUsageLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CouponUsageLogRepository extends JpaRepository<CouponUsageLog, Long> {
    List<CouponUsageLog> findByMaCodeOrderByThoiGianDesc(String maCode);
    List<CouponUsageLog> findByMaNguoiDungOrderByThoiGianDesc(Integer maNguoiDung);

    boolean existsByMaCodeAndMaNguoiDung(String maCode, Integer maNguoiDung);

    List<CouponUsageLog> findByMaDonHangOrderByMaCodeAsc(Integer maDonHang);

    @org.springframework.data.jpa.repository.Query("select count(l) > 0 from CouponUsageLog l where l.maCode = :code and l.maNguoiDung = :userId and (l.loai is null or l.loai <> 'RESTORED')")
    boolean hasActiveUsage(@org.springframework.data.repository.query.Param("code") String code,
                           @org.springframework.data.repository.query.Param("userId") Integer userId);
}
