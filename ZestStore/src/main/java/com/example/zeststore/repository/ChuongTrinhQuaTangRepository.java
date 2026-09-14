package com.example.zeststore.repository;

import com.example.zeststore.entity.ChuongTrinhQuaTang;
import com.example.zeststore.entity.LoaiTrigger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChuongTrinhQuaTangRepository extends JpaRepository<ChuongTrinhQuaTang, Integer> {

    List<ChuongTrinhQuaTang> findByTrangThaiAndLoaiTrigger(Integer trangThai, LoaiTrigger loaiTrigger);

    List<ChuongTrinhQuaTang> findByTrangThaiAndLoaiTriggerAndDaChayXongAndNgayBatDauBefore(
            Integer trangThai, LoaiTrigger loaiTrigger, Boolean daChayXong, LocalDateTime now);

    List<ChuongTrinhQuaTang> findByTrangThaiAndLoaiTriggerNot(Integer trangThai, LoaiTrigger loaiTrigger);

    // Chương trình giảm giá theo đợt đang chạy (có giá trị giảm + trong thời gian hiệu lực)
    // Không fetch-join scope ở đây (tránh MultipleBagFetchException) —
    // CampaignDiscountService đọc lazy collection trong @Transactional.
    @Query("""
        SELECT c FROM ChuongTrinhQuaTang c
        WHERE c.trangThai = 1
        AND c.giaTriGiam IS NOT NULL
        AND (c.ngayBatDau IS NULL OR c.ngayBatDau <= :now)
        AND (c.ngayKetThuc IS NULL OR c.ngayKetThuc >= :now)
        """)
    List<ChuongTrinhQuaTang> findActiveDiscounts(@Param("now") LocalDateTime now);
}
