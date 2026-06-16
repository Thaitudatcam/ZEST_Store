package com.example.zeststore.repository;

import com.example.zeststore.entity.HoiThoaiChatbot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HoiThoaiChatbotRepository extends JpaRepository<HoiThoaiChatbot, Integer> {

    List<HoiThoaiChatbot> findByChatbot_MaChatbot(Integer maChatbot);

    List<HoiThoaiChatbot> findByNguoiDung_MaNguoiDung(Integer maNguoiDung);
}
