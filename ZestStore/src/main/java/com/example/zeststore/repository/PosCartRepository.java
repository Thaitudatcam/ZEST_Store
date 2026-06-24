package com.example.zeststore.repository;

import com.example.zeststore.entity.PosCartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PosCartRepository extends JpaRepository<PosCartItem, Integer> {

    List<PosCartItem> findByAdmin_MaNguoiDung(Integer adminId);

    Optional<PosCartItem> findByAdmin_MaNguoiDungAndBienThe_MaBienThe(Integer adminId, Integer bienTheId);

    void deleteByAdmin_MaNguoiDung(Integer adminId);

    List<PosCartItem> findByNgayTaoBefore(LocalDateTime threshold);
}
