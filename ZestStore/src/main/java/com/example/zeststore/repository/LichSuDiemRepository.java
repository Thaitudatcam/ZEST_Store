package com.example.zeststore.repository;

import com.example.zeststore.entity.LichSuDiem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LichSuDiemRepository extends JpaRepository<LichSuDiem, Integer> {

    Page<LichSuDiem> findByNguoiDung_MaNguoiDungOrderByThoiGianDesc(Integer maNguoiDung, Pageable pageable);

    List<LichSuDiem> findByNguoiDung_MaNguoiDungOrderByThoiGianDesc(Integer maNguoiDung);

    @Query("SELECT l FROM LichSuDiem l WHERE l.loaiGiaoDich = 'TICH_LUY' AND l.soDiemConLai > 0 AND l.ngayHetHan <= :now ORDER BY l.ngayHetHan ASC")
    List<LichSuDiem> findExpiredBatches(@Param("now") LocalDateTime now);

    @Query("SELECT l FROM LichSuDiem l WHERE l.nguoiDung.maNguoiDung = :maNguoiDung AND l.loaiGiaoDich = 'TICH_LUY' AND l.soDiemConLai > 0 ORDER BY l.ngayTich ASC")
    List<LichSuDiem> findAvailableBatchesFifo(@Param("maNguoiDung") Integer maNguoiDung);

    @Query("SELECT COALESCE(SUM(l.soDiem), 0) FROM LichSuDiem l WHERE l.nguoiDung.maNguoiDung = :maNguoiDung AND l.loaiGiaoDich = 'TICH_LUY'")
    Integer sumTichLuy(@Param("maNguoiDung") Integer maNguoiDung);

    @Query("SELECT COALESCE(SUM(l.soDiem), 0) FROM LichSuDiem l WHERE l.nguoiDung.maNguoiDung = :maNguoiDung AND l.loaiGiaoDich IN ('SU_DUNG', 'HET_HAN')")
    Integer sumSuDung(@Param("maNguoiDung") Integer maNguoiDung);
}
