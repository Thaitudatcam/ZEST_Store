package com.example.zeststore.repository;

import com.example.zeststore.entity.AiChatbot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiChatbotRepository extends JpaRepository<AiChatbot, Integer> {

    Optional<AiChatbot> findByTenChatbot(String tenChatbot);

    List<AiChatbot> findByTrangThai(String trangThai);
}
