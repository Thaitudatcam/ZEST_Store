package com.example.zeststore.repository;

import com.example.zeststore.entity.TinNhanChatbot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TinNhanChatbotRepository extends JpaRepository<TinNhanChatbot, Integer> {
    List<TinNhanChatbot> findByHoiThoai_MaHoiThoai(Integer maHoiThoai);
}
