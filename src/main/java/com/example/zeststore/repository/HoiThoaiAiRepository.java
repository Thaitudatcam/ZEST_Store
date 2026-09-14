package com.example.zeststore.repository;

import com.example.zeststore.entity.HoiThoaiAi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HoiThoaiAiRepository extends JpaRepository<HoiThoaiAi, Integer> {
    List<HoiThoaiAi> findByMaNguoiDungOrderByNgayTaoDesc(Integer maNguoiDung);
}
