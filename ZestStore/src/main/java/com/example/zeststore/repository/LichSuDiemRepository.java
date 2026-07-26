package com.example.zeststore.repository;

import com.example.zeststore.entity.LichSuDiem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LichSuDiemRepository extends JpaRepository<LichSuDiem, Integer> {

    Page<LichSuDiem> findByNguoiDung_MaNguoiDungOrderByThoiGianDesc(Integer maNguoiDung, Pageable pageable);

    List<LichSuDiem> findByNguoiDung_MaNguoiDungOrderByThoiGianDesc(Integer maNguoiDung);

    @Query("SELECT l FROM LichSuDiem l WHERE l.ngayHetHan < :date AND l.loaiGiaoDich = 1 AND l.soDuSau > 0 ORDER BY l.ngayHetHan ASC")
    List<LichSuDiem> findExpiredBatches(@Param("date") LocalDate date);

    @Query("SELECT COALESCE(SUM(l.soDiem), 0) FROM LichSuDiem l WHERE l.nguoiDung.maNguoiDung = :maNguoiDung AND l.loaiGiaoDich = 1 AND (l.ngayHetHan IS NULL OR l.ngayHetHan >= :today)")
    Integer getTotalTichLuyConHan(@Param("maNguoiDung") Integer maNguoiDung, @Param("today") LocalDate today);
}
