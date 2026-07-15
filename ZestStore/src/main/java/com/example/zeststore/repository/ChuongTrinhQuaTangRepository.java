package com.example.zeststore.repository;

import com.example.zeststore.entity.ChuongTrinhQuaTang;
import com.example.zeststore.entity.LoaiTrigger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChuongTrinhQuaTangRepository extends JpaRepository<ChuongTrinhQuaTang, Integer> {

    List<ChuongTrinhQuaTang> findByTrangThaiAndLoaiTrigger(Integer trangThai, LoaiTrigger loaiTrigger);

    List<ChuongTrinhQuaTang> findByTrangThaiAndLoaiTriggerAndDaChayXongAndNgayBatDauBefore(
            Integer trangThai, LoaiTrigger loaiTrigger, Boolean daChayXong, LocalDateTime now);

    List<ChuongTrinhQuaTang> findByTrangThaiAndLoaiTriggerNot(Integer trangThai, LoaiTrigger loaiTrigger);
}
