package com.example.zeststore.repository;

import com.example.zeststore.entity.TinNhanAi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TinNhanAiRepository extends JpaRepository<TinNhanAi, Integer> {
    List<TinNhanAi> findByMaHoiThoaiOrderByNgayTaoAsc(Integer maHoiThoai);
}
