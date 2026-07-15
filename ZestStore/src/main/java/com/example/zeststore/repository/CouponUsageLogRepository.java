package com.example.zeststore.repository;

import com.example.zeststore.entity.CouponUsageLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CouponUsageLogRepository extends JpaRepository<CouponUsageLog, Long> {
    List<CouponUsageLog> findByMaCodeOrderByThoiGianDesc(String maCode);
    List<CouponUsageLog> findByMaNguoiDungOrderByThoiGianDesc(Integer maNguoiDung);
}
